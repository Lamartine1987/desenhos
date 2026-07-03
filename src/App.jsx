import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ModuleUpload from './pages/ModuleUpload';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorSubmissions from './pages/ProfessorSubmissions';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user } = useAppContext();
  
  if (!user) return <Navigate to="/" replace />;
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to={user.role === 'professor' ? '/professor' : '/aluno'} replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Login />} />
        
        {/* Student Routes */}
        <Route path="aluno" element={
          <ProtectedRoute roleRequired="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="aluno/modulo/:id" element={
          <ProtectedRoute roleRequired="student">
            <ModuleUpload />
          </ProtectedRoute>
        } />

        {/* Professor Routes */}
        <Route path="professor" element={
          <ProtectedRoute roleRequired="professor">
            <ProfessorDashboard />
          </ProtectedRoute>
        } />
        <Route path="professor/modulo/:id" element={
          <ProtectedRoute roleRequired="professor">
            <ProfessorSubmissions />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
