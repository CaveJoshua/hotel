/**
 * Auto CSV Parser Utility
 * Parses raw CSV text string into headers and rows JSON objects.
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return { headers: [], rows: [] };

  const lines = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      lines.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.length > 0) lines.push(cur);

  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const nxt = line[i + 1];
      if (ch === '"') {
        if (inQ && nxt === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h, idx) => h || `Column_${idx + 1}`);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function jsonToCSV(items) {
  if (!items || !items.length) return '';
  const headers = Object.keys(items[0]);
  const csvRows = [];
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

  for (const item of items) {
    const values = headers.map((h) => {
      const val = item[h] !== undefined && item[h] !== null ? String(item[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}
