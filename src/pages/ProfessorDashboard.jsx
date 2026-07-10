import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Folder, Plus, Eye, EyeOff, Trash2, Users } from 'lucide-react';
import ProfessorUsers from '../components/ProfessorUsers';
import ProfessorAnalytics from '../components/ProfessorAnalytics';
import { BarChart3 } from 'lucide-react';

export default function ProfessorDashboard() {
  const { modules, addModule, submissions, user, deleteModule, toggleModuleVisibility } = useAppContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'users', 'analytics'
  const [showModal, setShowModal] = useState(false);
  const [newModName, setNewModName] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [moduleToDelete, setModuleToDelete] = useState(null);

  if (!user || user.role !== 'professor') return <div>Acesso negado</div>;

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (newModName) {
      addModule(newModName, newModDesc);
      setNewModName('');
      setNewModDesc('');
      setShowModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="flex justify-between items-center mobile-col gap-4">
        <div className="mobile-w-full">
          <h2 className="text-3xl font-bold mb-2">Painel do Professor</h2>
          <p className="text-muted">Gerencie seus módulos, usuários e avalie os desenhos.</p>
        </div>
        {activeTab === 'modules' && (
          <button className="btn btn-primary mobile-w-full w-max" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Novo Módulo
          </button>
        )}
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <Folder size={18} />
          Módulos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Gerenciar Usuários
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Estatísticas
        </button>
      </div>

      {activeTab === 'modules' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {modules.map(mod => {
            const modSubmissions = submissions.filter(s => s.moduleId === mod.id);
            const pendingCount = modSubmissions.filter(s => s.status === 'pending').length;
            const evaluatedCount = modSubmissions.filter(s => s.status === 'evaluated').length;

            return (
              <div 
                key={mod.id} 
                className="glass-card" 
                style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate(`/professor/modulo/${mod.id}`)}
              >
                <div className="flex items-center gap-3 mb-2 justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                      <Folder className="text-secondary" size={24} />
                    </div>
                    <h3 className="text-xl font-bold" style={{ opacity: mod.hidden ? 0.5 : 1 }}>{mod.name}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                     <button
                       onClick={async (e) => {
                         e.stopPropagation();
                         await toggleModuleVisibility(mod.id, mod.hidden);
                       }}
                       style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                       title={mod.hidden ? "Mostrar para alunos" : "Ocultar dos alunos"}
                     >
                       {mod.hidden ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setModuleToDelete(mod);
                       }}
                       style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                       title="Excluir módulo"
                     >
                       <Trash2 size={20} />
                     </button>
                  </div>
                </div>
                <p className="text-muted text-sm mb-6 flex-1 line-clamp-2" style={{ opacity: mod.hidden ? 0.5 : 1 }}>{mod.description}</p>
                
                <div className="flex items-center gap-4 border-t" style={{ borderColor: 'var(--border-color)', paddingTop: '1rem' }}>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{modSubmissions.length}</span>
                    <span className="text-xs text-muted uppercase tracking-wider">Total</span>
                  </div>
                  <div className="flex flex-col text-warning">
                    <span className="text-2xl font-bold">{pendingCount}</span>
                    <span className="text-xs uppercase tracking-wider">Pendentes</span>
                  </div>
                  <div className="flex flex-col text-success">
                    <span className="text-2xl font-bold">{evaluatedCount}</span>
                    <span className="text-xs uppercase tracking-wider">Avaliados</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'users' ? (
        <ProfessorUsers />
      ) : (
        <ProfessorAnalytics />
      )}

      {showModal && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
            <h3 className="text-xl font-bold mb-4">Criar Novo Módulo</h3>
            <form onSubmit={handleCreateModule}>
              <div className="input-group">
                <label className="input-label">Nome do Módulo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newModName} 
                  onChange={e => setNewModName(e.target.value)} 
                  required 
                  placeholder="Ex: Módulo 4 - Cores"
                />
              </div>
              <div className="input-group mb-6">
                <label className="input-label">Descrição</label>
                <textarea 
                  className="input-field" 
                  value={newModDesc} 
                  onChange={e => setNewModDesc(e.target.value)} 
                  rows={3}
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moduleToDelete && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 60
          }}
        >
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 className="text-xl font-bold mb-4 text-gradient">Excluir Módulo</h3>
            <p className="text-muted mb-8">
              Tem certeza que deseja excluir o módulo "{moduleToDelete.name}"?<br/><br/>
              <span className="text-sm">Todos os envios nele ficarão órfãos.</span>
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-outline" onClick={() => setModuleToDelete(null)}>Cancelar</button>
              <button 
                className="btn btn-danger" 
                onClick={async () => {
                  await deleteModule(moduleToDelete.id);
                  setModuleToDelete(null);
                }}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
