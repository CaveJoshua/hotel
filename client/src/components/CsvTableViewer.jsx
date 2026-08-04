import { useState, useMemo } from 'react';
import { parseCSV, jsonToCSV } from '../lib/csvParser.js';
import { toast } from './Toasts.jsx';

export default function CsvTableViewer({ initialCsvText = '', title = 'CSV Data Explorer', defaultFilename = 'resort_data.csv' }) {
  const [csvText, setCsvText] = useState(initialCsvText);
  const [fileName, setFileName] = useState(defaultFilename);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Auto-parse CSV text into headers and rows
  const parsedData = useMemo(() => {
    return parseCSV(csvText);
  }, [csvText]);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!search.trim()) return parsedData.rows;
    const q = search.toLowerCase();
    return parsedData.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [parsedData.rows, search]);

  // Sort rows based on active sort column
  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = String(a[sortCol] || '').toLowerCase();
      const valB = String(b[sortCol] || '').toLowerCase();
      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredRows, sortCol, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  // Handle CSV file selection / auto-read
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast('Please select a valid .csv file', true);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        setCsvText(text);
        setPage(1);
        toast(`Auto-read CSV "${file.name}" successfully ✦`);
      }
    };
    reader.onerror = () => toast('Failed to read CSV file', true);
    reader.readAsText(file);
  }

  function handleSort(col) {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  }

  function handleExport() {
    if (!parsedData.rows.length) {
      toast('No CSV data available to export', true);
      return;
    }
    const blob = new Blob([jsonToCSV(parsedData.rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported_${fileName}`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV file exported successfully ✦');
  }

  return (
    <div className="panel" style={{ background: '#fff', border: '1.5px solid var(--line)', borderRadius: 12, padding: 20 }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <span className="label light" style={{ letterSpacing: '.18em' }}>CSV Auto-Reader</span>
          <h3 className="serif" style={{ fontSize: '1.6rem', marginTop: 2 }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label className="btn btn-ghost" style={{ cursor: 'pointer', border: '1.5px solid var(--line)', padding: '8px 14px', fontSize: '.85rem' }}>
            📁 Open / Drop CSV
            <input type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>
          {parsedData.rows.length > 0 && (
            <button className="btn btn-sky" style={{ padding: '8px 14px', fontSize: '.85rem' }} onClick={handleExport}>
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {/* STATS BAR & SEARCH INPUT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'var(--blue-pale)', color: 'var(--blue-deep)', padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '.8rem' }}>
            {parsedData.rows.length} Total Records
          </span>
          <span className="muted small">File: <b>{fileName}</b></span>
        </div>
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            placeholder="Search CSV columns…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '7px 12px', fontSize: '.85rem', borderRadius: 8, border: '1px solid var(--line)' }}
          />
        </div>
      </div>

      {/* HIGH-VISIBILITY DATA TABLE */}
      {parsedData.headers.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed var(--line)' }}>
          <p className="muted" style={{ margin: 0, fontWeight: 500 }}>No CSV file loaded yet. Select or drop a .csv file above to auto-read contents.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--line)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid var(--line)' }}>
                  <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>#</th>
                  {parsedData.headers.map((h) => (
                    <th
                      key={h}
                      onClick={() => handleSort(h)}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: sortCol === h ? 'var(--blue-deep)' : 'inherit',
                      }}
                    >
                      {h} {sortCol === h ? (sortAsc ? '▲' : '▼') : '↕'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={parsedData.headers.length + 1} style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #e2e8f0', background: rIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>
                        {(page - 1) * pageSize + rIdx + 1}
                      </td>
                      {parsedData.headers.map((h) => (
                        <td key={h} style={{ padding: '9px 12px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {String(row[h] || '—')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span className="small muted">
              Showing {sortedRows.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, sortedRows.length)} of {sortedRows.length} entries
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              <span style={{ padding: '4px 10px', fontSize: '.85rem', fontWeight: 600, alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
