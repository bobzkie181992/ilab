import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ScanLine, LogIn, LogOut, CheckCircle, AlertCircle, Camera, Printer } from 'lucide-react';
import { QRScanner } from '../ui/QRScanner';
import { TransactionReceipt } from '../transactions/TransactionReceipt';
import { BorrowTransaction } from '../../types';

export const ScannerView: React.FC = () => {
  const { checkoutEquipment, returnEquipment, releaseEquipment, state } = useAppContext();
  const [mode, setMode] = useState<'checkout' | 'return'>('checkout');

  const [equipmentQr, setEquipmentQr] = useState('EQ-MAC-01');
  const [borrowerQr, setBorrowerQr] = useState('STU-001');
  const [purpose, setPurpose] = useState('');
  const [returnCondition, setReturnCondition] = useState<'Good' | 'Fair' | 'Damaged'>('Good');
  const [returnNotes, setReturnNotes] = useState('');
  
  const [result, setResult] = useState<{ success: boolean; message: string; txId?: string } | null>(null);
  const [showReceipt, setShowReceipt] = useState<BorrowTransaction | null>(null);
  const [matchingRequest, setMatchingRequest] = useState<BorrowTransaction | null>(null);

  const [scannerTarget, setScannerTarget] = useState<'equipment' | 'borrower' | null>(null);

  const isAdminOrStaff = state.currentUser?.role === 'Admin' || state.currentUser?.position === 'Lab-Incharge' || state.currentUser?.position === 'Dean';

  const handleRelease = () => {
    if (matchingRequest) {
      releaseEquipment(matchingRequest.id);
      setResult({ success: true, message: 'Equipment released successfully!' });
      setMatchingRequest(null);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    const borrower = state.users.find(u => u.qrCode === borrowerQr || u.idNumber === borrowerQr);
    const equipment = state.equipment.find(e => e.qrCode === equipmentQr || e.id === equipmentQr);

    if (!borrower || !equipment) {
      setResult({ success: false, message: 'Borrower or Equipment not found.' });
      return;
    }

    // Check if there is an existing approved transaction for this pair
    const approvedTx = state.transactions.find(t => 
      t.borrowerId === borrower.id && 
      t.equipmentId === equipment.id && 
      t.status === 'Approved by Dean'
    );

    const pendingTx = state.transactions.find(t => 
      t.borrowerId === borrower.id && 
      t.equipmentId === equipment.id && 
      (t.status === 'Pending Approval' || t.status === 'Approved by Lab-Incharge')
    );

    if (approvedTx && isAdminOrStaff) {
      // Found an approved request, show release modal
      setMatchingRequest(approvedTx);
      setResult(null);
    } else if (pendingTx && isAdminOrStaff) {
      setResult({ 
        success: false, 
        message: `This borrower has a pending application (${pendingTx.status}). Please ensure it is fully approved by the Dean before releasing.` 
      });
    } else if (isAdminOrStaff && (borrower.role === 'Faculty' || borrower.role === 'Staff' || borrower.role === 'Student')) {
       // If no transaction at all, we can allow the Admin to submit an application on their behalf (Walk-in application)
       const res = checkoutEquipment([equipmentQr], borrowerQr, undefined, undefined, purpose);
       setResult(res);
       if (res.success) {
         res.message = `Application submitted. The request must now be approved by the Lab Incharge and Dean before you can release this item.`;
       }
    } else {
      // Regular borrower submitting their own application
      const res = checkoutEquipment([equipmentQr], borrowerQr, undefined, undefined, purpose);
      setResult(res);
    }
  };

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const res = returnEquipment(equipmentQr, returnCondition, returnNotes);
    setResult(res);
  };

  const handleScan = (decodedText: string) => {
    if (scannerTarget === 'equipment') {
      setEquipmentQr(decodedText);
    } else if (scannerTarget === 'borrower') {
      setBorrowerQr(decodedText);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ScanLine size={32} />
          </div>
          <CardTitle className="text-2xl text-lab-text">Smart QR Scanner</CardTitle>
          <p className="mt-2 text-sm text-slate-500">
            Simulate or scan real QR codes to check equipment in or out.
          </p>
          {!state.isOnline && (
            <div className="mt-4 flex items-center space-x-2 rounded-lg bg-amber-50 p-3 text-[10px] font-medium text-amber-800 border border-amber-100">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <span>Offline Mode Active: Transactions will be queued for synchronization.</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => { setMode('checkout'); setResult(null); }}
              className={`flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all ${
                mode === 'checkout'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </button>
            <button
              onClick={() => { setMode('return'); setResult(null); }}
              className={`flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all ${
                mode === 'return'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Return
            </button>
          </div>

          <form onSubmit={mode === 'checkout' ? handleCheckout : handleReturn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Equipment QR</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={equipmentQr}
                  onChange={(e) => setEquipmentQr(e.target.value)}
                  placeholder="e.g. EQ-MAC-01"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
                <button
                  type="button"
                  onClick={() => setScannerTarget('equipment')}
                  className="flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand"
                  title="Scan QR Code"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Test codes: EQ-MAC-01 (Avail), EQ-MAC-02 (Borrowed)</p>
            </div>

            {mode === 'checkout' && (
              <div className="space-y-4 pb-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Borrower QR</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={borrowerQr}
                      onChange={(e) => setBorrowerQr(e.target.value)}
                      placeholder="e.g. STU-001"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setScannerTarget('borrower')}
                      className="flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand"
                      title="Scan QR Code"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Test codes: STU-001, FAC-001, STF-001</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Purpose</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Research Project"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'return' && (
              <div className="space-y-4 pb-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Return Condition</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as 'Good' | 'Fair' | 'Damaged')}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Return Notes</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="e.g. Any issues/observations?"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white shadow hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand block text-center"
            >
              {mode === 'checkout' 
                ? (isAdminOrStaff ? 'Verify & Release Equipment' : 'Submit Borrow Request') 
                : 'Process Return'}
            </button>
          </form>

          {result && (
            <div className={`mt-6 rounded-md p-4 ${result.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="shrink-0">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result.success ? 'Transaction Successful' : 'Transaction Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                    <p>{result.message}</p>
                  </div>
                  {result.success && mode === 'checkout' && (
                    <button
                      onClick={() => {
                        const borrower = state.users.find(u => u.qrCode === borrowerQr);
                        const equipment = state.equipment.find(e => e.qrCode === equipmentQr);
                        const tx = [...state.transactions].sort((a,b) => new Date(b.checkoutTime).getTime() - new Date(a.checkoutTime).getTime()).find(t => t.borrowerId === borrower?.id && t.equipmentId === equipment?.id);
                        if (tx) setShowReceipt(tx);
                      }}
                      className="mt-3 flex items-center space-x-2 text-xs font-bold text-emerald-800 hover:underline"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Print Transaction Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showReceipt && (
        <TransactionReceipt 
          transaction={showReceipt}
          equipment={state.equipment.find(e => e.id === showReceipt.equipmentId)}
          borrower={state.users.find(u => u.id === showReceipt.borrowerId)}
          onClose={() => setShowReceipt(null)}
        />
      )}

      {matchingRequest && (
        <TransactionReceipt 
          transaction={matchingRequest}
          equipment={state.equipment.find(e => e.id === matchingRequest.equipmentId)}
          borrower={state.users.find(u => u.id === matchingRequest.borrowerId)}
          onClose={() => setMatchingRequest(null)}
          onConfirm={handleRelease}
          confirmLabel="Release Equipment & Save"
        />
      )}

      {scannerTarget && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScannerTarget(null)}
          onError={(err) => console.log('Scanner error:', err)}
        />
      )}
    </div>
  );
};
