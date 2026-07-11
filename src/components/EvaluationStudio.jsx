import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, Undo, Trash2, Circle, Hand, PenLine } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function EvaluationStudio({ submission, onSave, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Drawing states
  const [paths, setPaths] = useState([]); // Array of { points: [], color, size }
  const [currentPath, setCurrentPath] = useState([]); // Just the points for the active stroke
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [currentSize, setCurrentSize] = useState(5);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPanMode, setIsPanMode] = useState(false);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000', '#ffffff'];
  const sizes = [
    { value: 2, label: 'Fino', iconSize: 10 },
    { value: 5, label: 'Médio', iconSize: 16 },
    { value: 12, label: 'Grosso', iconSize: 22 }
  ];

  // Load the image
  useEffect(() => {
    const img = new Image();
    
    let fetchUrl = submission.imageUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      fetchUrl = fetchUrl.replace('https://firebasestorage.googleapis.com', '/firebasestorage');
    }

    img.onload = () => {
      setImageObj(img);
    };
    img.onerror = () => {
      setErrorMsg("Erro ao carregar a imagem original para avaliação.");
    };
    img.src = fetchUrl;
  }, [submission]);

  // Redraw canvas whenever image or paths change
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw paths
    paths.forEach(path => {
      if (path.points.length === 0) return;
      ctx.lineWidth = Math.max(path.size, Math.floor(canvas.width * (path.size * 0.001)));
      ctx.strokeStyle = path.color;
      
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current path
    if (currentPath.length > 0) {
      ctx.lineWidth = Math.max(currentSize, Math.floor(canvas.width * (currentSize * 0.001)));
      ctx.strokeStyle = currentColor;
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [imageObj, paths, currentPath, currentColor, currentSize]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Redraw canvas whenever image or paths change
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (e.touches && e.touches.length > 1) return; // Prevent drawing when zooming
    // Prevent default on the canvas to stop iOS magnifier and text selection callouts
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches && e.touches.length > 1) return; // Prevent drawing when zooming
    if(e.cancelable) {
       e.preventDefault();
    }
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    setCurrentPath(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, { points: currentPath, color: currentColor, size: currentSize }]);
      setCurrentPath([]);
    }
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    
    try {
      // Export as PNG Blob (to keep transparency)
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) throw new Error("Falha ao gerar a imagem.");
        
        const file = new File([blob], `evaluated_${Date.now()}.png`, { type: 'image/png', lastModified: Date.now() });
        await onSave(file);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao salvar avaliação.");
      setIsSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Header Toolbar */}
      <div 
        className="flex justify-between items-center px-4"
        style={{ 
          backgroundColor: '#18181b', 
          borderBottom: '1px solid #27272a',
          paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          paddingBottom: '1rem'
        }}
      >
        <div className="flex items-center gap-4">
          <button 
            className="btn btn-outline" 
            style={{ color: 'white', borderColor: '#3f3f46', padding: '0.5rem' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
          <div className="text-white hidden sm:block">
            <h3 className="font-bold text-sm">Avaliando: {submission.studentName}</h3>
          </div>
        </div>
        
        {/* Color and Brush Tools */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto px-2" style={{ maxWidth: '50%', scrollbarWidth: 'none' }}>
           <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
             {colors.map(color => (
               <button
                 key={color}
                 onClick={() => setCurrentColor(color)}
                 style={{
                   width: '24px', height: '24px', borderRadius: '50%',
                   backgroundColor: color,
                   border: currentColor === color ? '2px solid white' : '2px solid transparent',
                   boxShadow: currentColor === color ? '0 0 0 1px #3f3f46' : 'none'
                 }}
                 title="Cor"
               />
             ))}
           </div>
           
           <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
             {sizes.map(size => (
               <button
                 key={size.value}
                 onClick={() => setCurrentSize(size.value)}
                 className="flex items-center justify-center transition-colors"
                 style={{
                   width: '32px', height: '24px', borderRadius: '4px',
                   backgroundColor: currentSize === size.value ? '#3f3f46' : 'transparent',
                   color: 'white'
                 }}
                 title={size.label}
               >
                 <Circle size={size.iconSize} fill="currentColor" stroke="none" />
               </button>
             ))}
           </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            className={`btn ${isPanMode ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem', borderColor: '#3f3f46', color: isPanMode ? 'white' : '#d4d4d8' }}
            onClick={() => setIsPanMode(!isPanMode)}
            title={isPanMode ? "Modo Desenhar" : "Modo Mover"}
          >
            {isPanMode ? <PenLine size={18} /> : <Hand size={18} />}
          </button>

          <div style={{ width: '1px', backgroundColor: '#3f3f46', margin: '0 0.5rem' }}></div>

          <button 
            className="btn btn-outline"
            style={{ color: '#d4d4d8', borderColor: '#3f3f46', padding: '0.5rem' }}
            onClick={handleUndo}
            disabled={paths.length === 0}
            title="Desfazer"
          >
            <Undo size={18} />
          </button>
          
          <button 
            className="btn btn-outline"
            style={{ color: '#ef4444', borderColor: '#3f3f46', padding: '0.5rem' }}
            onClick={handleClear}
            disabled={paths.length === 0}
            title="Limpar Tudo"
          >
            <Trash2 size={18} />
          </button>

          <button 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem' }}
            onClick={handleSave}
            disabled={isSaving || !imageObj}
          >
            {isSaving ? 'Salvando...' : (
              <>
                <CheckCircle size={18} />
                <span className="hidden sm:inline">Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        {errorMsg && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem' }}>
            {errorMsg}
          </div>
        )}
        
        {!imageObj && !errorMsg && (
          <div className="text-zinc-400">Carregando imagem...</div>
        )}

        {imageObj && (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={10}
            centerOnInit={true}
            centerZoomedOut={true}
            panning={{ disabled: false, excluded: isPanMode ? [] : ['drawing-canvas'] }}
            pinch={{ disabled: false }}
            doubleClick={{ disabled: true }}
            wheel={{ step: 0.0001, smooth: true }}
          >
            <TransformComponent 
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                maxWidth: '100%', 
                maxHeight: '100%', 
                display: 'inline-block' 
              }}>
                <img 
                  src={imageObj.src} 
                  alt="Fundo" 
                  style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', pointerEvents: 'none' }} 
                />
                <canvas
                    ref={canvasRef}
                    className="drawing-canvas"
                    width={imageObj.width}
                    height={imageObj.height}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      cursor: isPanMode ? 'grab' : 'crosshair',
                      touchAction: 'none'
                    }}
                    onMouseDown={(e) => { if(!isPanMode) startDrawing(e); }}
                    onMouseMove={(e) => { if(!isPanMode) draw(e); }}
                    onMouseUp={(e) => { if(!isPanMode) stopDrawing(e); }}
                    onMouseLeave={(e) => { if(!isPanMode) stopDrawing(e); }}
                    onTouchStart={(e) => { if(!isPanMode) startDrawing(e); }}
                    onTouchMove={(e) => { if(!isPanMode) draw(e); }}
                    onTouchEnd={(e) => { if(!isPanMode) stopDrawing(e); }}
                    onContextMenu={(e) => { e.preventDefault(); return false; }}
                  />
                </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>
    </div>
  );
}
