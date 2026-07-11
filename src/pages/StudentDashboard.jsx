import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { FolderUp, Sparkles, PenTool, Trash2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export default function StudentDashboard() {
  const { modules, user, submissions, deleteSubmission } = useAppContext();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  
  // Pagination state
  const [displayLimit, setDisplayLimit] = useState(6);
  const { ref: observerRef, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      setDisplayLimit(prev => prev + 6);
    }
  }, [inView]);

  if (!user) return null;

  // Filter submissions by this student and sort chronologically (oldest first) to show progression
  const studentSubmissions = submissions
    .filter(sub => sub.studentId === user.id)
    .sort((a, b) => a.timestamp - b.timestamp);

  const visibleModules = modules.filter(m => !m.hidden);
  
  const completedModulesCount = visibleModules.filter(mod => 
    studentSubmissions.some(s => s.moduleId === mod.id)
  ).length;
  
  const totalModulesCount = visibleModules.length;
  const progressPercentage = totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Olá, {user.name.split(' ')[0]}</h2>
        <p className="text-muted">Selecione um módulo para enviar o seu desenho.</p>
      </div>

      {totalModulesCount > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '-1rem' }}>
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="font-bold text-lg text-gradient">Seu Progresso no Curso</h3>
              <p className="text-sm text-muted">{completedModulesCount} de {totalModulesCount} desafios concluídos</p>
            </div>
            <span className="text-3xl font-bold text-primary">{progressPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${progressPercentage}%`, 
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                borderRadius: '999px',
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {visibleModules.map(mod => {
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
              
              <div className="mt-auto pt-4 flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap min-h-[24px]">
                  {hasEvaluated && <span className="badge badge-evaluated">Avaliado</span>}
                  {hasPending && <span className="badge badge-pending">Pendente</span>}
                </div>
                <button className="btn btn-primary w-full justify-center" style={{ padding: '0.6rem 1rem', fontSize: '0.875rem' }}>
                  <FolderUp size={16} />
                  Enviar Desenho
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {studentSubmissions.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Sua Galeria de Evolução</h3>
          </div>
          <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {studentSubmissions.slice(0, displayLimit).map(sub => {
                  const modName = modules.find(m => m.id === sub.moduleId)?.name;
                  return (
                    <div 
                      key={sub.id} 
                      style={{ 
                        borderRadius: '0.75rem', 
                        overflow: 'hidden', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        background: 'rgba(255,255,255,0.02)', 
                        cursor: 'pointer', 
                        position: 'relative',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}
                      className="hover:scale-105 hover:shadow-xl hover:border-primary/30"
                      onClick={() => setSelectedImage({ original: sub.imageUrl, evaluated: sub.evaluatedImageUrl })}
                    >
                       <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                         <img src={sub.imageUrl} alt="Desenho" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         {sub.evaluatedImageUrl && (
                           <img src={sub.evaluatedImageUrl} alt="Correção" loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                         )}
                       </div>
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
              
              {/* Intersection Observer target para paginação infinita */}
              {displayLimit < studentSubmissions.length && (
                <div ref={observerRef} className="py-6 text-center text-muted">
                  Carregando mais...
                </div>
              )}
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
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'inline-block' }}>
            <img 
              src={selectedImage.original} 
              alt="Desenho em tamanho real" 
              style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', borderRadius: '0.5rem' }} 
            />
            {selectedImage.evaluated && (
              <img 
                src={selectedImage.evaluated} 
                alt="Correção em tamanho real" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.5rem', pointerEvents: 'none' }} 
              />
            )}
          </div>
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
