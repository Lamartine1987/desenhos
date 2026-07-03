import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { UploadCloud, CheckCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function ModuleUpload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modules, addSubmission, user } = useAppContext();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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
    const result = await addSubmission(module.id, file);
    setIsUploading(false);
    
    if (result && result.success) {
      navigate('/aluno');
    } else if (result) {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <button 
        onClick={() => navigate('/aluno')} 
        className="btn btn-outline w-max"
        style={{ padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div>
        <h2 className="text-3xl font-bold text-gradient mb-2">{module.name}</h2>
        <p className="text-muted">Envie seu desenho para avaliação deste módulo.</p>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #f87171', textAlign: 'center', fontWeight: '500' }}>
          {errorMsg}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {!preview ? (
          <div 
            className="flex flex-col items-center justify-center gap-4"
            style={{ 
              border: `2px dashed ${isDragging ? 'var(--primary)' : '#d4d4d8'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
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
      </div>
    </div>
  );
}
