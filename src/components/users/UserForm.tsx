import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPosition, BorrowerRole } from '../../types';
import { ImageInput } from '../ui/ImageInput';

interface UserFormProps {
  user?: User;
  onSave: (user: Omit<User, 'id'>) => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    role: 'Student',
    qrCode: '',
    idNumber: '',
    departmentOrCourse: '',
    contactInfo: '',
    email: '',
    imageUrl: '',
    position: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        qrCode: user.qrCode,
        idNumber: user.idNumber,
        departmentOrCourse: user.departmentOrCourse,
        contactInfo: user.contactInfo,
        email: user.email,
        imageUrl: user.imageUrl || '',
        position: user.position || null
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      qrCode: formData.idNumber // Auto-generate QR code from ID number
    } as any);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      // Reset position if role changes to something that doesn't support the current position
      position: null 
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold text-slate-900 mb-6 font-sans">
          {user ? 'Edit User' : 'Add New User'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Profile Image</label>
            <ImageInput 
              value={formData.imageUrl} 
              onChange={(val) => setFormData(prev => ({ ...prev, imageUrl: val }))} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                placeholder="Ex: Juan Dela Cruz"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number (Generates QR)</label>
              <input
                type="text"
                required
                value={formData.idNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                placeholder="Ex: 2024-1234"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department / Course</label>
            <input
              type="text"
              required
              value={formData.departmentOrCourse}
              onChange={(e) => setFormData(prev => ({ ...prev, departmentOrCourse: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              placeholder="Ex: BS Computer Science"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</label>
              <input
                type="text"
                required
                value={formData.contactInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                placeholder="user@example.com"
              />
            </div>
          </div>

          {(formData.role === 'Faculty') && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position / Designation</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {(['Dean', 'Lab-Incharge'] as UserPosition[]).map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, position: prev.position === pos ? null : pos }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      formData.position === pos 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex space-x-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95"
            >
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
