import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Download, CheckCircle, DownloadCloud, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ProfessorSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modules, submissions, markEvaluated, user } = useAppContext();
  
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'evaluated'
  const [selectedImage, setSelectedImage] = useState(null);

  if (!user || user.role !== 'professor') return <div>Acesso negado</div>;

  const module = modules.find(m => m.id === id);
  if (!module) return <div>Módulo não encontrado</div>;

  const moduleSubmissions = submissions
    .filter(s => s.moduleId === id)
    .filter(s => filter === 'all' ? true : s.status === filter)
    .sort((a, b) => b.timestamp - a.timestamp); // latest first

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

      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient mb-2">{module.name}</h2>
          <p className="text-muted">Avaliando artes dos alunos.</p>
        </div>
        
        <div className="flex gap-4">
          <select 
            className="input-field" 
            style={{ width: 'auto', py: '0.5rem' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas as Artes</option>
            <option value="pending">Apenas Pendentes</option>
            <option value="evaluated">Já Avaliadas</option>
          </select>

          <button className="btn btn-primary" onClick={handleDownloadAll} disabled={moduleSubmissions.length === 0}>
            <DownloadCloud size={20} />
            Baixar .zip ({moduleSubmissions.length})
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {moduleSubmissions.map(sub => (
          <div key={sub.id} className="glass-card flex flex-col overflow-hidden">
            <div 
              style={{ position: 'relative', height: '250px', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer' }}
              onClick={() => setSelectedImage(sub.imageUrl)}
              title="Clique para ampliar"
            >
              <img 
                src={sub.imageUrl} 
                alt="Arte do Aluno" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
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
                    onClick={() => markEvaluated(sub.id)}
                    title="Marcar como Avaliado"
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
        ))}

        {moduleSubmissions.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted glass-panel flex flex-col items-center justify-center gap-4">
            <ImageIcon size={48} className="opacity-20" />
            <p>Nenhuma arte encontrada para este filtro.</p>
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
          <img 
            src={selectedImage} 
            alt="Desenho em tamanho real" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '0.5rem' }} 
          />
        </div>
      )}
    </div>
  );
}
