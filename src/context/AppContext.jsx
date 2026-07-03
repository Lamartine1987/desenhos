import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to Modules
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modules'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(data.sort((a, b) => a.createdAt - b.createdAt));
    });
    return unsub;
  }, []);

  // Listen to Submissions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data.sort((a, b) => b.timestamp - a.timestamp));
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Check local storage for session
    const savedUser = localStorage.getItem('artreview_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Usuário não encontrado!' };
    } 

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.password === password) {
      const loggedUser = { id: userDoc.id, ...userData };
      setUser(loggedUser);
      localStorage.setItem('artreview_user', JSON.stringify(loggedUser));
      return { success: true, user: loggedUser };
    } else {
      return { success: false, error: 'Senha incorreta!' };
    }
  };

  const registerUser = async (name, phone, password, isProfessor = false) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: 'Este telefone já está cadastrado!' };
    }

    const newUser = {
      name,
      phone,
      password, // In a real app, hash this!
      role: isProfessor ? 'professor' : 'student'
    };
    
    const docRef = await addDoc(usersRef, newUser);
    const loggedUser = { id: docRef.id, ...newUser };
    
    setUser(loggedUser);
    localStorage.setItem('artreview_user', JSON.stringify(loggedUser));
    return { success: true, user: loggedUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('artreview_user');
  };

  const addModule = async (name, description) => {
    await addDoc(collection(db, 'modules'), {
      name,
      description,
      createdAt: Date.now()
    });
  };

  const addSubmission = async (moduleId, fileObj) => {
    if (!user) return;
    try {
      const moduleName = modules.find(m => m.id === moduleId)?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Modulo';
      const cleanStudentName = user.name.replace(/\s+/g, '_');
      const filename = `${cleanStudentName}_${moduleName}.jpg`;

      const storageRef = ref(storage, `submissions/${user.id}_${Date.now()}_${fileObj.name}`);
      const metadata = {
        contentDisposition: `attachment; filename="${filename}"`
      };
      await uploadBytes(storageRef, fileObj, metadata);
      const imageUrl = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'submissions'), {
        moduleId,
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

  const toggleModuleVisibility = async (moduleId, currentHiddenStatus) => {
    try {
      await updateDoc(doc(db, 'modules', moduleId), { hidden: !currentHiddenStatus });
      return { success: true };
    } catch (error) {
      console.error("Error toggling module visibility: ", error);
      return { success: false, error: 'Erro ao alterar visibilidade.' };
    }
  };

  return (
    <AppContext.Provider value={{
      user, login, registerUser, logout, loading,
      modules, addModule, deleteModule, toggleModuleVisibility,
      submissions, addSubmission, markEvaluated, deleteSubmission
    }}>
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
