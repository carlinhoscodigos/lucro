import { useState } from 'react';
import './Login.css';

const EnvelopeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: chamar API de login
    console.log({ email, password });
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-logo">
            Lucrô.<span className="login-logo-dot" aria-hidden />
          </h1>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">E-mail</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden>
                <EnvelopeIcon />
              </span>
              <input
                id="login-email"
                type="email"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Senha</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden>
                <LockIcon />
              </span>
              <input
                id="login-password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit">
            Entrar no sistema
            <ArrowRightIcon />
          </button>
        </form>

        <p className="login-security">
          <span className="login-security-icon" aria-hidden>
            <CheckIcon />
          </span>
          Acesso seguro com criptografia de ponta a ponta
        </p>
      </div>
    </div>
  );
}
