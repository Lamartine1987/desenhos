import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to Modules and Submissions based on user role
  useEffect(() => {
    if (!user) {
      setModules([]);
      setSubmissions([]);
      return;
    }

    // Listen to Modules (All authenticated users can read modules)
    const unsubModules = onSnapshot(collection(db, 'modules'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(data.sort((a, b) => a.createdAt - b.createdAt));
    }, (error) => {
      console.error("Error listening to modules: ", error);
    });

    // Listen to Submissions
    let subQuery;
    let unsubSubmissions = () => {};

    if (user.role === 'student') {
      subQuery = query(collection(db, 'submissions'), where('studentId', '==', user.id));
      unsubSubmissions = onSnapshot(subQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data.sort((a, b) => b.timestamp - a.timestamp));
      }, (error) => {
        console.error("Error listening to submissions: ", error);
      });
    } else {
      // Professor: We don't fetch all submissions globally anymore to save reads!
      setSubmissions([]);
    }

    return () => {
      unsubModules();
      unsubSubmissions();
    };
  }, [user]);

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from firestore using onSnapshot for real-time updates
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubUserDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.status === 'blocked') {
              await signOut(auth);
              setUser(null);
            } else {
              setUser({ id: firebaseUser.uid, email: firebaseUser.email, ...userData });
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
        if (unsubUserDoc) unsubUserDoc();
      }
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === 'blocked') {
          await signOut(auth);
          return { success: false, error: 'Sua conta foi bloqueada pelo administrador.' };
        }
        const loggedUser = { id: userCredential.user.uid, email: userCredential.user.email, ...userData };
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      } else {
        await signOut(auth);
        return { success: false, error: 'Dados do usuário não encontrados.' };
      }
    } catch (error) {
      console.error("Login error: ", error);
      return { success: false, error: 'E-mail ou senha incorretos!' };
    }
  };

  const registerUser = async (name, email, phone, password) => {
    try {
      console.log("=== INICIANDO CADASTRO ===");
      console.log("Email:", email);
      console.log("Firebase API Key usada:", auth.app.options.apiKey);
      console.log("Chamando createUserWithEmailAndPassword...");
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log("Usuário criado no auth com UID:", userCredential.user.uid);
      
      const newUser = {
        name,
        phone,
        email,
        role: 'student'
      };
      
      // Save extra data in Firestore using the auth UID
      console.log("Salvando dados no Firestore...");
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      const loggedUser = { id: userCredential.user.uid, ...newUser };
      setUser(loggedUser);
      console.log("Cadastro finalizado com sucesso!");
      return { success: true, user: loggedUser };
    } catch (error) {
      console.error("=== ERRO AO CADASTRAR ===");
      console.error("Código do erro:", error.code);
      console.error("Mensagem do erro:", error.message);
      console.error("Stack trace:", error.stack);
      console.dir(error); // Logs the entire error object
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Este e-mail já está em uso.' };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
      }
      if (error.code === 'auth/api-key-not-valid') {
         return { success: false, error: 'Chave de API do Firebase inválida. Verifique o arquivo firebase.js' };
      }
      return { success: false, error: 'Erro ao cadastrar. Veja o console.' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Reset password error: ", error);
      return { success: false, error: 'Erro ao enviar e-mail de recuperação. Verifique o e-mail digitado.' };
    }
  };

  const addModule = async (name, description) => {
    await addDoc(collection(db, 'modules'), {
      name,
      description,
      createdAt: Date.now(),
      lessons: []
    });
  };

  const addLesson = async (moduleId, title) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;
      const newLesson = { id: Date.now().toString(), title };
      const updatedLessons = [...(module.lessons || []), newLesson];
      await updateDoc(doc(db, 'modules', moduleId), { lessons: updatedLessons });
    } catch (error) {
      console.error("Error adding lesson:", error);
    }
  };

  const editLesson = async (moduleId, lessonId, newTitle) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;
      const updatedLessons = (module.lessons || []).map(l => 
        l.id === lessonId ? { ...l, title: newTitle } : l
      );
      await updateDoc(doc(db, 'modules', moduleId), { lessons: updatedLessons });
    } catch (error) {
      console.error("Error editing lesson:", error);
    }
  };

  const deleteLesson = async (moduleId, lessonId) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;
      const updatedLessons = (module.lessons || []).filter(l => l.id !== lessonId);
      await updateDoc(doc(db, 'modules', moduleId), { lessons: updatedLessons });
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
  };

  const addSubmission = async (moduleId, fileObj, lessonId = null, lessonTitle = null) => {
    if (!user) return;
    try {
      const moduleName = modules.find(m => m.id === moduleId)?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Modulo';
      const cleanStudentName = user.name.replace(/\s+/g, '_');
      const filename = `${cleanStudentName}_${moduleName}.jpg`;

      const storageRef = ref(storage, `submissions/${user.id}_${Date.now()}_${fileObj.name}`);
      const metadata = {
        contentDisposition: `attachment; filename="${filename}"`
      };

      // Compress image before upload
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.85
      };
      const compressedFile = await imageCompression(fileObj, options);

      await uploadBytes(storageRef, compressedFile, metadata);
      const imageUrl = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'submissions'), {
        moduleId,
        lessonId,
        lessonTitle,
        studentId: user.id,
        studentName: user.name,
        imageUrl,
        status: 'pending',
        timestamp: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error("Error adding submission: ", error);
      return { success: false, error: 'Erro ao enviar imagem.' };
    }
  };

  const markEvaluated = async (submissionId) => {
    const subRef = doc(db, 'submissions', submissionId);
    await updateDoc(subRef, { status: 'evaluated' });
  };

  const saveEvaluation = async (submissionId, fileObj) => {
    try {
      const storageRef = ref(storage, `evaluations/${submissionId}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, fileObj);
      const evaluatedImageUrl = await getDownloadURL(storageRef);

      const subRef = doc(db, 'submissions', submissionId);
      await updateDoc(subRef, { 
        status: 'evaluated',
        evaluatedImageUrl,
        evaluationTimestamp: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error("Error saving evaluation: ", error);
      return { success: false, error: 'Erro ao salvar avaliação.' };
    }
  };

  const deleteSubmission = async (submissionId) => {
    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting submission: ", error);
      return { success: false, error: 'Erro ao excluir o desenho.' };
    }
  };

  const deleteModule = async (moduleId) => {
    try {
      await deleteDoc(doc(db, 'modules', moduleId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting module: ", error);
      return { success: false, error: 'Erro ao excluir módulo.' };
    }
  };

  const editModule = async (moduleId, newName, newDescription) => {
    try {
      await updateDoc(doc(db, 'modules', moduleId), {
        name: newName,
        description: newDescription
      });
      return { success: true };
    } catch (error) {
      console.error("Error editing module: ", error);
      return { success: false, error: 'Erro ao editar módulo.' };
    }
  };

  const toggleModuleVisibility = async (moduleId, currentHiddenStatus) => {
    try {
      await updateDoc(doc(db, 'modules', moduleId), { hidden: !currentHiddenStatus });
      return { success: true };
    } catch (error) {
      console.error("Error toggling module visibility: ", error);
      return { success: false, error: 'Erro ao alterar visibilidade.' };
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching users: ", error);
      return [];
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      return { success: true };
    } catch (error) {
      console.error("Error updating user role: ", error);
      return { success: false, error: 'Erro ao atualizar permissão.' };
    }
  };

  const toggleUserBlock = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      return { success: true };
    } catch (error) {
      console.error("Error toggling user block status: ", error);
      return { success: false, error: 'Erro ao bloquear/desbloquear usuário.' };
    }
  };

  const updateUserProfile = async (newName, currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Usuário não logado.' };
    try {
      await updateDoc(doc(db, 'users', user.id), { name: newName });
      
      if (newPassword) {
        if (!currentPassword) {
          return { success: false, error: 'Para alterar a senha, digite a sua senha atual.' };
        }
        
        try {
          // Re-authenticate user first
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          
          // Then update the password
          await updatePassword(auth.currentUser, newPassword);
        } catch (pwError) {
          console.error("Error updating password: ", pwError);
          if (pwError.code === 'auth/invalid-credential' || pwError.code === 'auth/wrong-password') {
            return { success: false, error: 'A senha atual está incorreta.' };
          }
          if (pwError.code === 'auth/weak-password') {
            return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
          }
          return { success: false, error: 'Erro ao alterar a senha.' };
        }
      }
      
      const updatedUser = { ...user, name: newName };
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error("Error updating profile: ", error);
      return { success: false, error: 'Erro ao atualizar perfil.' };
    }
  };

  return (
    <AppContext.Provider value={{
      user, login, registerUser, logout, resetPassword, loading,
      modules, addModule, deleteModule, editModule, toggleModuleVisibility, addLesson, editLesson, deleteLesson,
      submissions, addSubmission, markEvaluated, saveEvaluation, deleteSubmission,
      fetchUsers, updateUserRole, toggleUserBlock, updateUserProfile
    }}>
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
