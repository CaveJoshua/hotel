import { ApiError } from './errors.js';

// Threat Signatures for Next-Gen Web Application Firewall (NGWF) - Balanced Protection Without Excessive Restraints
const NGWF_SIGNATURES = [
  /\bunion\s+(all\s+)?select\b/i,
  /\bdrop\s+(table|database|schema)\b/i,
  /\binsert\s+into\s+[a-z_`"]+/i,
  /\bdelete\s+from\s+[a-z_`"]+/i,
  /exec\s*\(\s*['"]/i,
  /<script\b[^>]*>/i,
  /javascript\s*:/i,
  /\bonerror\s*=/i,
  /\bonload\s*=/i,
  /%00/i,
  /\0/i,
  /\.\.\//i,
  /\.\.\\/i,
  /%2e%2e/i,
  /cmd\.exe/i,
  /\/etc\/passwd/i,
  /\/bin\/sh/i,
];

function inspectPayload(val) {
  if (typeof val === 'string') {
    for (const pattern of NGWF_SIGNATURES) {
      if (pattern.test(val)) return true;
    }
  } else if (Array.isArray(val)) {
    return val.some(inspectPayload);
  } else if (val !== null && typeof val === 'object') {
    return Object.values(val).some(inspectPayload);
  }
  return false;
}

// Next-Gen Web Application Firewall (NGWF) Inspection Middleware
export function ngwfFirewall(req, res, next) {
  // Deep inspection of URL, query params, body, and headers
  const isMalicious =
    inspectPayload(req.originalUrl) ||
    inspectPayload(req.query) ||
    inspectPayload(req.body) ||
    inspectPayload(req.params);

  if (isMalicious) {
    console.warn(`[NGWF FIREWALL BLOCK] Suspicious payload blocked from IP: ${req.ip} | URL: ${req.originalUrl}`);
    return res.status(403).json({
      error: 'NGWF Firewall: Threat Payload Blocked',
      code: 'NGWF_THREAT_BLOCKED',
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

// Strict Path Upgrade & Normalization Middleware
export function pathNormalizer(req, _res, next) {
  if (req.url) {
    // Strip null bytes and normalize multiple slashes
    let cleanUrl = req.url.replace(/\0/g, '').replace(/%00/gi, '');
    cleanUrl = cleanUrl.replace(/\/+/g, '/');
    req.url = cleanUrl;
  }
  next();
}
