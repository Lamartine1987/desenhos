import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Users, Shield, Search, Ban, CheckCircle } from 'lucide-react';

export default function ProfessorUsers() {
  const { fetchUsers, updateUserRole, toggleUserBlock, user: currentUser } = useAppContext();
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');

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
      setAlertMessage(result.error);
    }
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    if (userId === currentUser.id) return;

    const result = await toggleUserBlock(userId, currentStatus);
    if (result.success) {
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } else {
      setAlertMessage(result.error);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const query = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(query);
    const emailMatch = u.email?.toLowerCase().includes(query);
    const phoneMatch = u.phone?.toLowerCase().includes(query);
    return nameMatch || emailMatch || phoneMatch;
  });

  if (loading) {
    return <div className="text-center py-12 text-muted">Carregando usuários...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="flex items-center justify-between mb-6 mobile-col gap-4">
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Gerenciar Permissões</h3>
          </div>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="mobile-w-full">
            <Search style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', minWidth: '300px', paddingLeft: '2.75rem' }}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="pb-3 text-muted font-medium">Nome</th>
                <th className="pb-3 text-muted font-medium">Email</th>
                <th className="pb-3 text-muted font-medium">Telefone</th>
                <th className="pb-3 text-muted font-medium">Cargo Atual</th>
                <th className="pb-3 text-muted font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: u.status === 'blocked' ? 0.6 : 1 }}>
                  <td className="py-4 font-medium">
                    {u.name} {u.id === currentUser.id && '(Você)'}
                    {u.status === 'blocked' && <span className="text-xs text-danger ml-2 font-bold uppercase">Bloqueado</span>}
                  </td>
                  <td className="py-4 text-muted text-sm">{u.email || '-'}</td>
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
                    <div className="flex justify-end gap-2">
                      <button 
                        className={`btn ${u.role === 'professor' ? 'btn-outline' : 'btn-primary'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: u.id === currentUser.id ? 0.5 : 1 }}
                        disabled={u.id === currentUser.id}
                        onClick={() => handleToggleRole(u.id, u.role)}
                        title={u.role === 'professor' ? "Rebaixar para aluno" : "Promover a professor"}
                      >
                        {u.role === 'professor' ? 'Tornar Aluno' : 'Tornar Prof.'}
                      </button>
                      
                      {u.id !== currentUser.id && (
                        <button
                          className={`btn ${u.status === 'blocked' ? 'btn-success' : 'btn-danger'} flex items-center gap-1`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => handleToggleBlock(u.id, u.status)}
                          title={u.status === 'blocked' ? "Desbloquear acesso" : "Bloquear acesso"}
                        >
                          {u.status === 'blocked' ? (
                            <><CheckCircle size={16} /> Desbloquear</>
                          ) : (
                            <><Ban size={16} /> Bloquear</>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-muted">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Alerta Moderno */}
      {alertMessage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            zIndex: 100
          }}
        >
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '400px', position: 'relative', background: 'white', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--main)' }}>Aviso</h3>
            <p className="text-muted" style={{ marginBottom: '24px', lineHeight: '1.5' }}>{alertMessage}</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAlertMessage('')}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
