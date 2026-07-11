import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Palette, UserCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Layout() {
  const { user, logout, updateUserProfile, deleteAccount } = useAppContext();
  const navigate = useNavigate();

  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [profileName, setProfileName] = React.useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = React.useState('');
  const [profileNewPassword, setProfileNewPassword] = React.useState('');
  const [profileError, setProfileError] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteError, setDeleteError] = React.useState('');

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

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('A senha é obrigatória.');
      return;
    }
    setDeleteError('');
    const result = await deleteAccount(deletePassword);
    if (result.success) {
      setShowProfileModal(false);
      navigate('/');
    } else {
      setDeleteError(result.error || 'Erro ao excluir conta.');
    }
  };

  const handleLogout = async () => {
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

            {user?.role === 'student' && (
              <>
                <div className="mt-8 mb-4">
                  <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#ef4444' }}>Zona de Perigo</p>
                  <div style={{ height: '1px', background: '#ef4444', opacity: 0.3, width: '100%' }}></div>
                </div>

                {!showDeleteConfirm ? (
                  <button 
                    type="button" 
                    className="btn w-full justify-center" 
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Excluir Minha Conta
                  </button>
                ) : (
                  <form onSubmit={handleDeleteAccount} className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <p className="text-sm font-medium mb-3" style={{ color: '#ef4444' }}>
                      Atenção: Esta ação é irreversível. Todas as suas artes e avaliações serão perdidas. Digite sua senha para confirmar:
                    </p>
                    {deleteError && <div className="text-xs mb-2 font-bold" style={{ color: '#ef4444' }}>{deleteError}</div>}
                    <input 
                      type="password" 
                      className="input-field mb-3" 
                      placeholder="Sua senha atual"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-outline flex-1 justify-center" onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); setDeletePassword(''); }}>Cancelar</button>
                      <button type="submit" className="btn flex-1 justify-center" style={{ background: '#ef4444', color: 'white', border: 'none' }}>Confirmar</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <main className="container flex-1 py-8">
        <Outlet />
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem 0', marginTop: 'auto' }}>
        <div className="container flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} ArtReview. Todos os direitos reservados.
          </p>
          <a 
            href="https://wa.me/5581995734837" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-gradient hover:opacity-80 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <span className="text-muted font-medium">Desenvolvido por</span> LamaTech
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#25D366' }}>
              <path d="M21.5 12.5C21.5 17.7467 17.2467 22 12 22C10.2764 22 8.66014 21.5422 7.28892 20.7612L2.5 22L3.73877 17.2111C2.95777 15.8399 2.5 14.2236 2.5 12.5C2.5 7.25329 6.75329 3 12 3C17.2467 3 21.5 7.25329 21.5 12.5Z" />
              <path d="M9.5 9.5C9.5 9.22386 9.72386 9 10 9H10.5C10.7761 9 11 9.22386 11 9.5V9.5C11 10.3284 11.6716 11 12.5 11H13.5C14.3284 11 15 11.6716 15 12.5V13.5C15 13.7761 14.7761 14 14.5 14H14C11.5147 14 9.5 11.9853 9.5 9.5V9.5Z" fill="currentColor"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
