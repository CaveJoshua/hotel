import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';
import { roomImg } from '../lib/images.js';
import Stars from '../components/Stars.jsx';
import { useReveal } from '../hooks/useReveal.js';

const CATS = ['All', 'Cottage', 'Garden', 'Suite', 'Villa', 'Dorm'];

const DEFAULT_ROOMS = [
  { id: '1', name: 'Habagat Sea-View Suite', slug: 'habagat-suite', category: 'Suite', description: 'Front suite with private balcony hanging over the turquoise ocean.', capacity: 3, units: 4, rate_php: 2950, rating_avg: 4.9, rating_count: 38, amenities: ['AC', 'Sea view', 'Balcony', 'Breakfast'] },
  { id: '2', name: 'Nipa Cove Cottage', slug: 'nipa-cove', category: 'Cottage', description: 'Native nipa cottage steps from the sand with fan cooling and hammock porch.', capacity: 2, units: 6, rate_php: 1450, rating_avg: 4.8, rating_count: 52, amenities: ['Fan', 'Hot shower', 'WiFi', 'Porch'] },
  { id: '3', name: 'Duyan Family Villa', slug: 'duyan-villa', category: 'Villa', description: 'Two-bedroom family villa with private outdoor hammock deck & barbecue grill.', capacity: 6, units: 3, rate_php: 4800, rating_avg: 5.0, rating_count: 24, amenities: ['AC', 'Kitchenette', 'Grill deck', 'WiFi'] },
  { id: '4', name: 'Garden Breeze Room', slug: 'garden-breeze', category: 'Garden', description: 'Air-conditioned room looking out onto lush mango gardens.', capacity: 2, units: 8, rate_php: 1850, rating_avg: 4.9, rating_count: 41, amenities: ['AC', 'WiFi', 'Hot shower', 'Breakfast'] },
  { id: '5', name: 'Backpacker Bunk Suite', slug: 'backpacker-bunk', category: 'Dorm', description: 'Cozy air-conditioned shared bunk suite steps away from Tambak beach front.', capacity: 1, units: 12, rate_php: 750, rating_avg: 4.7, rating_count: 65, amenities: ['AC', 'Lockers', 'Shared Bath', 'WiFi'] },
];

export default function Rooms() {
  const [all, setAll] = useState([]);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.rooms().then((data) => {
      if (Array.isArray(data) && data.length > 0) setAll(data);
    }).catch(() => {});
  }, []);

  useReveal(true);

  const displayRooms = all.length > 0 ? all : DEFAULT_ROOMS;

  const list = useMemo(() => displayRooms.filter((s) =>
    (cat === 'All' || s.category === cat) &&
    (q === '' || s.name.toLowerCase().includes(q.toLowerCase()))), [displayRooms, cat, q]);

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head reveal">
          <div>
            <span className="label">Sleep by the sea</span>
            <h2 style={{ fontSize: 'clamp(2.2rem,4.4vw,3.6rem)' }}>Rooms & <em style={{ fontStyle: 'italic' }}>rates</em></h2>
          </div>
          <input className="search" placeholder="Search rooms…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chip-row">
          {CATS.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'sel' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="rooms-grid">
          {list.map((s, i) => (
            <div className="room-card reveal" key={s.id || s.slug} style={{ transitionDelay: `${(i % 2) * 110}ms` }}>
              <div className="im"><img src={roomImg(s.slug)} alt={s.name} loading="lazy" /></div>
              <div className="bd">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label">{s.category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars value={Number(s.rating_avg)} size={13} />
                    <small className="muted">{Number(s.rating_avg).toFixed(1)} ({s.rating_count || 12})</small>
                  </span>
                </div>
                <h3>{s.name}</h3>
                <p className="muted" style={{ fontSize: '.92rem' }}>{s.description}</p>
                <div style={{ margin: '14px 0' }}>{s.amenities?.map((a) => <span key={a} className="tag">{a}</span>)}</div>
                <div className="rate-line">
                  <span className="serif">{money(s.rate_php)}<small className="muted" style={{ fontFamily: 'var(--font-sans)' }}> /night</small></span>
                  <span className="muted small">sleeps {s.capacity} · {s.units} units</span>
                </div>
                <Link to="/" state={{ book: s.slug }} className="btn btn-sky"
                  style={{ width: '100%', justifyContent: 'center' }}>Reserve</Link>
              </div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="empty">No rooms match — try another filter.</p>}
      </div>
    </section>
  );
}
