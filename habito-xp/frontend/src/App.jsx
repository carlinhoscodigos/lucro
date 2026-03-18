const raw = import.meta.env.VITE_API_URL || '';

fetch(`${API_URL}/health`)
  .then(res => res.json())
  .then(data => console.log(data)); 