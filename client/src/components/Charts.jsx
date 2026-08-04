import { useState } from 'react';

// Smooth Curved Area Line Chart (Matching "Sales Overview" in reference UI)
export function AreaLineChart({ data = [], height = 180 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value));
  const range = Math.max(1, max - min);
  const w = 480;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (w - 40) + 20;
    const y = height - 30 - ((d.value - min) / range) * (height - 60);
    return { x, y, label: d.label, value: d.value };
  });

  // Construct smooth cubic bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#0F172A" stroke="#38BDF8" strokeWidth={2.5} />
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="10" fill="#94A3B8">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// Multi-Color Series Grouped Bar Chart (Matching "Performance" in reference UI)
export function MultiBarChart({ data = [], height = 180 }) {
  if (!data || data.length === 0) return null;
  const max = 100;
  const w = 480;
  const groupWidth = (w - 40) / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%">
      {data.map((group, i) => {
        const gx = i * groupWidth + 20;
        const targetH = (group.target / max) * (height - 50);
        const paidH = (group.paid / max) * (height - 50);
        const pendingH = (group.pending / max) * (height - 50);

        return (
          <g key={i}>
            {/* Target Bar (Blue) */}
            <rect x={gx} y={height - 30 - targetH} width={10} height={targetH} rx={3} fill="#0EA5E9" />
            {/* Paid Bar (Green) */}
            <rect x={gx + 12} y={height - 30 - paidH} width={10} height={paidH} rx={3} fill="#10B981" />
            {/* Pending Bar (Coral/Amber) */}
            <rect x={gx + 24} y={height - 30 - pendingH} width={10} height={pendingH} rx={3} fill="#F43F5E" />

            <text x={gx + 17} y={height - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">{group.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Dual Line Spline Comparison Graph (Matching "Total Sales" in reference UI)
export function DualLineChart({ data = [], height = 160 }) {
  if (!data || data.length === 0) return null;
  const max = 100;
  const w = 480;

  const ptsA = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (w - 40) + 20,
    y: height - 25 - (d.lineA / max) * (height - 45),
  }));

  const ptsB = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (w - 40) + 20,
    y: height - 25 - (d.lineB / max) * (height - 45),
  }));

  const buildSpline = (pts) => {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const c = pts[i];
      const n = pts[i + 1];
      d += ` C ${c.x + (n.x - c.x) / 2} ${c.y}, ${c.x + (n.x - c.x) / 2} ${n.y}, ${n.x} ${n.y}`;
    }
    return d;
  };

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%">
      <path d={buildSpline(ptsA)} fill="none" stroke="#38BDF8" strokeWidth="2.5" />
      <path d={buildSpline(ptsB)} fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeDasharray="3 3" />
      {data.map((d, i) => (
        <text key={i} x={(i / (data.length - 1)) * (w - 40) + 20} y={height - 4} textAnchor="middle" fontSize="9" fill="#94A3B8">
          {d.month}
        </text>
      ))}
    </svg>
  );
}

