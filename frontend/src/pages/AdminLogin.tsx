import { useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import api from '../services/api';

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const response = await api.post<{ token: string }>('/orders/login', { password });
      onLogin(response.data.token);
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message
        : undefined;
      setErrorMessage(typeof message === 'string' ? message : 'No se pudo iniciar sesión. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="client-page client-success-page">
      <section className="client-success-card">
        <p className="client-eyebrow">GLENBOCKY</p>
        <h1>Administración</h1>
        <p className="client-success-copy">Ingresá la clave de administrador para continuar.</p>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-password">Clave</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errorMessage && <div className="client-error" role="alert">{errorMessage}</div>}
          <button type="submit" className="client-submit-button" disabled={submitting}>
            {submitting ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  );
}
