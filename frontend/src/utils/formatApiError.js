export default function formatApiError(error) {
  if (!error || !error.response) return null;
  const data = error.response.data;
  // Common cases
  if (typeof data === 'string') return data;
  // Check typical detail fields
  const detail = data?.detail ?? data?.message ?? data?.error ?? data;

  if (!detail) return null;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    // Array of validation errors like [{loc,msg,...}]
    return detail.map(d => {
      if (typeof d === 'string') return d;
      if (d?.msg) return d.msg;
      if (d?.message) return d.message;
      if (d?.detail) return d.detail;
      return JSON.stringify(d);
    }).join(' • ');
  }

  if (typeof detail === 'object') {
    // Try common keys
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return String(detail);
}
