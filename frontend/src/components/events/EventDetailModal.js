import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import EventModal from './EventModal';
import toast from 'react-hot-toast';

export default function EventDetailModal({ event, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePerm, setSharePerm] = useState('read');
  const [shareLoading, setShareLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [localEvent, setLocalEvent] = useState(event);

  const isOwner = localEvent.owner?.id === user?.id;
  const canEdit = isOwner || localEvent.user_permission === 'edit';

  const refreshEvent = async () => {
    const { data } = await api.get(`/events/${localEvent.id}/`);
    setLocalEvent(data);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${localEvent.id}/`);
      toast.success('Event deleted');
      onDelete();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setShareLoading(true);
    try {
      await api.post(`/events/${localEvent.id}/share/`, { email: shareEmail, permission: sharePerm });
      toast.success(`Shared with ${shareEmail}`);
      setShareEmail('');
      await refreshEvent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share');
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnshare = async (shareId) => {
    try {
      await api.delete(`/events/${localEvent.id}/share/`, { data: { share_id: shareId } });
      toast.success('Access removed');
      await refreshEvent();
    } catch {
      toast.error('Failed to remove access');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/events/${localEvent.id}/attachments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File attached!');
      await refreshEvent();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`/events/${localEvent.id}/attachments/${attachmentId}/`);
      toast.success('Attachment removed');
      await refreshEvent();
    } catch {
      toast.error('Failed to remove attachment');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (showEdit) {
    return (
      <EventModal
        event={localEvent}
        onClose={() => setShowEdit(false)}
        onSave={() => { onUpdate(); setShowEdit(false); }}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${localEvent.color}` }}>
          <div>
            <h3>{localEvent.title}</h3>
            <span className="event-owner">by {localEvent.owner?.full_name || localEvent.owner?.email}</span>
          </div>
          <div className="header-actions">
            {canEdit && <button className="icon-btn" onClick={() => setShowEdit(true)} title="Edit">✎</button>}
            {isOwner && <button className="icon-btn danger" onClick={handleDelete} title="Delete">🗑</button>}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-tabs">
          <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Details</button>
          {isOwner && <button className={activeTab === 'sharing' ? 'active' : ''} onClick={() => setActiveTab('sharing')}>Sharing {localEvent.shares?.length > 0 && `(${localEvent.shares.length})`}</button>}
          <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>Files {localEvent.attachments?.length > 0 && `(${localEvent.attachments.length})`}</button>
        </div>

        <div className="detail-content">
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="detail-row">
                <span className="detail-icon">🕐</span>
                <div>
                  <p>{format(parseISO(localEvent.start_datetime), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="detail-time">
                    {format(parseISO(localEvent.start_datetime), 'h:mm a')}
                    {localEvent.end_datetime && ` – ${format(parseISO(localEvent.end_datetime), 'h:mm a')}`}
                  </p>
                </div>
              </div>
              {localEvent.description && (
                <div className="detail-row">
                  <span className="detail-icon">📝</span>
                  <p>{localEvent.description}</p>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-icon">🔐</span>
                <p className="permission-badge">{localEvent.user_permission || 'owner'}</p>
              </div>
            </div>
          )}

          {activeTab === 'sharing' && isOwner && (
            <div className="sharing-tab">
              <form onSubmit={handleShare} className="share-form">
                <div className="share-input-row">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                  <select value={sharePerm} onChange={e => setSharePerm(e.target.value)}>
                    <option value="read">Can view</option>
                    <option value="edit">Can edit</option>
                  </select>
                  <button type="submit" className="btn-primary" disabled={shareLoading}>
                    {shareLoading ? <span className="spinner-sm" /> : 'Share'}
                  </button>
                </div>
              </form>

              <div className="shares-list">
                {localEvent.shares?.length === 0 && <p className="empty-msg">Not shared with anyone yet.</p>}
                {localEvent.shares?.map(share => (
                  <div key={share.id} className="share-item">
                    <div className="share-avatar">{share.shared_with?.email?.[0]?.toUpperCase()}</div>
                    <div className="share-info">
                      <p>{share.shared_with?.full_name || share.shared_with?.email}</p>
                      <span className={`perm-badge ${share.permission}`}>{share.permission === 'edit' ? '✎ Can edit' : '👁 Can view'}</span>
                    </div>
                    <button className="icon-btn danger sm" onClick={() => handleUnshare(share.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="files-tab">
              {canEdit && (
                <label className="upload-btn">
                  {uploadLoading ? <span className="spinner-sm" /> : '+ Attach File'}
                  <input type="file" hidden onChange={handleFileUpload} disabled={uploadLoading} />
                </label>
              )}

              <div className="attachments-list">
                {localEvent.attachments?.length === 0 && <p className="empty-msg">No files attached.</p>}
                {localEvent.attachments?.map(att => (
                  <div key={att.id} className="attachment-item">
                    <span className="file-icon">📄</span>
                    <div className="file-info">
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="file-name">{att.filename}</a>
                      <span className="file-meta">{formatFileSize(att.file_size)} · {att.uploaded_by?.email}</span>
                    </div>
                    <div className="file-actions">
                      <a href={att.file_url} download className="icon-btn" title="Download">⬇</a>
                      {(isOwner || att.uploaded_by?.id === user?.id) && (
                        <button className="icon-btn danger sm" onClick={() => handleDeleteAttachment(att.id)}>×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
