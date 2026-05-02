// Empty string = relative URLs → Vite proxy forwards to FastAPI at :8000
// Set VITE_API_URL in .env for production deployments
const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function login(phone, pin) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({phone, pin})
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function syncVisits(token, visits) {
  const res = await fetch(`${BASE_URL}/api/v1/sync`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
    body: JSON.stringify({visits})
  });
  return res.json();
}

export async function getDuePatients(token) {
  const res = await fetch(`${BASE_URL}/api/v1/patients/due`, {
    headers: {'Authorization': `Bearer ${token}`}
  });
  if (!res.ok) throw new Error('Failed to fetch due patients');
  return res.json();
}
