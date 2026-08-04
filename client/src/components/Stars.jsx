export default function Stars({ value = 0, onChange, size = 15 }) {
  return (
    <span className={`stars ${onChange ? 'interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          onClick={onChange ? () => onChange(n) : undefined}
          fill={n <= Math.round(value) ? '#F59E0B' : '#DCE6F2'}>
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
      ))}
    </span>
  );
}
