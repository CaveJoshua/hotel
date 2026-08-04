export const money = (n) => `₱${Number(n).toLocaleString()}`;
export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const initials = (n = '?') => n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const addDaysISO = (base, days) => {
  const d = new Date(base); d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
