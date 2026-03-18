import { useState, useEffect } from 'react';
import { getApiUrl, fetchHealth } from './api';

function App() {
  const [health, setHealth] = useState(null);
  const apiUrl = getApiUrl();

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => setHealth({ status: 'error', message: err.message }));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Habito XP</h1>
      <p>
        <strong>API:</strong> <code>{apiUrl}</code>
      </p>
      <p>
        <strong>Health:</strong>{' '}
        {health ? JSON.stringify(health) : 'A carregar…'}
      </p>
    </div>
  );
}

export default App;
