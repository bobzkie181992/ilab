import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Download, Upload, Plus, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { SoftwareRequestStatus } from '../../types';
import { toast } from 'sonner';

export const SoftwareRequestsView: React.FC = () => {
  const { state, createSoftwareRequest, updateSoftwareRequestStatus } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [softwareName, setSoftwareName] = useState('');
  const [version, setVersion] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetComputers, setTargetComputers] = useState('');
  const [downloadLink, setDownloadLink] = useState('');

  const isLabIncharge = state.currentUser?.position === 'Lab-Incharge' || state.currentUser?.role === 'Admin';
  const isDean = state.currentUser?.position === 'Dean' || state.currentUser?.role === 'Admin';
  const canApprove = isLabIncharge || isDean;
  const canRequest = state.currentUser?.role === 'Faculty' || state.currentUser?.role === 'Staff' || state.currentUser?.role === 'Admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    
    if (!file && !downloadLink) {
      toast.error('Please upload an installer file or provide a download link');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('softwareName', softwareName);
    formData.append('version', version);
    formData.append('purpose', purpose);
    formData.append('targetComputers', targetComputers);
    if (downloadLink) {
      formData.append('downloadLink', downloadLink);
    }
    if (file) {
      formData.append('installer', file);
    }

    const res = await createSoftwareRequest(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(res.message);
      setIsModalOpen(false);
      setSoftwareName('');
      setVersion('');
      setPurpose('');
      setTargetComputers('');
      setDownloadLink('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      toast.error(res.message);
    }
  };

  const getStatusIcon = (status: SoftwareRequestStatus) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'Approved': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'Installed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Software Requests</h2>
        {canRequest && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Request Installation</span>
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {state.softwareRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <Upload className="h-10 w-10 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No requests yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Faculty and Staff members can request software installations and upload setup files here.
            </p>
          </div>
        ) : (
          state.softwareRequests.map(req => {
            const faculty = state.users.find(u => u.id === req.facultyId);
            return (
              <Card key={req.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-bold text-slate-900">{req.softwareName} {req.version && <span className="text-sm font-normal text-slate-500 ml-1">v{req.version}</span>}</h3>
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            req.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                            req.status === 'Installed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'}`}>
                          {getStatusIcon(req.status)}
                          <span className="ml-1">{req.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">Requested by <span className="font-medium text-slate-900">{faculty?.name || 'Unknown'}</span></p>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mt-2">
                        <div><strong className="text-slate-700">Purpose:</strong> {req.purpose}</div>
                        <div><strong className="text-slate-700">Targets:</strong> {req.targetComputers}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 shrink-0">
                      {(state.currentUser?.role === 'Admin' || state.currentUser?.id === req.facultyId) && req.installerUrl && (
                        <a 
                          href={req.installerUrl}
                          download={req.installerName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download Installer</span>
                        </a>
                      )}
                      {(state.currentUser?.role === 'Admin' || state.currentUser?.id === req.facultyId) && req.downloadLink && !req.installerUrl && (
                        <a 
                          href={req.downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Open Link</span>
                        </a>
                      )}
                      
                      {canApprove && req.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => updateSoftwareRequestStatus(req.id, 'Approved')}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateSoftwareRequestStatus(req.id, 'Rejected')}
                            className="rounded-lg bg-red-100 text-red-700 px-3 py-2 text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {canApprove && req.status === 'Approved' && (
                        <button
                            onClick={() => updateSoftwareRequestStatus(req.id, 'Installed')}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                          >
                            Mark as Installed
                          </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Request Software Installation</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Software Name *</label>
                    <input
                      type="text"
                      required
                      value={softwareName}
                      onChange={e => setSoftwareName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      placeholder="e.g. Android Studio"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Version</label>
                    <input
                      type="text"
                      value={version}
                      onChange={e => setVersion(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      placeholder="e.g. 2024.1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Target Computers/Labs *</label>
                  <input
                    type="text"
                    required
                    value={targetComputers}
                    onChange={e => setTargetComputers(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="e.g. Lab A (All PCs), PC-01 to PC-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Purpose for Subject/Course *</label>
                  <textarea
                    required
                    rows={3}
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="Why is it needed?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Website Download Link</label>
                  <input
                    type="url"
                    value={downloadLink}
                    onChange={e => setDownloadLink(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="https://example.com/download (if no installer file)"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Upload Installer File</span>
                    <span className="text-xs text-slate-400 font-normal">Required if no link provided</span>
                  </label>
                  <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                        <label className="relative cursor-pointer rounded-md bg-white font-semibold text-brand focus-within:outline-none focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 hover:text-brand/80">
                          <span>Upload a file</span>
                          <input ref={fileInputRef} type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-slate-500">ZIP, EXE, MSI, DMG up to 20GB</p>
                    </div>
                  </div>
                  {fileInputRef.current?.files?.[0] && (
                    <p className="text-xs text-brand font-medium">Selected: {fileInputRef.current.files[0].name}</p>
                  )}
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Uploading...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
