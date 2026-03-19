import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Section } from '../components/Section';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await register(email, password, displayName);
      navigate('/perfil');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha no cadastro.');
    }
  }

  return (
    <Section title="Criar conta" subtitle="Cadastro opcional. Visitantes conseguem navegar sem login.">
      <form className="auth-card" onSubmit={submit}>
        <input className="search-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nome de exibição" />
        <input className="search-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input className="search-input" value={password} type="password" onChange={(event) => setPassword(event.target.value)} placeholder="Senha" />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit">Criar conta</button>
      </form>
    </Section>
  );
}
