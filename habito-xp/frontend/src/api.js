export function getApiUrl() {
  return import.meta.env.VITE_API_URL;
}

export async function fetchHealth() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
  return res.json();
}