export function BarChart({ data = [], height = 160 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const w = Math.max(300, data.length * 42);

  // Predictive calculations
  const historical = data.filter(d => !d.fc);
  const forecasted = data.filter(d => d.fc);

  const avgHistorical = historical.length > 0
    ? (historical.reduce((sum, d) => sum + d.value, 0) / historical.length)
    : 0;

  const totalWeeklyPredictedVisitors = Math.round(data.reduce((sum, d) => sum + (d.estimatedGuests || d.value * 2.4), 0));
  const totalMonthlyPredictedVisitors = Math.round(totalWeeklyPredictedVisitors * 4.3);

  const activeItem = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="bar-chart-container" style={{ width: '100%' }}>
      {/* PREDICTIVE VISITOR SUMMARY STATS BAND */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.12em', color: '#94A3B8', fontWeight: 700 }}>
            Weekly Visitor Forecast
          </span>
          <b style={{ display: 'block', fontSize: '1.4rem', color: '#38BDF8', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
            {totalWeeklyPredictedVisitors.toLocaleString()} <span style={{ fontSize: '.8rem', color: '#34D399', fontWeight: 600 }}>↑ +14.2%</span>
          </b>
          <small style={{ fontSize: '.72rem', color: '#CBD5E1' }}>Expected across next 7 days</small>
        </div>

        <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.12em', color: '#94A3B8', fontWeight: 700 }}>
            Monthly Projected Guests
          </span>
          <b style={{ display: 'block', fontSize: '1.4rem', color: '#7DD3FC', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
            {totalMonthlyPredictedVisitors.toLocaleString()} <span style={{ fontSize: '.8rem', color: '#FBBF24', fontWeight: 600 }}>Peak Season</span>
          </b>
          <small style={{ fontSize: '.72rem', color: '#CBD5E1' }}>Estimated for August 2026</small>
        </div>

        <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.12em', color: '#94A3B8', fontWeight: 700 }}>
            {activeItem?.fc ? '🤖 AI Forecast Detail' : '📊 Historical Record'}
          </span>
          <b style={{ display: 'block', fontSize: '1.1rem', color: '#F8FAFC', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
            {activeItem?.label ? `Aug ${activeItem.label}` : 'Selected Day'}: {activeItem?.value || 0} stays
          </b>
          <small style={{ fontSize: '.72rem', color: '#38BDF8' }}>
            ~{Math.round((activeItem?.value || 0) * 2.4)} expected visitors
          </small>
        </div>
      </div>

      {/* SVG BAR CHART GRAPH */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg className="chart-bars" viewBox={`0 0 ${w} ${height + 34}`} width="100%" style={{ overflow: 'visible' }}>
          {/* Average Baseline Line */}
          {avgHistorical > 0 && (
            <g>
              <line
                x1={0}
                y1={height - (avgHistorical / max) * height}
                x2={w}
                y2={height - (avgHistorical / max) * height}
                stroke="rgba(245,158,11,0.5)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text x={w - 6} y={height - (avgHistorical / max) * height - 4} textAnchor="end" fontSize="9" fill="#F59E0B" fontWeight="600">
                Avg: {Math.round(avgHistorical)} stays/day
              </text>
            </g>
          )}

          {data.map((d, i) => {
            const h = Math.max(6, (d.value / max) * height);
            const x = i * 42 + 10;
            const y = height - h;
            const isSelected = hoverIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Bar Background Hover Column */}
                <rect
                  x={x - 4}
                  y={0}
                  width={34}
                  height={height + 24}
                  fill={isSelected ? 'rgba(56,189,248,0.1)' : 'transparent'}
                  rx={6}
                />

                {/* Actual Bar Rect */}
                <rect
                  className={`bar ${d.fc ? 'fc' : ''}`}
                  x={x}
                  y={y}
                  width={26}
                  height={h}
                  rx={6}
                  fill={d.fc ? 'url(#fcGrad)' : 'url(#histGrad)'}
                  stroke={isSelected ? '#FFFFFF' : d.fc ? '#38BDF8' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                  style={{ transition: 'all 0.25s ease' }}
                />

                {/* Bar Top Value Badge */}
                <text
                  x={x + 13}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={d.fc ? '#7DD3FC' : '#F8FAFC'}
                >
                  {d.value}
                </text>

                {/* X-Axis Date Label */}
                <text
                  x={x + 13}
                  y={height + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={d.fc ? '700' : '500'}
                  fill={d.fc ? '#38BDF8' : '#8AA0BC'}
                >
                  {d.label}
                </text>

                {/* Forecast Sub-label Indicator */}
                {d.fc && (
                  <text x={x + 13} y={height + 30} textAnchor="middle" fontSize="7.5" fill="#FBBF24" fontWeight="800">
                    PRED
                  </text>
                )}
              </g>
            );
          })}

          <defs>
            <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* GRAPH DEFINITION & LEGEND FOOTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '.75rem', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#0EA5E9', display: 'inline-block' }} />
            <b>Solid Blue:</b> Recorded Stays
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(56,189,248,0.4)', border: '1px dashed #38BDF8', display: 'inline-block' }} />
            <b>Translucent:</b> AI Predictive Forecast
          </span>
        </div>
        <div>
          <span>⚡ AI Occupancy Model Accuracy: <b>94.8%</b></span>
        </div>
      </div>
    </div>
  );
}

export function Sparkline({ values, width = 260, height = 56 }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) =>
    `${(i / Math.max(1, values.length - 1)) * width},${height - (v / max) * (height - 8) - 4}`);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity=".4" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill="url(#sg)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#0EA5E9" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
