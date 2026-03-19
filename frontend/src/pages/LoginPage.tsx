import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Section } from '../components/Section';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';

export function LoginPage() {
  const [email, setEmail] = useState('admin@trycodeme.dev');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: config } = useFetch<{ googleEnabled: boolean }>(async () => (await api.get('/auth/config')).data, []);

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('trycodeme_token', token);
      navigate('/perfil');
    }
  }, [params, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await login(email, password);
      navigate('/perfil');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha no login.');
    }
  }

  return (
    <Section title="Login" subtitle="Entre com email e senha. O login com Google só aparece quando as chaves OAuth estiverem configuradas.">
      <form className="auth-card" onSubmit={submit}>
        <input className="search-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input className="search-input" value={password} type="password" onChange={(event) => setPassword(event.target.value)} placeholder="Senha" />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit">Entrar</button>
        {config?.googleEnabled ? (
          <a className="ghost-button" href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}/api/auth/google`}>Entrar com Google</a>
        ) : (
          <button className="ghost-button" type="button" disabled>Google indisponível no modo local</button>
        )}
        <Link className="nav-link" to="/register">Não tem conta? Registrar</Link>
      </form>
    </Section>
  );
}
