import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.patch('/auth/profile/', profileForm);
      updateUser(data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password/', { old_password: pwForm.old_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully!');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your profile and security</p>
      </div>

      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security</button>
      </div>

      {activeTab === 'profile' && (
        <div className="settings-card">
          <div className="avatar-section">
            <div className="avatar-lg">{user?.email?.[0]?.toUpperCase()}</div>
            <div>
              <p className="user-email-display">{user?.email}</p>
              <p className="user-joined">Member since {new Date(user?.date_joined).toLocaleDateString()}</p>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="settings-form">
            <div className="field-row">
              <div className="field-group">
                <label>First Name</label>
                <input type="text" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} placeholder="Jane" />
              </div>
              <div className="field-group">
                <label>Last Name</label>
                <input type="text" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="settings-card">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="field-group">
              <label>Current Password</label>
              <input type="password" value={pwForm.old_password} onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })} placeholder="••••••••" required />
            </div>
            <div className="field-group">
              <label>New Password</label>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="Min. 8 characters" required />
            </div>
            <div className="field-group">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn-primary" disabled={pwLoading}>
              {pwLoading ? <span className="spinner" /> : 'Change Password'}
            </button>
          </form>

          <div className="danger-zone">
            <h4>Session</h4>
            <button className="btn-danger" onClick={logout}>Sign Out of All Sessions</button>
          </div>
        </div>
      )}
    </div>
  );
}
