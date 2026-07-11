import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { UploadCloud, CheckCircle, ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function ModuleUpload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modules, addSubmission, user, submissions, deleteSubmission } = useAppContext();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  
  const fileInputRef = useRef(null);
  
  const module = modules.find(m => m.id === id);
  
  if (!module) return <div>Módulo não encontrado</div>;

  const applyWatermark = (originalFile, text) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(img, 0, 0);
          
          const fontSize = Math.max(20, Math.floor(img.width * 0.03));
          ctx.font = `bold ${fontSize}px sans-serif`;
          
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;
          
          const padding = fontSize * 0.5;
          const rectWidth = textWidth + (padding * 2);
          const rectHeight = textHeight + (padding * 2);
          
          const margin = fontSize;
          const x = canvas.width - rectWidth - margin;
          const y = canvas.height - rectHeight - margin;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, rectWidth, rectHeight, 8);
          } else {
            ctx.fillRect(x, y, rectWidth, rectHeight);
          }
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(text, x + padding, y + padding);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], originalFile.name, { type: 'image/jpeg', lastModified: Date.now() });
              resolve({ file: watermarkedFile, dataUrl: canvas.toDataURL('image/jpeg', 0.9) });
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(originalFile);
    });
  };

  const processFile = async (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const result = await applyWatermark(selectedFile, user.name);
      if (result) {
        setFile(result.file);
        setPreview(result.dataUrl);
      } else {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!file) return;
    
    setIsUploading(true);
    const result = await addSubmission(module.id, file, selectedLesson?.id, selectedLesson?.title);
    setIsUploading(false);
    
    if (result && result.success) {
      setFile(null);
      setPreview(null);
      setSelectedLesson(null);
    } else if (result) {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <button 
        onClick={() => {
          if (selectedLesson) {
            setSelectedLesson(null);
            setFile(null);
            setPreview(null);
          } else {
            navigate('/aluno');
          }
        }} 
        className="btn btn-outline w-max"
        style={{ padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div>
        <h2 className="text-3xl font-bold text-gradient mb-2">{module.name} {selectedLesson && `- ${selectedLesson.title}`}</h2>
        <p className="text-muted">
          {!selectedLesson 
            ? "Selecione uma aula abaixo para enviar o seu desenho."
            : "Envie seu desenho para avaliação desta aula."}
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #f87171', textAlign: 'center', fontWeight: '500' }}>
          {errorMsg}
        </div>
      )}

      {!selectedLesson ? (
        <div className="flex flex-col gap-4">
          {module.lessons && module.lessons.length > 0 ? (
            module.lessons.map(lesson => {
              // Sort submissions so the newest one is picked
              const mySubmissionsForLesson = submissions
                .filter(s => s.moduleId === module.id && s.lessonId === lesson.id && s.studentId === user.id)
                .sort((a, b) => b.timestamp - a.timestamp);
              const mySubmission = mySubmissionsForLesson[0];
              const isPending = mySubmission && mySubmission.status === 'pending';

              const submissionCount = mySubmissionsForLesson.length;
              return (
                <div 
                  key={lesson.id} 
                  className={`glass-card flex justify-between items-center p-4 transition-all ${isPending ? 'opacity-80' : 'hover:border-primary/50 cursor-pointer'}`}
                  onClick={() => {
                    setSelectedLesson(lesson);
                  }}
                  title={isPending ? 'Aguardando correção do professor' : 'Clique para enviar seu desenho'}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg leading-none">{lesson.title}</span>
                      {submissionCount > 0 && (
                        <span 
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            backgroundColor: 'rgba(0,0,0,0.06)',
                            color: 'rgba(0,0,0,0.6)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '1rem',
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}
                          title="Quantidade de envios"
                        >
                          {submissionCount} {submissionCount === 1 ? 'envio' : 'envios'}
                        </span>
                      )}
                    </div>
                    {mySubmission ? (
                      <span className={`text-sm ${!isPending ? 'text-success font-bold' : 'text-warning'}`}>
                        {!isPending ? '✨ Avaliado' : 'Aguardando Correção'}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">Não enviado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {mySubmission && !isPending && (
                       <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                         Enviar Novamente
                       </button>
                    )}
                    {mySubmission ? (
                      <div style={{ width: '4rem', height: '3rem', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', position: 'relative' }}>
                         <img src={mySubmission.imageUrl} alt="Meu desenho" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                         {mySubmission.evaluatedImageUrl && (
                           <img src={mySubmission.evaluatedImageUrl} alt="Correção" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover'}} />
                         )}
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        Enviar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-panel p-8 text-center text-muted">
              Nenhuma aula cadastrada neste módulo ainda.
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {(() => {
             const latestSub = submissions
               .filter(s => s.moduleId === module.id && s.lessonId === selectedLesson.id && s.studentId === user.id)
               .sort((a, b) => b.timestamp - a.timestamp)[0];
             const isPending = latestSub && latestSub.status === 'pending';
             
             if (isPending) {
               return (
                 <div className="text-center py-8">
                   <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle size={32} />
                   </div>
                   <h3 className="text-xl font-bold mb-2 text-gradient">Desenho em Avaliação</h3>
                   <p className="text-muted">Seu último envio para esta aula está aguardando a correção do professor.</p>
                 </div>
               );
             }
             
             return (
               <>
                 {!preview ? (
                   <div 
                     className="flex flex-col items-center justify-center gap-4"
                     style={{ 
                       border: `2px dashed ${isDragging ? 'var(--primary)' : '#d4d4d8'}`,
                       borderRadius: 'var(--radius-lg)',
                       padding: '2rem 1rem',
                       backgroundColor: isDragging ? 'rgba(249, 115, 22, 0.05)' : '#f4f4f5',
                       transition: 'var(--transition)',
                       cursor: 'pointer'
                     }}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                     onClick={() => fileInputRef.current?.click()}
                   >
                     <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '50%' }}>
                       <UploadCloud size={40} className="text-primary" />
                     </div>
                     <div className="text-center">
                       <h3 className="text-lg font-bold mb-1">Clique ou arraste a imagem aqui</h3>
                       <p className="text-muted text-sm">Suporta JPG, PNG. (Máx. 5MB)</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-6">
                     <div 
                       style={{ 
                         width: '100%', 
                         height: '400px', 
                         borderRadius: 'var(--radius-lg)', 
                         overflow: 'hidden',
                         position: 'relative',
                         border: '1px solid var(--border-color)'
                       }}
                     >
                       <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f4f4f5' }} />
                       <button 
                         className="btn btn-danger"
                         style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem 1rem' }}
                         onClick={() => { setFile(null); setPreview(null); }}
                       >
                         Trocar imagem
                       </button>
                     </div>
                     
                     <button 
                       className="btn btn-primary w-full" 
                       style={{ padding: '1rem' }}
                       onClick={handleSubmit}
                       disabled={isUploading}
                     >
                       {isUploading ? (
                         <>Enviando...</>
                       ) : (
                         <>
                           <CheckCircle size={20} />
                           Confirmar Envio
                         </>
                       )}
                     </button>
                   </div>
                 )}
                 
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   style={{ display: 'none' }} 
                   accept="image/*"
                   onChange={handleFileChange}
                 />
               </>
             );
          })()}
        </div>
      )}

      {/* Timeline de Envios */}
      {selectedLesson && (
        (() => {
          const mySubmissionsForLesson = submissions
            .filter(s => s.moduleId === module.id && s.lessonId === selectedLesson.id && s.studentId === user.id)
            .sort((a, b) => b.timestamp - a.timestamp);
            
          if (mySubmissionsForLesson.length === 0) return null;
          
          return (
             <div className="glass-panel mt-8" style={{ padding: '2rem' }}>
                <h3 className="text-xl font-bold mb-6 text-gradient">Histórico de Envios</h3>
                <div className="flex flex-col gap-8 relative border-l-2 border-zinc-200 ml-4 pl-8">
                   {mySubmissionsForLesson.map((sub, idx) => (
                      <div key={sub.id} className="relative">
                         <div className="absolute -left-[2.65rem] top-0 w-8 h-8 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-primary text-sm shadow-sm">
                         </div>
                         <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                               <div className="flex items-center gap-3 mb-2">
                                 <span className="font-bold text-lg">
                                   Envio {mySubmissionsForLesson.length - idx}
                                 </span>
                                 <span className={`badge ${sub.status === 'evaluated' ? 'badge-evaluated' : 'badge-pending'}`}>
                                   {sub.status === 'evaluated' ? 'Avaliado' : 'Aguardando Correção'}
                                 </span>
                                 <span className="text-sm text-muted">
                                    {new Date(sub.timestamp).toLocaleDateString('pt-BR')}
                                 </span>
                                 {sub.status === 'pending' && (
                                   <button 
                                     onClick={() => {
                                       setConfirmAction({
                                         title: 'Excluir Envio',
                                         message: 'Tem certeza que deseja excluir este envio? Essa ação não pode ser desfeita.',
                                         onConfirm: () => deleteSubmission(sub.id)
                                       });
                                     }}
                                     className="btn ml-auto flex items-center gap-2 text-sm transition-colors"
                                     style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.4rem 0.8rem' }}
                                     title="Excluir envio"
                                   >
                                     <Trash2 size={16} />
                                     <span className="hidden sm:inline font-semibold">Excluir</span>
                                   </button>
                                 )}
                               </div>
                               {sub.status === 'evaluated' && (
                                  <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 mb-3">
                                    Seu professor deixou marcações de correção neste desenho. Clique na imagem para ver os detalhes.
                                  </p>
                               )}
                            </div>
                            <div className="flex gap-4">
                               <div 
                                  className="rounded-lg overflow-hidden border border-zinc-200 shadow-sm cursor-pointer bg-white" 
                                  style={{ position: 'relative', width: '120px', height: '90px', transition: 'transform 0.2s ease' }}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  onClick={() => setSelectedImage({ original: sub.imageUrl, evaluated: null })}
                                  title="Ver Desenho Original"
                               >
                                  <img src={sub.imageUrl} alt="Original" style={{width:'100%', height:'100%', objectFit:'contain'}} />
                               </div>
                               {sub.evaluatedImageUrl && (
                                 <div 
                                    className="rounded-lg overflow-hidden shadow-sm cursor-pointer bg-white" 
                                    style={{ position: 'relative', width: '120px', height: '90px', border: '1px solid rgba(249, 115, 22, 0.3)', transition: 'transform 0.2s ease' }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    onClick={() => setSelectedImage({ original: sub.imageUrl, evaluated: sub.evaluatedImageUrl })}
                                    title="Ver Correção do Professor"
                                 >
                                    <img src={sub.imageUrl} alt="Base" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'contain'}} />
                                    <img src={sub.evaluatedImageUrl} alt="Correção" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'contain', pointerEvents:'none'}} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(249, 115, 22, 0.9)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '0.125rem 0', fontWeight: 'bold', zIndex: 10 }}>
                                      CORREÇÃO
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          );
        })()
      )}

      {selectedImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '90vh', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={selectedImage.original} 
              alt="Desenho em tamanho real" 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.5rem' }} 
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

      {/* Modal de Confirmação Moderno */}
      {confirmAction && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            zIndex: 100
          }}
        >
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '400px', position: 'relative', background: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--main)' }}>{confirmAction.title}</h3>
            <p className="text-muted" style={{ marginBottom: '24px', lineHeight: '1.5' }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmAction(null)}>
                Cancelar
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', color: 'white', border: 'none' }}
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
