// Remove https:// duplicado se vier da env (ex: https://https://lucro.onrender.com -> https://lucro.onrender.com)
const raw = import.meta.env.VITE_API_URL || '';
const apiUrl = raw.replace(/^https:\/\/https:\/\//i, 'https://').replace(/^http:\/\/http:\/\//i, 'http://').trim();

export function getApiUrl() {
  return apiUrl;
}

export async function fetchHealth() {
  const res = await fetch(`${apiUrl}/health`);
  return res.json();
}
