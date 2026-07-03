import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Palette } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Layout() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

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
              <span className="text-muted hidden sm:inline">{user.name}</span>
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

      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}
