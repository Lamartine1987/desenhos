import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Folder, Plus, Eye, EyeOff, Trash2, Users, Edit3 } from 'lucide-react';
import ProfessorUsers from '../components/ProfessorUsers';
import ProfessorAnalytics from '../components/ProfessorAnalytics';
import { BarChart3 } from 'lucide-react';
import { getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProfessorDashboard() {
  const { modules, addModule, submissions, user, deleteModule, toggleModuleVisibility, editModule } = useAppContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'users', 'analytics'
  const [showModal, setShowModal] = useState(false);
  const [newModName, setNewModName] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [moduleToEdit, setModuleToEdit] = useState(null);
  const [editModName, setEditModName] = useState('');
  const [editModDesc, setEditModDesc] = useState('');
  const [moduleCounts, setModuleCounts] = useState({});

  if (!user || user.role !== 'professor') return <div>Acesso negado</div>;

  const fetchCounts = React.useCallback(async () => {
    const counts = {};
    for (const mod of modules) {
      try {
        const pendingQ = query(collection(db, 'submissions'), where('moduleId', '==', mod.id), where('status', '==', 'pending'));
        const evalQ = query(collection(db, 'submissions'), where('moduleId', '==', mod.id), where('status', '==', 'evaluated'));
        
        const [pendingSnap, evalSnap] = await Promise.all([
          getCountFromServer(pendingQ),
          getCountFromServer(evalQ)
        ]);
        
        counts[mod.id] = {
          pending: pendingSnap.data().count,
          evaluated: evalSnap.data().count,
          total: pendingSnap.data().count + evalSnap.data().count
        };
      } catch (error) {
        console.error("Error fetching counts for module", mod.id, error);
        counts[mod.id] = { pending: 0, evaluated: 0, total: 0 };
      }
    }
    setModuleCounts(counts);
  }, [modules]);

  React.useEffect(() => {
    if (modules.length > 0 && activeTab === 'modules') {
      fetchCounts();
      const interval = setInterval(fetchCounts, 15000); // Auto refresh every 15s for real-time feel
      return () => clearInterval(interval);
    }
  }, [modules, activeTab, fetchCounts]);

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (newModName) {
      addModule(newModName, newModDesc);
      setNewModName('');
      setNewModDesc('');
      setShowModal(false);
    }
  };

  const handleEditModule = async (e) => {
    e.preventDefault();
    if (editModName && moduleToEdit) {
      await editModule(moduleToEdit.id, editModName, editModDesc);
      setModuleToEdit(null);
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
            const counts = moduleCounts[mod.id] || { pending: 0, evaluated: 0, total: 0 };
            const { pending: pendingCount, evaluated: evaluatedCount, total: totalCount } = counts;

            return (
              <div 
                key={mod.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  border: pendingCount > 0 ? '1.5px solid rgba(245, 158, 11, 0.6)' : undefined,
                  boxShadow: pendingCount > 0 ? '0 0 25px rgba(245, 158, 11, 0.35)' : undefined,
                  transition: 'all 0.3s ease'
                }}
                onClick={() => navigate(`/professor/modulo/${mod.id}`)}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="shrink-0" style={{ 
                      background: pendingCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(236, 72, 153, 0.2)', 
                      padding: '0.75rem', 
                      borderRadius: '0.75rem' 
                    }}>
                      <Folder className={pendingCount > 0 ? "text-warning" : "text-secondary"} size={24} />
                    </div>
                    <h3 className="text-xl font-bold" style={{ opacity: mod.hidden ? 0.5 : 1 }}>{mod.name}</h3>
                  </div>
                </div>
                <p className="text-muted text-sm mb-6 flex-1 line-clamp-2" style={{ opacity: mod.hidden ? 0.5 : 1 }}>{mod.description}</p>
                
                <div className="flex items-center gap-4 border-t" style={{ borderColor: 'var(--border-color)', paddingTop: '1rem' }}>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{totalCount}</span>
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

                <div className="flex justify-end gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
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
                       setEditModName(mod.name);
                       setEditModDesc(mod.description || '');
                       setModuleToEdit(mod);
                     }}
                     style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                     title="Editar módulo"
                   >
                     <Edit3 size={20} />
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

      {moduleToEdit && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
            <h3 className="text-xl font-bold mb-4">Editar Módulo</h3>
            <form onSubmit={handleEditModule}>
              <div className="input-group">
                <label className="input-label">Nome do Módulo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editModName} 
                  onChange={e => setEditModName(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group mb-6">
                <label className="input-label">Descrição</label>
                <textarea 
                  className="input-field" 
                  value={editModDesc} 
                  onChange={e => setEditModDesc(e.target.value)} 
                  rows={3}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button type="button" className="btn btn-outline" onClick={() => setModuleToEdit(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
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
