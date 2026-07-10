import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Palette, UserCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Layout() {
  const { user, logout, updateUserProfile } = useAppContext();
  const navigate = useNavigate();

  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [profileName, setProfileName] = React.useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = React.useState('');
  const [profileNewPassword, setProfileNewPassword] = React.useState('');
  const [profileError, setProfileError] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState('');

  React.useEffect(() => {
    if (user) setProfileName(user.name);
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (profileNewPassword && profileNewPassword.length < 6) {
      setProfileError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    if (profileNewPassword && !profileCurrentPassword) {
      setProfileError('Para alterar a senha, você precisa digitar a sua senha atual primeiro.');
      return;
    }

    const result = await updateUserProfile(profileName, profileCurrentPassword, profileNewPassword);
    if (result.success) {
      setProfileSuccess('Perfil atualizado com sucesso!');
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setTimeout(() => setShowProfileModal(false), 2000);
    } else {
      setProfileError(result.error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="navbar-dark" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <Palette className="text-primary" size={28} />
            <h1 className="text-xl font-bold" style={{ color: 'white' }}>ArtReview</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowProfileModal(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontSize: '0.95rem'
                }}
              >
                <UserCircle size={20} />
                <span className="hidden sm:inline" style={{ color: 'white' }}>{user.name}</span>
              </button>
              <button 
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.5rem 1rem' }}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {showProfileModal && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-gradient">Meu Perfil</h3>
            
            {profileError && <div className="p-3 bg-danger/10 text-danger rounded-md mb-4 text-sm font-medium border border-danger/20">{profileError}</div>}
            {profileSuccess && <div className="p-3 bg-success/10 text-success rounded-md mb-4 text-sm font-medium border border-success/20">{profileSuccess}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="input-group">
                <label className="input-label">Nome de Exibição</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={profileName} 
                  onChange={e => setProfileName(e.target.value)} 
                  required 
                />
              </div>

              <div className="mt-6 mb-4">
                <p className="text-sm text-muted font-bold uppercase tracking-wider mb-2">Alterar Senha (Opcional)</p>
                <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }}></div>
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Senha Atual</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Só preencha se for alterar a senha"
                  value={profileCurrentPassword} 
                  onChange={e => setProfileCurrentPassword(e.target.value)} 
                />
              </div>

              <div className="input-group mb-6">
                <label className="input-label">Nova Senha</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Deixe em branco para não alterar"
                  value={profileNewPassword} 
                  onChange={e => setProfileNewPassword(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary w-full justify-center">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}
