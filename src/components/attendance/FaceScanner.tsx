import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, UserCheck, UserX, Loader2, Clock, ScanLine, ShieldCheck, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { User, OjtAttendance } from '../../types';

interface FaceScannerProps {
  onResult?: (userId: string, success: boolean, message: string) => void;
  kioskMode?: boolean;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({ onResult, kioskMode = false }) => {
  const { state, logAttendance } = useAppContext();
  const [status, setStatus] = useState<'idle' | 'detecting' | 'recognizing' | 'success' | 'denied' | 'error'>('idle');
  const [detectedFace, setDetectedFace] = useState(false);
  const [recognizedUser, setRecognizedUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isActive = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (isActive && videoRef.current) {
          videoRef.current.srcObject = stream;
          // Explicitly play and handle the promise to avoid "play() interrupted" errors
          try {
            await videoRef.current.play();
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              console.error("Video play failed:", e);
            }
          }
        } else {
          // If component unmounted before stream was ready
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        if (isActive) {
          console.error("Camera access failed:", err);
          setStatus('error');
        }
      }
    };

    startCamera();

    // Face detection simulation pulse
    const interval = setInterval(() => {
      if (isActive) setDetectedFace(prev => !prev);
    }, 3000);

    return () => {
      isActive = false;
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleRecognize = () => {
    if (status === 'recognizing') return;
    
    const ojtUsers = state.users.filter(u => u.isOJT && u.faceRegistered);
    
    if (ojtUsers.length === 0) {
      setStatus('denied');
      setMessage('Face Not Recognized - No Registered Students Found');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('recognizing');
    setMessage('Authenticating Biometrics...');

    // Simulation delay for recognition processing
    setTimeout(() => {
      // Pick a random registered OJT user
      const user = ojtUsers[Math.floor(Math.random() * ojtUsers.length)];
      
      const result = logAttendance(user.id);
      if (result.success) {
        setRecognizedUser(user);
        setStatus('success');
        setMessage(result.message);
        if (onResult) onResult(user.id, true, result.message);
        
        if (kioskMode) {
          setTimeout(() => {
            setRecognizedUser(null);
            setStatus('idle');
            setMessage('');
          }, 4000);
        }
      } else {
        setStatus('error');
        setMessage(result.message);
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 2000);
  };

  return (
    <div className={`grid grid-cols-1 ${kioskMode ? 'lg:grid-cols-2' : ''} gap-6`}>
      <div className="relative flex flex-col space-y-4">
        {/* Scanner Feed */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video shadow-2xl border-4 border-white">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          
          {/* HUD Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corners */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-brand/50 rounded-tl-xl" />
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-brand/50 rounded-tr-xl" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-brand/50 rounded-bl-xl" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-brand/50 rounded-br-xl" />

            {/* Scan Line */}
            {status === 'recognizing' && (
              <motion.div 
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-x-0 h-1 bg-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.8)] z-10"
              />
            )}

            {/* Face Box */}
            {(detectedFace || status === 'recognizing') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-72 border-2 rounded-2xl transition-colors duration-500 ${
                  status === 'success' ? 'border-emerald-400' : 
                  status === 'denied' ? 'border-rose-400' : 'border-brand'
                }`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-full whitespace-nowrap shadow-lg">
                  {status === 'recognizing' ? 'ANALYZING...' : 'FACE DETECTED'}
                </div>
              </motion.div>
            )}
          </div>

          {/* Status Overlay */}
          <AnimatePresence>
            {(status === 'recognizing' || status === 'success' || status === 'denied') && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[2px] z-20 ${
                  status === 'success' ? 'bg-emerald-950/20' : 
                  status === 'denied' ? 'bg-rose-950/20' : 'bg-slate-900/40'
                }`}
              >
                {status === 'recognizing' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-16 w-16 text-brand animate-spin mb-4" />
                    <span className="text-white font-black tracking-widest text-lg drop-shadow-md">SCANNING...</span>
                  </div>
                ) : status === 'success' ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                      <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                    <span className="text-white font-black text-xl drop-shadow-md uppercase tracking-tight">RECOGNIZED</span>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-rose-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                      <UserX className="h-12 w-12 text-white" />
                    </div>
                    <span className="text-white font-black text-xl drop-shadow-md uppercase tracking-tight">UNKNOWN</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info & Info Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-slate-500">
               <Info className="h-4 w-4" />
               <span className="text-[10px] font-bold uppercase tracking-tight">Position face within the bounds</span>
            </div>
            
            <div className="h-8 border-l border-slate-200" />
            
            <div className="flex items-center space-x-2 text-emerald-600">
               <ShieldCheck className="h-4 w-4" />
               <span className="text-[10px] font-bold uppercase">Biometric Encryption Active</span>
            </div>
          </div>

          <button 
            onClick={handleRecognize}
            disabled={status === 'recognizing'}
            className="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {status === 'recognizing' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
            <span>{status === 'recognizing' ? 'AUTHENTICATING...' : 'SCAN BIOMETRICS'}</span>
          </button>
        </div>
      </div>

      {recognizedUser && kioskMode && (
        <motion.div 
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          <div className="h-32 bg-gradient-to-br from-brand to-indigo-600 relative p-6">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="flex items-center space-x-4 relative z-10">
              <div className="h-20 w-20 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white flex-shrink-0">
                <img src={recognizedUser.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="text-white">
                <h3 className="text-xl font-black">{recognizedUser.name}</h3>
                <p className="text-white/80 text-xs font-bold">{recognizedUser.idNumber} • {recognizedUser.departmentOrCourse}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Action</p>
                <div className="flex items-center text-slate-800">
                   <Clock className="h-4 w-4 mr-2 text-brand" />
                   <span className="font-black">LOGGED SUCCESS</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Status</p>
                <span className="text-emerald-700 font-black">VALIDATED</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center">
                <Info className="h-3 w-3 mr-2" /> Recent Scans
              </p>
              <div className="space-y-2">
                {state.attendanceLogs.filter(l => l.userId === recognizedUser.id).slice(-3).reverse().map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs font-medium border border-slate-100">
                    <span className="text-slate-600">{log.type} ({log.shift})</span>
                    <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Entry Securely Encrypted • System V3.0</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
