import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { FolderUp, History, PenTool, Trash2 } from 'lucide-react';

export default function StudentDashboard() {
  const { modules, user, submissions, deleteSubmission } = useAppContext();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);

  if (!user) return null;

  // Filter submissions by this student
  const studentSubmissions = submissions.filter(sub => sub.studentId === user.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Olá, {user.name.split(' ')[0]}</h2>
        <p className="text-muted">Selecione um módulo para enviar o seu desenho.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {modules.filter(m => !m.hidden).map(mod => {
          const modSubmissions = studentSubmissions.filter(s => s.moduleId === mod.id);
          const hasPending = modSubmissions.some(s => s.status === 'pending');
          const hasEvaluated = modSubmissions.some(s => s.status === 'evaluated');
          
          return (
            <div 
              key={mod.id} 
              className="glass-card" 
              style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => navigate(`/aluno/modulo/${mod.id}`)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <PenTool className="text-primary" size={24} />
                </div>
                <h3 className="text-lg">{mod.name}</h3>
              </div>
              <p className="text-muted text-sm mb-6 flex-1">{mod.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  {hasEvaluated && <span className="badge badge-evaluated">Avaliado</span>}
                  {hasPending && <span className="badge badge-pending">Pendente</span>}
                </div>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  <FolderUp size={16} />
                  Enviar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {studentSubmissions.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Seu Histórico de Envios</h3>
          </div>
          <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
             <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {studentSubmissions.map(sub => {
                  const modName = modules.find(m => m.id === sub.moduleId)?.name;
                  return (
                    <div 
                      key={sub.id} 
                      style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', position: 'relative' }}
                      onClick={() => setSelectedImage(sub.imageUrl)}
                    >
                       <img src={sub.imageUrl} alt="Desenho" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                       {sub.status === 'pending' && (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             setSubmissionToDelete(sub.id);
                           }}
                           style={{
                             position: 'absolute', top: '0.5rem', right: '0.5rem',
                             background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                             border: 'none', borderRadius: '0.25rem', padding: '0.3rem',
                             cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                             boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                           }}
                           title="Excluir envio"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                       <div style={{ padding: '0.75rem' }}>
                          <p className="text-sm font-bold truncate" title={modName}>{modName}</p>
                          <div className="mt-2">
                            <span className={`badge ${sub.status === 'evaluated' ? 'badge-evaluated' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
                              {sub.status === 'evaluated' ? 'Avaliado' : 'Pendente'}
                            </span>
                          </div>
                       </div>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Desenho em tamanho real" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '0.5rem' }} 
          />
        </div>
      )}

      {submissionToDelete && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 110
          }}
        >
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 className="text-xl font-bold mb-4 text-gradient">Excluir Envio</h3>
            <p className="text-muted mb-8">
              Tem certeza que deseja excluir este envio?
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-outline" onClick={() => setSubmissionToDelete(null)}>Cancelar</button>
              <button 
                className="btn btn-danger" 
                onClick={async () => {
                  await deleteSubmission(submissionToDelete);
                  setSubmissionToDelete(null);
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
