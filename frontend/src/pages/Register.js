import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard.');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        Object.values(errors).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(m))
        );
      } else {
        toast.error('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">◈</span>
          <h1>Calendra</h1>
        </div>
        <p className="auth-subtitle">Create your account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-row">
            <div className="field-group">
              <label>First Name</label>
              <input type="text" value={form.first_name} onChange={update('first_name')} placeholder="Jane" />
            </div>
            <div className="field-group">
              <label>Last Name</label>
              <input type="text" value={form.last_name} onChange={update('last_name')} placeholder="Doe" />
            </div>
          </div>
          <div className="field-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
          </div>
          <div className="field-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={update('password')} placeholder="Min. 8 characters" required />
          </div>
          <div className="field-group">
            <label>Confirm Password</label>
            <input type="password" value={form.password2} onChange={update('password2')} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
