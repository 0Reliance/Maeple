
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

interface Props {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const StateCheckCamera: React.FC<Props> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for "mirror" effect consistency
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageSrc = canvas.toDataURL('image/png');
        onCapture(imageSrc);
        // Do not stop camera immediately here, let unmount handle it or let parent trigger
        // Actually, stopping here is fine as we are done with this view
        stopCamera();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {error ? (
        <div className="text-white text-center p-6">
          <p className="mb-4 text-red-400">{error}</p>
          <button onClick={onCancel} className="px-6 py-2 bg-slate-800 rounded-full">Close</button>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay Guides */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-white/30 rounded-full pointer-events-none"></div>
            
            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-sm"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mt-8 flex items-center gap-8">
             <button 
                onClick={capture}
                className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
             >
                <div className="w-16 h-16 bg-white rounded-full border-2 border-slate-900"></div>
             </button>
          </div>
          <p className="text-slate-400 mt-4 text-sm">Center your face & relax</p>
        </>
      )}
    </div>
  );
};

export default StateCheckCamera;
