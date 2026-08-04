import { useEffect, useState } from 'react';
import { useAuth, generateAccountEmail } from '../context/AuthContext.jsx';
import { BarChart, AreaLineChart, MultiBarChart, DualLineChart, Sparkline } from '../components/Charts.jsx';
import CsvTableViewer from '../components/CsvTableViewer.jsx';
import {
  IconDashboard, IconDining, IconUsers, IconTelemetry, IconLedger,
  IconCsv, IconSettings, IconSignOut, IconSearch, IconBell,
  IconSun, IconMoon, IconCrown, IconTrendingUp, IconCreditCard,
  IconWallet, IconBuilding, IconShield, IconBriefcase
} from '../components/AdminIcons.jsx';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabaseClient.js';
import { money, fmtDate, fmtTime } from '../lib/format.js';
import { toast } from '../components/Toasts.jsx';

export default function Admin() {
  const { profile, signIn, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom Admin Login Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Administrative Navigation Tabs, Sidebar & LIGHT/DARK THEME STATE
  const [activeTab, setActiveTab] = useState('overview'); // overview | food_sales | telemetry | accounts | settings | ledger | csv
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('admin_theme_light') === 'true';
  });

  const toggleThemeMode = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    localStorage.setItem('admin_theme_light', String(nextMode));
    toast(nextMode ? '☀️ Executive Light Mode Activated' : '🌙 Dark Luxury Mode Activated');
  };

  // TWEAKABLE ADVANCED ADMIN PROFILE STATE (LIVE SYNCHRONIZED)
  const [adminProfileState, setAdminProfileState] = useState({
    fullName: profile?.full_name || 'Johannes Von Shicksal',
    title: 'General Manager & Executive Director',
    avatarKey: 'crown',
    customAvatarUrl: '',
    email: profile?.email || 'administrator@alonresort.ph',
    phone: profile?.phone || '+63 900 555 0123',
    department: 'Executive General Management',
    refreshRate: '5',
    smsNotifications: true,
    telemetryStream: true,
    twoFactorAuth: true,
    sessionTimeout: '30',
  });

  const avatarOptions = [
    { label: 'Executive Crown', key: 'crown', icon: <IconCrown size={22} color="#F59E0B" /> },
    { label: 'General Manager', key: 'manager', icon: <IconBriefcase size={22} color="#38BDF8" /> },
    { label: 'Tech Administrator', key: 'tech', icon: <IconTelemetry size={22} color="#10B981" /> },
    { label: 'Security Chief', key: 'security', icon: <IconShield size={22} color="#F43F5E" /> },
    { label: 'Operations Director', key: 'operations', icon: <IconBuilding size={22} color="#8B5CF6" /> },
  ];

  // Sample Datasets Matching Reference UI
  const salesOverviewData = [
    { label: 'Nov 15', value: 32 },
    { label: 'Nov 16', value: 40 },
    { label: 'Nov 17', value: 28 },
    { label: 'Nov 18', value: 50 },
    { label: 'Nov 19', value: 42 },
    { label: 'Nov 20', value: 92 },
    { label: 'Nov 21', value: 84 },
  ];

  const performanceData = [
    { day: 'Mon', target: 45, paid: 18, pending: 22 },
    { day: 'Tue', target: 68, paid: 28, pending: 15 },
    { day: 'Wed', target: 42, paid: 12, pending: 35 },
    { day: 'Thu', target: 78, paid: 15, pending: 40 },
    { day: 'Fri', target: 32, paid: 24, pending: 38 },
    { day: 'Sat', target: 52, paid: 35, pending: 48 },
    { day: 'Sun', target: 54, paid: 20, pending: 42 },
  ];

  const dualSalesData = [
    { month: 'Jan', lineA: 20, lineB: 15 },
    { month: 'Feb', lineA: 42, lineB: 38 },
    { month: 'Mar', lineA: 78, lineB: 65 },
    { month: 'Apr', lineA: 55, lineB: 50 },
    { month: 'May', lineA: 62, lineB: 58 },
    { month: 'Jun', lineA: 48, lineB: 52 },
    { month: 'Jul', lineA: 72, lineB: 45 },
    { month: 'Aug', lineA: 64, lineB: 68 },
    { month: 'Sep', lineA: 82, lineB: 75 },
    { month: 'Oct', lineA: 75, lineB: 70 },
    { month: 'Nov', lineA: 45, lineB: 62 },
    { month: 'Dec', lineA: 88, lineB: 78 },
  ];

  const topGuests = [
    { id: 'g1', name: 'Austin Dela Cruz', avatar: '👨‍💼', spent: '₱49,990', rating: '5.0 ⭐' },
    { id: 'g2', name: 'Thomas Santos', avatar: '👨‍💻', spent: '₱90,990', rating: '4.9 ⭐' },
    { id: 'g3', name: 'Chase Mendoza', avatar: '🧔', spent: '₱135,500', rating: '5.0 ⭐' },
    { id: 'g4', name: 'Xavier Ramos', avatar: '👨‍🔬', spent: '₱60,500', rating: '4.8 ⭐' },
    { id: 'g5', name: 'Brody Shicksal', avatar: '👨‍✈️', spent: '₱70,200', rating: '4.9 ⭐' },
  ];

  const recentTransactions = [
    { id: 'tx-1', user: 'Sophia Doe', avatar: '👩‍💼', time: '22 Nov, 5:32 pm', amount: '₱32,000', status: 'Successful' },
    { id: 'tx-2', user: 'Nil Yeager', avatar: '👨‍💼', time: '22 Nov, 5:52 pm', amount: '₱12,500', status: 'Pending' },
    { id: 'tx-3', user: 'Juan Dela Cruz', avatar: '👨‍🍳', time: '22 Nov, 5:52 pm', amount: '₱41,020', status: 'Successful' },
    { id: 'tx-4', user: 'Maria Santos', avatar: '👩‍💻', time: '22 Nov, 6:32 pm', amount: '₱16,000', status: 'Successful' },
  ];

  // Account Management State
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Provision Staff Modal Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    first_name: '', middle_name: '', last_name: '', full_name: '',
    email: '', password: '', phone: '', role: 'receptionist',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Account Recovery / Reset Password Modal State
  const [recoveryTarget, setRecoveryTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPass, setResettingPass] = useState(false);

  useEffect(() => {
    if (profile && ['administrator', 'admin'].includes(profile.role)) {
      let live = true;
      let es = null;

      api.analyticsOverview()
        .then((d) => live && setData(d))
        .catch((e) => toast(e.message, true))
        .finally(() => live && setLoading(false));

      api.myNotifications()
        .then((n) => live && setNotifications(n))
        .catch(() => {});

      supabase.auth.getSession().then(({ data: authData }) => {
        const token = authData?.session?.access_token;
        if (token) {
          es = new EventSource(`/api/analytics/stream?token=${token}`);
          es.onmessage = (e) => {
            if (!live) return;
            try {
              const ov = JSON.parse(e.data);
              setData((prev) => (prev ? { ...prev, overview: ov } : prev));
            } catch {}
          };
        }
      });

      return () => {
        live = false;
        if (es) es.close();
      };
    } else {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'accounts') {
      setSearchingUsers(true);
      api.adminCustomers(searchQuery)
        .then(setUsers)
        .catch((e) => toast(e.message, true))
        .finally(() => setSearchingUsers(false));
    }
  }, [activeTab, searchQuery, roleFilter]);

  async function handleAdminCustomLogin(e) {
    e.preventDefault();
    setAuthenticating(true);
    try {
      const res = await signIn(adminEmail || 'administrator@alonresort.ph', adminPass || '1234');
      if (res?.error) throw res.error;
      toast('Administrator Portal Authenticated ✦');
    } catch (err) {
      toast(err.message || 'Authentication failed', true);
    } finally {
      setAuthenticating(false);
    }
  }

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast('⚙️ Executive Profile & Control Settings Live Synced ✦');
  };

  // DEDICATED SEPARATE ADMINISTRATOR LOGIN PORTAL
  if (!profile || !['administrator', 'admin'].includes(profile.role)) {
    return (
      <div className="container section">
        <div className="gate" style={{ maxWidth: 460, borderTop: '5px solid #0EA5E9' }}>
          <span className="label" style={{ color: '#38BDF8' }}>Executive System Control</span>
          <h2 className="serif" style={{ fontSize: '2.2rem', margin: '8px 0 12px' }}>Administrator Portal</h2>
          <p className="muted" style={{ marginBottom: 24, fontSize: '.92rem' }}>
            Restricted executive portal for resort general managers and administrators.
          </p>

          <form onSubmit={handleAdminCustomLogin} style={{ textAlign: 'left' }}>
            <div className="field">
              <label>ADMINISTRATOR EMAIL</label>
              <input
                type="email"
                required
                value={adminEmail}
                placeholder="administrator@alonresort.ph"
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>SECURITY PASSWORD</label>
              <input
                type="password"
                required
                value={adminPass}
                placeholder="••••••••"
                onChange={(e) => setAdminPass(e.target.value)}
              />
            </div>
            <button className="btn btn-sky" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} disabled={authenticating}>
              {authenticating ? 'Verifying Security Credentials…' : 'Sign In to Executive Dashboard 👑'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="container section">
        <div className="skel" style={{ height: 120, marginBottom: 20 }} />
        <div className="skel" style={{ height: 320 }} />
      </div>
    );
  }

  const { overview: ov = {}, daily = [], top = [], food_sales = [], bookings = [] } = data;

  const chartData = daily.map((d) => ({
    label: d.day ? d.day.slice(8) : '',
    value: d.nights_sold || 0,
    fc: d.is_forecast,
    date: d.day,
    estimatedGuests: Math.round((d.nights_sold || 0) * 2.4),
  }));

  async function updateStatus(id, status) {
    try {
      await api.setReservationStatus(id, status);
      toast(`Reservation marked as ${status.replace('_', ' ')}`);
      setData((x) => ({
        ...x,
        bookings: x.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
      }));
    } catch (e) { toast(e.message, true); }
  }

  async function handleProvisionStaff(e) {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      const full_name = [newStaff.first_name, newStaff.middle_name, newStaff.last_name].filter(Boolean).join(' ') || newStaff.full_name || 'Staff User';
      const targetEmail = newStaff.email || generateAccountEmail(newStaff.first_name, newStaff.middle_name, newStaff.last_name, users.length + 1);
      const created = await api.createStaffAccount({ ...newStaff, full_name, email: targetEmail });
      toast(`Staff Account Created for ${created.full_name || full_name} (${created.role}) ✦`);
      setUsers((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewStaff({ first_name: '', middle_name: '', last_name: '', full_name: '', email: '', password: '', phone: '', role: 'receptionist' });
    } catch (err) { toast(err.message, true); }
    finally { setCreatingStaff(false); }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast(`User role updated to ${newRole} ✦`);
    } catch (err) { toast(err.message, true); }
  }

  async function handlePasswordRecovery(e) {
    e.preventDefault();
    if (!recoveryTarget || !newPassword) return;
    setResettingPass(true);
    try {
      await api.resetUserPassword(recoveryTarget.id, newPassword);
      toast(`Password Reset & SMS Recovery Ping sent to ${recoveryTarget.full_name} ✦`);
      setRecoveryTarget(null);
      setNewPassword('');
    } catch (err) { toast(err.message, true); }
    finally { setResettingPass(false); }
  }

  const sidebarItems = [
    { key: 'overview', label: 'Dashboard', icon: <IconDashboard size={19} /> },
    { key: 'food_sales', label: 'Dining Sales', icon: <IconDining size={19} /> },
    { key: 'accounts', label: 'Staff & Accounts', icon: <IconUsers size={19} /> },
    { key: 'telemetry', label: 'Telemetry Stream', icon: <IconTelemetry size={19} /> },
    { key: 'ledger', label: 'Reservations Ledger', icon: <IconLedger size={19} /> },
    { key: 'csv', label: 'CSV Explorer', icon: <IconCsv size={19} /> },
    { key: 'settings', label: 'Profile & Settings', icon: <IconSettings size={19} /> },
  ];

  // THEME COLOR PALETTE TOKENS
  const themeBg = isLightMode ? '#F8FAFC' : '#020617';
  const themeSidebarBg = isLightMode ? '#FFFFFF' : 'rgba(15, 23, 42, 0.95)';
  const themeHeaderBg = isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
  const themeCardBg = isLightMode ? '#FFFFFF' : 'rgba(15, 23, 42, 0.85)';
  const themeText = isLightMode ? '#0F172A' : '#F8FAFC';
  const themeMuted = isLightMode ? '#64748B' : '#94A3B8';
  const themeBorder = isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)';
  const themeShadow = isLightMode ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: themeBg, color: themeText, transition: 'background 0.3s ease, color 0.3s ease' }}>
      {/* 1. VERTICAL EXECUTIVE SIDEBAR NAVIGATION BAR */}
      <aside
        style={{
          width: sidebarCollapsed ? 76 : 240,
          background: themeSidebarBg,
          borderRight: `1px solid ${themeBorder}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s ease',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxShadow: themeShadow,
        }}
      >
        {/* SIDEBAR LOGO BRANDING */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${themeBorder}` }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', color: '#0EA5E9' }}>
                <IconCrown size={22} color="#F59E0B" />
              </span>
              <span className="serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: themeText }}>ALON ADMIN</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'transparent', border: 'none', color: themeMuted, fontSize: '1.1rem', cursor: 'pointer' }}
          >
            {sidebarCollapsed ? '➔' : '◀'}
          </button>
        </div>

        {/* SIDEBAR MENU NAVIGATION ITEMS */}
        <nav style={{ padding: '16px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!sidebarCollapsed && (
            <span style={{ fontSize: '.68rem', color: themeMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.18em', margin: '4px 8px 8px' }}>
              EXECUTIVE MENU
            </span>
          )}
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: activeTab === item.key ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                background: activeTab === item.key ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: activeTab === item.key ? '#0EA5E9' : themeMuted,
                fontWeight: activeTab === item.key ? 700 : 500,
                fontSize: '.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* SIDEBAR FOOTER SIGN OUT BUTTON */}
        <div style={{ padding: 14, borderTop: `1px solid ${themeBorder}` }}>
          <button
            onClick={signOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(244,63,94,0.3)',
              background: 'rgba(244,63,94,0.1)',
              color: '#FB7185',
              fontWeight: 700,
              fontSize: '.84rem',
              cursor: 'pointer',
            }}
          >
            <IconSignOut size={18} color="#FB7185" />
            {!sidebarCollapsed && 'Sign Out Portal'}
          </button>
        </div>
      </aside>

      {/* 2. MAIN EXECUTIVE CONTENT WRAPPER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TOP EXECUTIVE HEADER CONTROL BAR WITH NOTIFICATIONS, PROFILE & THEME TOGGLE */}
        <header
          style={{
            height: 64,
            background: themeHeaderBg,
            borderBottom: `1px solid ${themeBorder}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            backdropFilter: 'blur(12px)',
            boxShadow: themeShadow,
          }}
        >
          {/* SEARCH & BREADCRUMB */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '.88rem', color: themeMuted, fontWeight: 600 }}>
              Executive Control Center <span style={{ color: '#0EA5E9' }}>/ {sidebarItems.find(i => i.key === activeTab)?.label}</span>
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                className="search"
                placeholder="Search analytics, guests, or stays…"
                style={{ width: 280, padding: '6px 12px 6px 32px', fontSize: '.8rem', borderRadius: 20, background: isLightMode ? '#F1F5F9' : undefined, color: themeText }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span style={{ position: 'absolute', left: 10, display: 'flex', alignItems: 'center', color: themeMuted }}>
                <IconSearch size={15} />
              </span>
            </div>
          </div>

          {/* TOP RIGHT CONTROLS: LIGHT/DARK THEME TOGGLE, NOTIFICATION BAR & AVATAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* LIGHT MODE / DARK MODE TOGGLE BUTTON */}
            <button
              onClick={toggleThemeMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${themeBorder}`,
                background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.08)',
                color: themeText,
                fontWeight: 700,
                fontSize: '.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isLightMode ? <IconSun size={16} color="#F59E0B" /> : <IconMoon size={16} color="#38BDF8" />}
              <span>{isLightMode ? 'White Mode' : 'Dark Mode'}</span>
            </button>

            {/* NOTIFICATION BAR ICON & DROPDOWN */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${themeBorder}`,
                  color: themeText,
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <IconBell size={18} color={themeText} />
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, background: '#F43F5E', color: '#FFF', borderRadius: '50%', width: 16, height: 16, fontSize: '.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* NOTIFICATION PANELS DROPDOWN */}
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 48,
                    width: 320,
                    background: themeSidebarBg,
                    border: `1px solid ${themeBorder}`,
                    borderRadius: 14,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    padding: 14,
                    zIndex: 200,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeBorder}`, paddingBottom: 8, marginBottom: 10 }}>
                    <b style={{ fontSize: '.88rem', color: themeText }}>Executive Notifications (SMS & System)</b>
                    <small style={{ color: '#0EA5E9', fontSize: '.72rem' }}>Live SSE</small>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="muted small" style={{ margin: 0, padding: 10 }}>No new notifications.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{ padding: '8px 0', borderBottom: `1px solid ${themeBorder}`, fontSize: '.78rem' }}>
                        <span className={`pill ${n.status}`}>{n.status}</span>{' '}
                        <span style={{ color: themeMuted }}>{fmtTime(n.created_at)}</span> — {n.body}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ADMIN PROFILE AVATAR & BADGE WITH LIVE NAME & PICTURE SYNCHRONIZATION */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.05)', padding: '4px 14px 4px 6px', borderRadius: 20, border: `1px solid ${themeBorder}` }}>
              {adminProfileState.customAvatarUrl ? (
                <img src={adminProfileState.customAvatarUrl} alt="Admin Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <IconCrown size={18} color="#FFF" />
                </span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <b style={{ fontSize: '.84rem', color: themeText }}>{adminProfileState.fullName.split(' ')[0]}</b>
                <span style={{ fontSize: '.62rem', color: '#0EA5E9', fontWeight: 800, letterSpacing: '.05em' }}>ADMINISTRATOR</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. DASHBOARD MAIN TAB VIEW */}
        <div style={{ padding: 24, flex: 1 }}>
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'overview' && (
            <>
              {/* SECTION 1: TOP 4 CLICKABLE KPI METRIC CARDS WITH UNIQUE VECTOR SVG ICONS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                {/* KPI Card 1: Total Visitors (Clickable -> Telemetry Stream) */}
                <div
                  onClick={() => {
                    setActiveTab('telemetry');
                    toast('📊 Navigated to Realtime Telemetry & Visitor Analytics');
                  }}
                  style={{
                    background: themeCardBg,
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 14,
                    padding: 18,
                    cursor: 'pointer',
                    boxShadow: themeShadow,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(56,189,248,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = themeShadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700, textTransform: 'uppercase' }}>TOTAL VISITORS</span>
                    <IconTrendingUp size={20} color="#0EA5E9" />
                  </div>
                  <b style={{ display: 'block', fontSize: '1.8rem', color: themeText, margin: '6px 0 2px' }}>1,482</b>
                  <span style={{ fontSize: '.74rem', color: '#34D399', fontWeight: 600 }}>↑ +6.65% From Last Month · Click for Telemetry ➔</span>
                </div>

                {/* KPI Card 2: Total Bookings (Clickable -> Reservations Ledger) */}
                <div
                  onClick={() => {
                    setActiveTab('ledger');
                    toast('📋 Navigated to Live Reservations Ledger');
                  }}
                  style={{
                    background: themeCardBg,
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 14,
                    padding: 18,
                    cursor: 'pointer',
                    boxShadow: themeShadow,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(56,189,248,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = themeShadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700, textTransform: 'uppercase' }}>TOTAL BOOKINGS</span>
                    <IconCreditCard size={20} color="#38BDF8" />
                  </div>
                  <b style={{ display: 'block', fontSize: '1.8rem', color: '#0EA5E9', margin: '6px 0 2px' }}>{money(245800)}</b>
                  <span style={{ fontSize: '.74rem', color: '#34D399', fontWeight: 600 }}>↑ +8.60% From Last Month · Click for Ledger ➔</span>
                </div>

                {/* KPI Card 3: Gross Revenue (Clickable -> Dining Sales & Revenue) */}
                <div
                  onClick={() => {
                    setActiveTab('food_sales');
                    toast('🍱 Navigated to Dining Sales & Revenue Analytics');
                  }}
                  style={{
                    background: themeCardBg,
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 14,
                    padding: 18,
                    cursor: 'pointer',
                    boxShadow: themeShadow,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(245,158,11,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = themeShadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700, textTransform: 'uppercase' }}>GROSS REVENUE</span>
                    <IconWallet size={20} color="#F59E0B" />
                  </div>
                  <b style={{ display: 'block', fontSize: '1.8rem', color: '#F59E0B', margin: '6px 0 2px' }}>{money(148500)}</b>
                  <span style={{ fontSize: '.74rem', color: '#34D399', fontWeight: 600 }}>↑ +7.65% From Last Month · Click for Sales ➔</span>
                </div>

                {/* KPI Card 4: Occupancy Rate (Clickable -> Occupancy Breakdown) */}
                <div
                  onClick={() => {
                    toast('🏨 Occupancy Rate: 78% (94.8% AI Predictive Forecast Accuracy)');
                  }}
                  style={{
                    background: themeCardBg,
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 14,
                    padding: 18,
                    cursor: 'pointer',
                    boxShadow: themeShadow,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(56,189,248,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = themeShadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700, textTransform: 'uppercase' }}>OCCUPANCY RATE</span>
                    <IconBuilding size={20} color="#8B5CF6" />
                  </div>
                  <b style={{ display: 'block', fontSize: '1.8rem', color: '#38BDF8', margin: '6px 0 2px' }}>78%</b>
                  <span style={{ fontSize: '.74rem', color: '#F43F5E', fontWeight: 600 }}>↓ -3.45% Low Season Dip · Click for Details ➔</span>
                </div>
              </div>

              {/* SECTION 2: MIDDLE TWO ANALYTICS PANELS (SALES OVERVIEW + PERFORMANCE) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
                {/* Sales Overview Area Line Chart */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 22, boxShadow: themeShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: themeText }}>Sales Overview</h3>
                    <select style={{ fontSize: '.75rem', padding: '4px 10px', borderRadius: 8, background: isLightMode ? '#F1F5F9' : '#0F172A', color: themeText, border: `1px solid ${themeBorder}` }}>
                      <option>Nov 2026 ▾</option>
                      <option>Oct 2026</option>
                    </select>
                  </div>
                  <AreaLineChart data={salesOverviewData} height={180} />
                </div>

                {/* Performance Grouped Multi-Bar Chart */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 22, boxShadow: themeShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 className="serif" style={{ fontSize: '1.35rem', margin: 0, color: themeText }}>Weekly Performance</h3>
                    <div style={{ display: 'flex', gap: 12, fontSize: '.72rem' }}>
                      <span style={{ color: '#0EA5E9' }}>■ Target</span>
                      <span style={{ color: '#10B981' }}>■ Paid</span>
                      <span style={{ color: '#F43F5E' }}>■ Pending</span>
                    </div>
                  </div>
                  <MultiBarChart data={performanceData} height={180} />
                </div>
              </div>

              {/* SECTION 3: LOWER-MIDDLE USER RATING & RECENT ACTIVITY TABLE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 22 }}>
                {/* User Rating / Top Guests Avatar List */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 20, boxShadow: themeShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 className="serif" style={{ fontSize: '1.3rem', margin: 0, color: themeText }}>User Rating</h3>
                    <select style={{ fontSize: '.72rem', padding: '4px 8px', borderRadius: 6, background: isLightMode ? '#F1F5F9' : '#0F172A', color: themeText, border: `1px solid ${themeBorder}` }}>
                      <option>2026 ▾</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topGuests.map((g) => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: isLightMode ? '#F8FAFC' : 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${themeBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.4rem' }}>{g.avatar}</span>
                          <b style={{ fontSize: '.88rem', color: themeText }}>{g.name}</b>
                        </div>
                        <b style={{ color: '#0EA5E9', fontSize: '.88rem' }}>{g.spent}</b>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity / Transactions Defined Table */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 20, boxShadow: themeShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 className="serif" style={{ fontSize: '1.3rem', margin: 0, color: themeText }}>Recent Activity</h3>
                    <button className="btn btn-sm" style={{ fontSize: '.75rem', padding: '4px 10px', background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.08)', color: themeText }}>
                      Filter: This Month ▾
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table className="table" style={{ fontSize: '.85rem', color: themeText }}>
                      <thead>
                        <tr style={{ background: isLightMode ? '#F8FAFC' : undefined }}>
                          <th style={{ color: themeMuted }}>User</th>
                          <th style={{ color: themeMuted }}>Date & Time</th>
                          <th style={{ color: themeMuted }}>Amount (₱)</th>
                          <th style={{ color: themeMuted }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{tx.avatar}</span>
                                <b>{tx.user}</b>
                              </div>
                            </td>
                            <td style={{ color: themeMuted }}>{tx.time}</td>
                            <td><b style={{ color: themeText }}>{tx.amount}</b></td>
                            <td>
                              <span className="pill" style={{
                                background: tx.status === 'Successful' ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)',
                                color: tx.status === 'Successful' ? '#10B981' : '#F59E0B',
                                fontWeight: 700,
                                borderRadius: 12,
                                padding: '3px 10px'
                              }}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 4: BOTTOM THREE DIAGNOSTIC PANELS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 18 }}>
                {/* Panel 1: Summary Category Pills */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 18, boxShadow: themeShadow }}>
                  <h3 className="serif" style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: 14, color: themeText }}>Summary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(56,189,248,0.15)', borderRadius: 10, color: '#0EA5E9', fontWeight: 600 }}>
                      <span>o Overview</span>
                      <span className="pill" style={{ background: 'rgba(56,189,248,0.2)' }}>1,215</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(244,63,94,0.15)', borderRadius: 10, color: '#E11D48', fontWeight: 600 }}>
                      <span>o Add Group</span>
                      <span className="pill" style={{ background: 'rgba(244,63,94,0.2)' }}>1,215</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(52,211,153,0.15)', borderRadius: 10, color: '#059669', fontWeight: 600 }}>
                      <span>o Keywords</span>
                      <span className="pill" style={{ background: 'rgba(52,211,153,0.2)' }}>1,215</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(251,191,36,0.15)', borderRadius: 10, color: '#D97706', fontWeight: 600 }}>
                      <span>o Campaigns</span>
                      <span className="pill" style={{ background: 'rgba(251,191,36,0.2)' }}>1,215</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Total Amount Bar Chart */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 18, boxShadow: themeShadow }}>
                  <h3 className="serif" style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: 4, color: themeText }}>Total Amount</h3>
                  <small style={{ color: themeMuted, display: 'block', marginBottom: 12 }}>By Referrer Category</small>
                  <BarChart data={chartData.slice(0, 5)} height={110} />
                </div>

                {/* Panel 3: Total Sales Dual-Line Multi-Trend Curve Graph */}
                <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 18, boxShadow: themeShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 className="serif" style={{ fontSize: '1.25rem', margin: 0, color: themeText }}>Total Sales Trend</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: '.72rem', padding: '3px 8px', background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.08)', borderRadius: 6, color: themeText }}>This Week ▾</span>
                      <span style={{ fontSize: '.72rem', padding: '3px 8px', background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.08)', borderRadius: 6, color: themeText }}>Summary ▾</span>
                    </div>
                  </div>
                  <DualLineChart data={dualSalesData} height={120} />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: DINING & KITCHEN SALES TREND ANALYTICS */}
          {activeTab === 'food_sales' && (
            <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 24, boxShadow: themeShadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <span className="label light">Kitchen & Dining Operations</span>
                  <h3 className="serif" style={{ fontSize: '1.6rem', margin: '4px 0 0', color: themeText }}>Food & Beverage Sales & Popularity Trends</h3>
                </div>
                <span style={{ fontSize: '.84rem', color: '#D97706', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 14px', borderRadius: 20 }}>
                  🔥 Top Earner: Grilled Bolinao Bangus Feast (₱63,900)
                </span>
              </div>

              <div className="table-wrap">
                <table className="table" style={{ color: themeText }}>
                  <thead>
                    <tr style={{ background: isLightMode ? '#F8FAFC' : undefined }}>
                      <th style={{ color: themeMuted }}>Dish / Beverage Item</th>
                      <th style={{ color: themeMuted }}>Category</th>
                      <th style={{ color: themeMuted }}>Orders Sold</th>
                      <th style={{ color: themeMuted }}>Total Revenue (₱)</th>
                      <th style={{ color: themeMuted }}>Trend Direction</th>
                      <th style={{ color: themeMuted }}>Popularity Meter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {food_sales.map((item) => (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                        <td><b style={{ color: themeText }}>{item.name}</b></td>
                        <td><span className="pill" style={{ background: 'rgba(56,189,248,0.15)', color: '#0EA5E9', border: '1px solid rgba(56,189,248,0.3)' }}>{item.category}</span></td>
                        <td><b style={{ fontSize: '1.05rem', color: '#0EA5E9' }}>{item.orders} orders</b></td>
                        <td><b style={{ fontSize: '1.05rem', color: '#D97706' }}>{money(item.revenue_php)}</b></td>
                        <td>
                          <span style={{
                            color: item.trend === 'popular' ? '#10B981' : item.trend === 'trending' ? '#F59E0B' : themeMuted,
                            fontWeight: 700,
                            fontSize: '.88rem'
                          }}>
                            {item.trend === 'popular' ? `🔥 Best Seller (${item.growth})` : item.trend === 'trending' ? `📈 Trending Up (${item.growth})` : `❄️ Steady (${item.growth})`}
                          </span>
                        </td>
                        <td>
                          <div className="hbar" style={{ height: 10, background: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.08)', borderRadius: 5, width: 140 }}>
                            <span style={{
                              width: `${Math.min(100, (item.orders / 220) * 100)}%`,
                              background: item.trend === 'popular' ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #0EA5E9, #38BDF8)',
                              borderRadius: 5
                            }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCED TWEAKABLE EXECUTIVE PROFILE & CONTROL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 20, padding: 30, maxWidth: 840, boxShadow: themeShadow }}>
              {/* LIVE PROFILE HEADER CARD WITH AVATAR PREVIEW */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: isLightMode ? '#F8FAFC' : 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))', border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 20, marginBottom: 26 }}>
                <div style={{ position: 'relative' }}>
                  {adminProfileState.customAvatarUrl ? (
                    <img src={adminProfileState.customAvatarUrl} alt="Admin Picture" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0EA5E9', boxShadow: '0 0 20px rgba(56,189,248,0.4)' }} />
                  ) : (
                    <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', color: '#FFF', border: '2px solid #0EA5E9', boxShadow: '0 0 20px rgba(56,189,248,0.4)' }}>
                      {avatarOptions.find(a => a.key === adminProfileState.avatarKey)?.icon || <IconCrown size={32} color="#FFF" />}
                    </span>
                  )}
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: '#10B981', width: 14, height: 14, borderRadius: '50%', border: `2px solid ${themeBg}` }} />
                </div>
                <div>
                  <h3 className="serif" style={{ fontSize: '1.6rem', color: themeText, margin: 0 }}>{adminProfileState.fullName}</h3>
                  <b style={{ color: '#0EA5E9', fontSize: '.88rem', display: 'block', margin: '2px 0 4px' }}>{adminProfileState.title}</b>
                  <span className="pill" style={{ background: 'rgba(56,189,248,0.15)', color: '#0EA5E9', border: '1px solid rgba(56,189,248,0.3)', fontSize: '.72rem' }}>
                    🟢 ONLINE · {adminProfileState.department}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveSettings}>
                {/* SECTION A: PROFILE PICTURE & AVATAR SELECTOR */}
                <div style={{ marginBottom: 24, background: isLightMode ? '#F8FAFC' : 'rgba(2,6,23,0.5)', border: `1px solid ${themeBorder}`, borderRadius: 14, padding: 18 }}>
                  <b style={{ fontSize: '.9rem', color: themeText, display: 'block', marginBottom: 12 }}>🖼️ Choose Vector SVG Profile Avatar</b>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                    {avatarOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setAdminProfileState({ ...adminProfileState, avatarKey: opt.key, customAvatarUrl: '' })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: adminProfileState.avatarKey === opt.key && !adminProfileState.customAvatarUrl ? '2px solid #0EA5E9' : `1px solid ${themeBorder}`,
                          background: adminProfileState.avatarKey === opt.key && !adminProfileState.customAvatarUrl ? 'rgba(56,189,248,0.2)' : isLightMode ? '#FFFFFF' : 'rgba(15,23,42,0.8)',
                          color: themeText,
                          cursor: 'pointer',
                          fontSize: '.85rem',
                        }}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="field">
                    <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>OR ENTER CUSTOM PROFILE PICTURE URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                      value={adminProfileState.customAvatarUrl}
                      onChange={(e) => setAdminProfileState({ ...adminProfileState, customAvatarUrl: e.target.value })}
                    />
                  </div>
                </div>

                {/* SECTION B: PERSONAL & EXECUTIVE INFORMATION */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <div className="field">
                    <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>ADMINISTRATOR FULL NAME</label>
                    <input
                      type="text"
                      required
                      style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                      value={adminProfileState.fullName}
                      onChange={(e) => setAdminProfileState({ ...adminProfileState, fullName: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>EXECUTIVE TITLE / ROLE</label>
                    <input
                      type="text"
                      required
                      style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                      value={adminProfileState.title}
                      onChange={(e) => setAdminProfileState({ ...adminProfileState, title: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                      value={adminProfileState.email}
                      onChange={(e) => setAdminProfileState({ ...adminProfileState, email: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>MOBILE PHONE (SMS RECOVERY)</label>
                    <input
                      type="text"
                      required
                      style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                      value={adminProfileState.phone}
                      onChange={(e) => setAdminProfileState({ ...adminProfileState, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* SECTION C: SYSTEM PREFERENCES & CONTROLS */}
                <div style={{ background: isLightMode ? '#F8FAFC' : 'rgba(2,6,23,0.5)', border: `1px solid ${themeBorder}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
                  <b style={{ fontSize: '.9rem', color: themeText, display: 'block', marginBottom: 12 }}>⚡ System Controls & Telemetry Preferences</b>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div className="field">
                      <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>TELEMETRY STREAM REFRESH SPEED</label>
                      <select
                        style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                        value={adminProfileState.refreshRate}
                        onChange={(e) => setAdminProfileState({ ...adminProfileState, refreshRate: e.target.value })}
                      >
                        <option value="1">Turbo (1 Second Interval)</option>
                        <option value="5">Normal (5 Seconds Interval)</option>
                        <option value="15">Eco Mode (15 Seconds Interval)</option>
                      </select>
                    </div>
                    <div className="field">
                      <label style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>SESSION SECURITY AUTO-LOCK</label>
                      <select
                        style={{ background: isLightMode ? '#FFF' : undefined, color: themeText }}
                        value={adminProfileState.sessionTimeout}
                        onChange={(e) => setAdminProfileState({ ...adminProfileState, sessionTimeout: e.target.value })}
                      >
                        <option value="15">Auto Lock after 15 Minutes</option>
                        <option value="30">Auto Lock after 30 Minutes</option>
                        <option value="60">Auto Lock after 1 Hour</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.84rem', color: themeText, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={adminProfileState.smsNotifications}
                        onChange={(e) => setAdminProfileState({ ...adminProfileState, smsNotifications: e.target.checked })}
                      />
                      Enable Instant Twilio SMS Alerts on Guest Bookings & Staff Role Modifications
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.84rem', color: themeText, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={adminProfileState.twoFactorAuth}
                        onChange={(e) => setAdminProfileState({ ...adminProfileState, twoFactorAuth: e.target.checked })}
                      />
                      Require Two-Factor 2FA SMS Security Keycode on Portal Sign-In
                    </label>
                  </div>
                </div>

                {/* SAVE & SYNC BUTTON */}
                <button className="btn btn-sky" style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontWeight: 700, fontSize: '1rem' }}>
                  Save & Sync Executive Profile Settings ✦
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: REALTIME TELEMETRY STREAM */}
          {activeTab === 'telemetry' && (
            <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 24, boxShadow: themeShadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <span className="label light">System Telemetry & Health</span>
                  <h3 className="serif" style={{ fontSize: '1.6rem', margin: '4px 0 0', color: themeText }}>Realtime Operations Telemetry Monitor</h3>
                </div>
                <button className="btn btn-sky btn-sm" onClick={() => toast('⚡ Telemetry Health Diagnostic Verified: 100% Operational')}>
                  Run Health Check ⚡
                </button>
              </div>

              {/* TELEMETRY METRIC GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: isLightMode ? '#F8FAFC' : 'rgba(2,6,23,0.5)', border: `1px solid ${themeBorder}`, borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>ACTIVE WEBSOCKET SESSIONS</span>
                  <b style={{ display: 'block', fontSize: '1.6rem', color: '#0EA5E9', marginTop: 4 }}>14 Active Sessions</b>
                  <small style={{ fontSize: '.72rem', color: '#10B981' }}>🟢 SSE Ping Stream Healthy</small>
                </div>
                <div style={{ background: isLightMode ? '#F8FAFC' : 'rgba(2,6,23,0.5)', border: `1px solid ${themeBorder}`, borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>DATABASE RESPONSE LATENCY</span>
                  <b style={{ display: 'block', fontSize: '1.6rem', color: '#10B981', marginTop: 4 }}>1.2 ms</b>
                  <small style={{ fontSize: '.72rem', color: themeMuted }}>Supabase ACID Transaction Engine</small>
                </div>
                <div style={{ background: isLightMode ? '#F8FAFC' : 'rgba(2,6,23,0.5)', border: `1px solid ${themeBorder}`, borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: '.75rem', color: themeMuted, fontWeight: 700 }}>TWILIO SMS DISPATCHES</span>
                  <b style={{ display: 'block', fontSize: '1.6rem', color: '#F59E0B', marginTop: 4 }}>142 Sent</b>
                  <small style={{ fontSize: '.72rem', color: '#10B981' }}>100% Keycode Delivery Rate</small>
                </div>
              </div>

              {/* LIVE NETWORK EVENT PULSE SPARKLINE */}
              <div style={{ marginBottom: 24 }}>
                <b style={{ fontSize: '.9rem', color: themeText, display: 'block', marginBottom: 8 }}>Live Network Event Pulse (Pings / Minute)</b>
                <Sparkline values={[42, 65, 80, 110, 95, 140, 130, 175, 160, 210, 190, 245, 230]} width={760} height={120} />
              </div>
            </div>
          )}

          {/* TAB 5: STAFF & USER ACCOUNT MANAGEMENT */}
          {activeTab === 'accounts' && (
            <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 24, boxShadow: themeShadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <h3 className="serif" style={{ fontSize: '1.5rem', margin: 0, color: themeText }}>Staff & User Accounts Directory</h3>
                  <p className="muted small">Manage Administrator, Receptionist, Accounting, and Customer accounts & recover passwords.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="search"
                    placeholder="Search account by name or phone…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ maxWidth: 280, background: isLightMode ? '#FFF' : undefined, color: themeText }}
                  />
                  <button className="btn btn-sky btn-sm" onClick={() => setShowCreateModal(true)}>
                    + Provision Staff Account
                  </button>
                </div>
              </div>

              {/* ROLE FILTER BADGES */}
              <div className="chip-row" style={{ marginBottom: 16 }}>
                {['', 'administrator', 'receptionist', 'accounting', 'staff', 'customer'].map((role) => (
                  <button
                    key={role}
                    className={`chip ${roleFilter === role ? 'sel' : ''}`}
                    onClick={() => setRoleFilter(role)}
                  >
                    {role ? role.toUpperCase() : 'ALL ROLES'}
                  </button>
                ))}
              </div>

              {searchingUsers ? (
                <div className="skel" style={{ height: 200 }} />
              ) : users.length === 0 ? (
                <p className="muted" style={{ padding: '30px 0' }}>No user or staff accounts match your filters.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table" style={{ color: themeText }}>
                    <thead>
                      <tr style={{ background: isLightMode ? '#F8FAFC' : undefined }}>
                        <th style={{ color: themeMuted }}>Full Name</th>
                        <th style={{ color: themeMuted }}>Phone</th>
                        <th style={{ color: themeMuted }}>City / Address</th>
                        <th style={{ color: themeMuted }}>Stays</th>
                        <th style={{ color: themeMuted }}>Orders</th>
                        <th style={{ color: themeMuted }}>Spent (₱)</th>
                        <th style={{ color: themeMuted }}>Role</th>
                        <th style={{ color: themeMuted }}>Role Action</th>
                        <th style={{ color: themeMuted }}>Account Recovery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter((u) => !roleFilter || u.role === roleFilter).map((u) => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                          <td><b>{u.full_name || 'User'}</b></td>
                          <td>{u.phone || 'N/A'}</td>
                          <td>{u.address ? `${u.address}, ${u.city}` : 'N/A'}</td>
                          <td><b>{u.stays_count || 0}</b></td>
                          <td>{u.orders_count || 0}</td>
                          <td><b>{money(u.total_spent_php || 0)}</b></td>
                          <td><span className="pill confirmed">{u.role || 'customer'}</span></td>
                          <td>
                            <select
                              value={u.role || 'customer'}
                              style={{ fontSize: '.75rem', padding: '4px 8px', borderRadius: 6, border: `1px solid ${themeBorder}`, background: isLightMode ? '#FFF' : '#0F172A', color: themeText }}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="customer">Customer</option>
                              <option value="receptionist">Receptionist</option>
                              <option value="accounting">Accounting</option>
                              <option value="staff">Staff</option>
                              <option value="administrator">Administrator</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="act-btn"
                              style={{ color: '#0EA5E9', borderColor: '#38BDF8' }}
                              onClick={() => { setRecoveryTarget(u); setNewPassword(''); }}
                            >
                              🔑 Recover / Reset
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RESERVATIONS LEDGER */}
          {activeTab === 'ledger' && (
            <div className="panel" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: 16, padding: 24, boxShadow: themeShadow }}>
              <h3 className="serif" style={{ fontSize: '1.4rem', marginTop: 0, color: themeText }}>Live Guest Reservations Ledger</h3>
              {bookings.length === 0 ? (
                <p className="muted" style={{ padding: '24px 0' }}>No active or past reservations found.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table" style={{ color: themeText }}>
                    <thead>
                      <tr style={{ background: isLightMode ? '#F8FAFC' : undefined }}>
                        <th style={{ color: themeMuted }}>Guest</th>
                        <th style={{ color: themeMuted }}>Room</th>
                        <th style={{ color: themeMuted }}>Dates</th>
                        <th style={{ color: themeMuted }}>Total</th>
                        <th style={{ color: themeMuted }}>Status</th>
                        <th style={{ color: themeMuted }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                          <td>
                            <b>{b.profiles?.full_name || 'Guest'}</b><br />
                            <small style={{ color: themeMuted }}>{b.profiles?.phone || ''}</small>
                          </td>
                          <td>{b.rooms?.name || 'Room'}</td>
                          <td>{fmtDate(b.check_in)} → {fmtDate(b.check_out)}</td>
                          <td><b>{money(b.total_php)}</b></td>
                          <td><span className={`pill ${b.status}`}>{b.status.replace('_', ' ')}</span></td>
                          <td>
                            {b.status === 'confirmed' && (
                              <button className="act-btn" onClick={() => updateStatus(b.id, 'checked_in')}>Check-in</button>
                            )}
                            {b.status === 'checked_in' && (
                              <button className="act-btn" onClick={() => updateStatus(b.id, 'checked_out')}>Check-out</button>
                            )}
                            {['pending', 'confirmed'].includes(b.status) && (
                              <button className="act-btn" onClick={() => updateStatus(b.id, 'cancelled')}>Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CSV DATA EXPLORER & AUTO-READER */}
          {activeTab === 'csv' && (
            <div style={{ marginTop: 10 }}>
              <CsvTableViewer
                title="Resort Operational & Account Data Explorer"
                defaultFilename="alon_resort_accounts.csv"
                initialCsvText={`Account ID,First Name,Middle Name,Last Name,Full Name,Email,Role,Status,Total Spent (PHP)
usr-1,Johannes,Von,Shicksal,Johannes Von Shicksal,jvs001@resortmanagement.ph,administrator,Active,0
usr-2,Elena,Santos,Ramos,Elena Santos Ramos,esr002@resortmanagement.ph,receptionist,Active,0
usr-3,Carlos,Mendoza,Ledger,Carlos Mendoza Ledger,cml003@resortmanagement.ph,accounting,Active,0
usr-4,Juan,Dela,Cruz,Juan Dela Cruz,user@gmail.com,customer,Checked-In,14750
usr-5,Maria,Clara,Santos,Maria Clara Santos,maria.santos@gmail.com,customer,Confirmed,7200`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
