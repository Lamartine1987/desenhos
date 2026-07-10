import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Users, Shield } from 'lucide-react';

export default function ProfessorUsers() {
  const { fetchUsers, updateUserRole, user: currentUser } = useAppContext();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsers();
    setUsersList(data);
    setLoading(false);
  };

  const handleToggleRole = async (userId, currentRole) => {
    if (userId === currentUser.id) return; // Prevent self-demotion

    const newRole = currentRole === 'professor' ? 'student' : 'professor';
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted">Carregando usuários...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-primary" size={24} />
          <h3 className="text-xl font-bold">Gerenciar Permissões</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="pb-3 text-muted font-medium">Nome</th>
                <th className="pb-3 text-muted font-medium">Telefone</th>
                <th className="pb-3 text-muted font-medium">Cargo Atual</th>
                <th className="pb-3 text-muted font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-4 font-medium">{u.name} {u.id === currentUser.id && '(Você)'}</td>
                  <td className="py-4 text-muted">{u.phone}</td>
                  <td className="py-4">
                    {u.role === 'professor' ? (
                      <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>
                        <Shield size={14} className="inline mr-1" /> Professor
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#d4d4d8' }}>
                        Aluno
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      className={`btn ${u.role === 'professor' ? 'btn-outline' : 'btn-primary'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: u.id === currentUser.id ? 0.5 : 1 }}
                      disabled={u.id === currentUser.id}
                      onClick={() => handleToggleRole(u.id, u.role)}
                    >
                      {u.role === 'professor' ? 'Tornar Aluno' : 'Tornar Professor'}
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-muted">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
