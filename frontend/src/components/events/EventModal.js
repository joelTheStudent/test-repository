import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];

const toLocalInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return format(d, "yyyy-MM-dd'T'HH:mm");
};

export default function EventModal({ event, defaultDate, onClose, onSave }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_datetime: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'09:00") : toLocalInput(new Date()),
    end_datetime: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'10:00") : toLocalInput(new Date()),
    all_day: false,
    color: '#6366f1',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description || '',
        start_datetime: toLocalInput(event.start_datetime),
        end_datetime: toLocalInput(event.end_datetime || event.start_datetime),
        all_day: event.all_day,
        color: event.color,
      });
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: new Date(form.end_datetime).toISOString(),
      };
      if (isEdit) {
        await api.patch(`/events/${event.id}/`, payload);
        toast.success('Event updated!');
      } else {
        await api.post('/events/', payload);
        toast.success('Event created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Event' : 'New Event'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-group">
            <label>Title</label>
            <input type="text" value={form.title} onChange={update('title')} placeholder="Event title" required />
          </div>

          <div className="field-group">
            <label>Description</label>
            <textarea value={form.description} onChange={update('description')} placeholder="Optional description" rows={3} />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Start</label>
              <input type="datetime-local" value={form.start_datetime} onChange={update('start_datetime')} required />
            </div>
            <div className="field-group">
              <label>End</label>
              <input type="datetime-local" value={form.end_datetime} onChange={update('end_datetime')} />
            </div>
          </div>

          <div className="field-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>

          <div className="field-group checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} />
              All day event
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
