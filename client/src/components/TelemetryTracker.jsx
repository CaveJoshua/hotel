import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function TelemetryTracker() {
  const location = useLocation();

  useEffect(() => {
    let session_id = localStorage.getItem('resort_telemetry_id');
    if (!session_id) {
      session_id = `sess-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('resort_telemetry_id', session_id);
    }

    const ping = () => {
      fetch('/api/telemetry/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id, path: location.pathname }),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, [location]);

  return null;
}
