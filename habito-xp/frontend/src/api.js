const apiUrl = import.meta.env.VITE_API_URL;

export function getApiUrl() {
  return apiUrl;
}

export async function fetchHealth() {
  const res = await fetch(`${apiUrl}/health`);
  return res.json();
}
