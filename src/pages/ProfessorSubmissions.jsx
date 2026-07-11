import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Download, CheckCircle, DownloadCloud, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import EvaluationStudio from '../components/EvaluationStudio';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useInView } from 'react-intersection-observer';

export default function ProfessorSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modules, saveEvaluation, user } = useAppContext();
  
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'evaluated'
  const [selectedImage, setSelectedImage] = useState(null);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [moduleSubmissions, setModuleSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  
  // Pagination state
  const [displayCount, setDisplayCount] = useState(20);
  const { ref: observerRef, inView } = useInView();

  React.useEffect(() => {
    if (inView) {
      setDisplayCount(prev => prev + 20);
    }
  }, [inView]);

  React.useEffect(() => {
    const fetchModSubs = async () => {
      setLoadingSubs(true);
      try {
        const q = query(collection(db, 'submissions'), where('moduleId', '==', id));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // sort by timestamp descending
        data.sort((a, b) => b.timestamp - a.timestamp);
        setModuleSubmissions(data);
      } catch (err) {
        console.error("Error fetching module submissions", err);
      }
      setLoadingSubs(false);
    };
    if (user && user.role === 'professor') {
      fetchModSubs();
    }
  }, [id, user]);

  if (!user || user.role !== 'professor') return <div>Acesso negado</div>;

  const module = modules.find(m => m.id === id);
  if (!module) return <div>Módulo não encontrado</div>;

  const filteredSubmissions = moduleSubmissions
    .filter(s => filter === 'all' ? true : s.status === filter)
    .sort((a, b) => {
      if (filter === 'evaluated') {
        const timeA = a.evaluationTimestamp || a.timestamp || 0;
        const timeB = b.evaluationTimestamp || b.timestamp || 0;
        return timeB - timeA;
      }
      return b.timestamp - a.timestamp;
    });
  
  const displayedSubmissions = filteredSubmissions.slice(0, displayCount);

  const handleDownloadSingle = async (sub) => {
    try {
      let fetchUrl = sub.imageUrl;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        fetchUrl = sub.imageUrl.replace('https://firebasestorage.googleapis.com', '/firebasestorage');
      }

      const response = await fetch(fetchUrl);
      const blob = await response.blob();
      saveAs(blob, `${sub.studentName.replace(/\s+/g, '_')}_${module.name}.jpg`);
    } catch (error) {
      console.error('Error downloading image', error);
      // Fallback for data URLs or CORS issues
      const a = document.createElement('a');
      a.href = sub.imageUrl;
      a.download = `${sub.studentName.replace(/\s+/g, '_')}_${module.name}.jpg`;
      a.click();
    }
  };

  const handleDownloadAll = async () => {
    if (moduleSubmissions.length === 0) return;
    
    const zip = new JSZip();
    const folder = zip.folder(`Artes_${module.name}`);
    
    // Create promises for fetching all images
    const promises = moduleSubmissions.map(async (sub, index) => {
      try {
         let fetchUrl = sub.imageUrl;
         if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
           fetchUrl = sub.imageUrl.replace('https://firebasestorage.googleapis.com', '/firebasestorage');
         }
         const response = await fetch(fetchUrl);
         const blob = await response.blob();
         folder.file(`${sub.studentName.replace(/\s+/g, '_')}_${index}.jpg`, blob);
      } catch(e) {
         console.error('Failed to fetch to zip', e);
         // if it's base64 data url
         if(sub.imageUrl.startsWith('data:image')) {
            const base64Data = sub.imageUrl.split(',')[1];
            folder.file(`${sub.studentName.replace(/\s+/g, '_')}_${index}.jpg`, base64Data, {base64: true});
         }
      }
    });

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Submissoes_${module.name}.zip`);
  };

  return (
    <div className="flex flex-col gap-6">
      <button 
        onClick={() => navigate('/professor')} 
        className="btn btn-outline w-max"
        style={{ padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="flex justify-between items-center mobile-col gap-4">
        <div className="mobile-w-full">
          <h2 className="text-3xl font-bold text-gradient mb-2">{module.name}</h2>
          <p className="text-muted">Avaliando artes dos alunos.</p>
        </div>
        
        <div className="flex mobile-col gap-4 mobile-w-full">
          <select 
            className="input-field flex-1" 
            style={{ width: 'auto', padding: '0.6rem 1rem' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas as Artes</option>
            <option value="pending">Apenas Pendentes</option>
            <option value="evaluated">Já Avaliadas</option>
          </select>

          <button className="btn btn-primary flex-1" onClick={handleDownloadAll} disabled={moduleSubmissions.length === 0}>
            <DownloadCloud size={20} />
            Baixar .zip ({moduleSubmissions.length})
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {loadingSubs ? (
          <div className="col-span-full py-12 text-center text-muted">Carregando desenhos...</div>
        ) : (
          displayedSubmissions.map(sub => (
          <div key={sub.id} className="glass-card flex flex-col overflow-hidden">
            <div 
              style={{ position: 'relative', height: '250px', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer' }}
              onClick={() => setSelectedImage({ original: sub.imageUrl, evaluated: sub.evaluatedImageUrl })}
              title="Clique para ampliar"
            >
              <img 
                src={sub.imageUrl} 
                alt="Arte do Aluno" 
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {sub.evaluatedImageUrl && (
                <img 
                  src={sub.evaluatedImageUrl} 
                  alt="Correção do Professor" 
                  loading="lazy"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
                />
              )}
              <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
                <span className={`badge ${sub.status === 'evaluated' ? 'badge-evaluated' : 'badge-pending'}`} style={{ backdropFilter: 'blur(4px)' }}>
                  {sub.status === 'evaluated' ? 'Avaliado' : 'Pendente'}
                </span>
              </div>
            </div>
            
            <div className="p-4 flex flex-col gap-4 flex-1">
              <div>
                <h3 className="font-bold text-lg">{sub.studentName}</h3>
                <p className="text-sm text-muted">
                  Enviado em {new Date(sub.timestamp).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button 
                  className="btn btn-outline flex-1"
                  style={{ padding: '0.5rem' }}
                  onClick={() => handleDownloadSingle(sub)}
                  title="Baixar imagem"
                >
                  <Download size={18} />
                </button>
                
                {sub.status === 'pending' ? (
                  <button 
                    className="btn btn-primary flex-1"
                    style={{ padding: '0.5rem' }}
                    onClick={() => setEvaluatingSubmission(sub)}
                    title="Avaliar e Corrigir"
                  >
                    <CheckCircle size={18} />
                    Avaliar
                  </button>
                ) : (
                  <button 
                    className="btn flex-1 cursor-default opacity-50"
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--success)' }}
                    disabled
                  >
                    <CheckCircle size={18} />
                    Concluído
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

        {/* Observer Target for Infinite Scroll */}
        {!loadingSubs && displayedSubmissions.length < filteredSubmissions.length && (
          <div ref={observerRef} className="col-span-full py-8 text-center text-muted">
            Carregando mais desenhos...
          </div>
        )}

        {!loadingSubs && filteredSubmissions.length === 0 && (
          <div className="col-span-full py-16 text-center glass-panel flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(255,255,255,0.02)', borderStyle: 'dashed', borderWidth: '2px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
              <ImageIcon size={48} className="text-primary opacity-80" />
            </div>
            <h3 className="text-xl font-bold mt-2 text-gradient">Nenhuma arte por aqui!</h3>
            <p className="text-muted max-w-md">
              {filter === 'pending' 
                ? "Oba! Parece que você já corrigiu todos os desenhos pendentes deste módulo. Excelente trabalho!" 
                : filter === 'evaluated' 
                  ? "Você ainda não avaliou nenhuma arte neste módulo. Quando você corrigir, elas aparecerão aqui." 
                  : "Nenhum aluno enviou desenhos para este módulo ainda. Aguarde os primeiros envios!"}
            </p>
          </div>
        )}
      </div>

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

      {evaluatingSubmission && (
        <EvaluationStudio 
          submission={evaluatingSubmission} 
          onClose={() => setEvaluatingSubmission(null)}
          onSave={async (file) => {
            const result = await saveEvaluation(evaluatingSubmission.id, file);
            if (result.success) {
              // Update local state to remove it from pending immediately
              setModuleSubmissions(prev => prev.map(s => 
                s.id === evaluatingSubmission.id 
                  ? { ...s, status: 'evaluated', evaluatedImageUrl: 'saved' } 
                  : s
              ));
              setEvaluatingSubmission(null);
            } else {
              alert(result.error); // Fallback error handling
            }
          }}
        />
      )}
    </div>
  );
}
