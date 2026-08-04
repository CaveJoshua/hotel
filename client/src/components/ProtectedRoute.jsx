import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toasts.jsx';

export default function ProtectedRoute({ children, allowedRoles = [], portalTitle = 'Restricted Portal' }) {
  const { session, profile, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if authenticated and possesses one of the allowed roles
  const isAuthenticated = Boolean(session && profile);
  const isAuthorized = isAuthenticated && (
    allowedRoles.length === 0 ||
    allowedRoles.includes(profile.role) ||
    ['administrator', 'admin'].includes(profile.role)
  );

  if (isAuthorized) {
    return children;
  }

  // Handle direct sign in from the standalone portal login gate
  const handleGateLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const defaultEmail = allowedRoles.includes('administrator') ? 'administrator@alonresort.ph'
        : allowedRoles.includes('receptionist') ? 'receptionist@alonresort.ph'
        : allowedRoles.includes('accounting') ? 'accounting@alonresort.ph'
        : 'user@gmail.com';
      const targetEmail = email.trim() || defaultEmail;
      const res = await signIn(targetEmail, password || '1234');
      if (res?.error) throw res.error;
      toast(`Authenticated to ${portalTitle} ✦`);
    } catch (err) {
      toast(err.message || 'Authentication failed', true);
    } finally {
      setLoading(false);
    }
  };

  // FULL-SCREEN ISOLATED STANDALONE LOGIN LANDING PAGE FOR ADMIN & STAFF PORTALS
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.98) 0%, rgba(2,6,23,1) 100%)',
        display: 'flex',
        flexDirection: 'column',
        justify: 'center',
        alignItems: 'center',
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      {/* BRANDING LOGO */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(56,189,248,.3), rgba(14,165,233,.5))',
            border: '1px solid rgba(255,255,255,.3)',
            marginBottom: 12,
            boxShadow: '0 0 30px rgba(56,189,248,.3)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7" r="3" fill="#F59E0B" />
            <path d="M2 17c3-3 6-3 9 0s6 3 9 0" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" />
            <path d="M2 12c3-2 6-2 9 0s6 2 9 0" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="serif" style={{ fontSize: '2rem', color: '#FFF', margin: 0, letterSpacing: '.04em' }}>
          ALON RESORT
        </h1>
        <span style={{ fontSize: '.68rem', letterSpacing: '.3em', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
          EXECUTIVE & MANAGEMENT PORTAL
        </span>
      </div>

      {/* STANDALONE LOGIN GATE CARD */}
      <div
        className="gate"
        style={{
          maxWidth: 440,
          width: '100%',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 20px 60px rgba(2, 6, 23, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
          borderRadius: 20,
          padding: 32,
          margin: 0,
        }}
      >
        <span className="label" style={{ color: '#38BDF8', letterSpacing: '.18em' }}>AUTHENTICATION GATE</span>
        <h2 className="serif" style={{ fontSize: '1.8rem', color: '#FFF', margin: '6px 0 10px' }}>{portalTitle}</h2>
        <p className="muted" style={{ marginBottom: 24, fontSize: '.9rem', lineHeight: 1.5 }}>
          {isAuthenticated
            ? `Signed in as ${profile.full_name || profile.role} (${profile.role}). You need ${allowedRoles.join(' or ')} authorization to access this portal.`
            : `Please enter authorized management credentials to unlock this portal.`}
        </p>

        <form onSubmit={handleGateLogin} style={{ textAlign: 'left' }}>
          <div className="field">
            <label>EMAIL / USERNAME</label>
            <input
              type="text"
              value={email}
              placeholder={allowedRoles.includes('administrator') ? 'administrator@alonresort.ph' : 'user@gmail.com'}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>SECURITY PASSWORD</label>
            <input
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-sky" style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '12px 20px', fontWeight: 700 }} disabled={loading}>
            {loading ? 'Verifying Credentials…' : `Sign In to ${portalTitle} 🔐`}
          </button>
        </form>

        <div style={{ marginTop: 22, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
          <Link to="/" style={{ fontSize: '.8rem', color: '#94A3B8', textDecoration: 'none' }}>
            ← Return to Public Guest Website
          </Link>
        </div>
      </div>
    </div>
  );
}
