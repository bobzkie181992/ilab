import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, CheckCircle2, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

interface QRScannerProps {
  onResult?: (userId: string, success: boolean, message: string) => void;
  kioskMode?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onResult, kioskMode = false }) => {
  const { state, logAttendance } = useAppContext();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [recognizedUser, setRecognizedUser] = useState<User | null>(null);

  useEffect(() => {
    let isActive = true;
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      if (!isActive || status === 'success') return;

      // Find user by QR code
      const user = state.users.find(u => u.qrCode === decodedText && u.isOJT);
      
      if (!user) {
        setStatus('error');
        setMessage('Unregistered QR Code or Not an OJT student');
        setTimeout(() => {
          if (isActive) {
            setStatus('idle');
            setMessage('');
          }
        }, 3000);
        return;
      }

      // Found user, log attendance
      const result = logAttendance(user.id);
      if (result.success) {
        setRecognizedUser(user);
        setStatus('success');
        setMessage(result.message);
        if (onResult) onResult(user.id, true, result.message);
        
        if (kioskMode) {
          setTimeout(() => {
            if (isActive) {
              setRecognizedUser(null);
              setStatus('idle');
              setMessage('');
            }
          }, 4000);
        }
      } else {
        setStatus('error');
        setMessage(result.message);
        setTimeout(() => {
          if (isActive) {
            setStatus('idle');
            setMessage('');
          }
        }, 3000);
      }
    };

    scanner.render(onScanSuccess, (error) => {
      // Intentionally ignoring some errors as they are frequent during scanning
    });

    return () => {
      isActive = false;
      scanner.clear().catch(err => console.debug("Scanner cleanup suppressed:", err));
    };
  }, [state.users, logAttendance, kioskMode]);

  return (
    <div className={`grid grid-cols-1 ${kioskMode && recognizedUser ? 'lg:grid-cols-2' : ''} gap-6`}>
      <div className="relative flex flex-col space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video shadow-2xl border-4 border-white flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full opacity-80" />
          
          {/* Overlay elements */}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none">
             <div className="flex items-center space-x-2 text-white/80">
                <QrCode className="h-4 w-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Awaiting QR Identity</span>
             </div>
          </div>

          <AnimatePresence>
            {(status === 'success' || status === 'error') && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-20 ${
                  status === 'success' ? 'bg-emerald-950/40' : 'bg-rose-950/40'
                }`}
              >
                {status === 'success' ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                      <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                    <span className="text-white font-black text-xl uppercase tracking-tight">QR VERIFIED</span>
                    <p className="text-emerald-100 text-xs mt-2 font-bold">{message}</p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-rose-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                      <ShieldAlert className="h-12 w-12 text-white" />
                    </div>
                    <span className="text-white font-black text-xl uppercase tracking-tight">SCAN FAILED</span>
                    <p className="text-rose-100 text-[10px] mt-2 font-bold px-6 text-center">{message}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <QrCode className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Scan Technology</p>
               <p className="text-sm font-black text-slate-800">QR-BASED IDENTITY</p>
            </div>
          </div>
          
          <div className="flex items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
             <RefreshCw className="h-3.5 w-3.5 text-slate-400 mr-2 animate-spin-slow" />
             <span className="text-[10px] font-bold text-slate-500 uppercase">System Ready</span>
          </div>
        </div>
      </div>

      {recognizedUser && kioskMode && (
        <motion.div 
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          <div className="h-32 bg-gradient-to-br from-indigo-600 to-brand relative p-6">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="flex items-center space-x-4 relative z-10">
              <div className="h-20 w-20 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white flex-shrink-0">
                <img src={recognizedUser.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="text-white">
                <h3 className="text-xl font-black">{recognizedUser.name}</h3>
                <p className="text-white/80 text-xs font-bold">{recognizedUser.idNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-8">
             <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
                <div className="flex items-center text-emerald-700 mb-1">
                   <CheckCircle2 className="h-4 w-4 mr-2" />
                   <span className="text-xs font-black uppercase">Identity Authenticated</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">Recorded at {new Date().toLocaleTimeString()}</p>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Information</p>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Course</p>
                      <p className="text-xs font-bold text-slate-800">{recognizedUser.departmentOrCourse}</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Contact</p>
                      <p className="text-xs font-bold text-slate-800">{recognizedUser.contactInfo}</p>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="p-6 bg-slate-50 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">QR Verification Active</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
