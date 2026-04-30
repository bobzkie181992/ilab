import React from 'react';
import { BorrowTransaction, Equipment, User } from '../../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface TransactionReceiptProps {
  transaction: BorrowTransaction;
  equipment: Equipment | undefined;
  borrower: User | undefined;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({ 
  transaction, 
  equipment, 
  borrower, 
  onClose,
  onConfirm,
  confirmLabel = 'Confirm & Release'
}) => {
  const { state } = useAppContext();
  const [printError, setPrintError] = React.useState<boolean>(false);
  const [inIframe, setInIframe] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      setInIframe(window.self !== window.top);
    } catch (e) {
      setInIframe(true);
    }
  }, []);
  
  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const content = document.getElementById('print-content')?.innerHTML;
      if (content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print Receipt</title>
                ${document.head.innerHTML}
                <style>
                  body { background: white !important; margin: 0; padding: 20px; visibility: visible !important; }
                  #print-content { width: 100%; max-width: 600px; margin: 0 auto; color: black; }
                  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                </style>
              </head>
              <body>
                <div id="print-content">
                  ${content}
                </div>
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                      window.close();
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        } else {
          // Fallback if popup blocker prevented opening external window
          window.print();
        }
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print failed', err);
      window.print();
    }
  };

  return (
    <div id="receipt-modal" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden print:shadow-none print:max-w-none print:w-full print:border-0 flex flex-col max-h-full">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden text-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <Printer className="h-5 w-5 text-brand" />
            <span className="font-bold">Transaction Receipt</span>
          </div>
          <button type="button" onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-full hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {printError && inIframe && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 shrink-0 print:hidden">
            <p className="text-xs text-amber-800 font-medium text-center">
              Printing is disabled in the preview frame. To print, <strong className="font-bold">Open App in New Tab</strong> (arrow icon at top right).
            </p>
          </div>
        )}

        {/* Receipt Content */}
        <div className="p-8 space-y-6 overflow-y-auto" id="print-content">

          <div className="text-center space-y-3 border-b border-dashed border-slate-200 pb-6">
            {state.settings.logoUrl && (
              <img 
                src={state.settings.logoUrl} 
                alt="Logo" 
                className="h-16 w-auto mx-auto object-contain"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{state.settings.labName || 'CCIS Lab Monitor'}</h1>
              <p className="text-sm text-slate-500 font-medium">Equipment Transaction Receipt</p>
            </div>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              TX-ID: {transaction.id}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date/Time</span>
              <span className="font-bold text-slate-900">{new Date(transaction.checkoutTime).toLocaleString()}</span>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Equipment Details</p>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{equipment?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 font-mono italic">{equipment?.qrCode || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Condition</p>
                  <p className="font-bold text-slate-900">{transaction.checkoutCondition}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Borrower Details</p>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{borrower?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 font-mono italic">{borrower?.idNumber || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="font-bold text-slate-900">{transaction.borrowerRole}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 italic text-slate-600 text-sm">
               <span className="font-bold non-italic mr-2">Purpose:</span>
               {transaction.purpose}
            </div>

            <div className="pt-4 border-t border-slate-100">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Expected Return</span>
                 <span className="font-bold text-slate-900">{new Date(transaction.expectedReturnTime).toLocaleString()}</span>
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-dashed border-slate-200 text-center space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="border-t border-slate-900 pt-1">
                   <p className="text-[10px] uppercase font-bold">Borrower Signature</p>
                </div>
                <div className="border-t border-slate-900 pt-1">
                   <p className="text-[10px] uppercase font-bold">Staff/Admin Signature</p>
                </div>
             </div>
             <p className="text-[10px] text-slate-400 mt-4">
               Please keep this receipt until equipment is returned.
             </p>
          </div>
        </div>

        {/* Footer - Hidden on print */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3 print:hidden shrink-0">
           <div className="flex gap-3">
             <button 
               type="button"
               onClick={onClose}
               className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-sm active:scale-95"
             >
               Close
             </button>
             <button 
               type="button"
               onClick={handlePrint}
               className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
             >
               <Printer className="h-4 w-4" />
               <span>Print Receipt</span>
             </button>
           </div>
           
           {onConfirm && (
             <button 
               type="button"
               onClick={onConfirm}
               className="w-full py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
             >
               <CheckCircle2 className="h-4 w-4" />
               <span>{confirmLabel}</span>
             </button>
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            visibility: hidden !important;
          }
          #receipt-modal, #receipt-modal * {
            visibility: visible !important;
          }
          #receipt-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};
