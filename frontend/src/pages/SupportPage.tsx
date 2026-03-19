import { useState } from 'react';
import { api } from '../api/client';
import { Section } from '../components/Section';
import { useToast } from '../contexts/ToastContext';

export function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', category: 'Dúvida', message: '' });
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await api.post('/support', form);
      toast.success('Dúvida enviada', 'Sua mensagem foi recebida e ficará disponível no painel do admin.');
      setForm({ name: '', email: '', category: 'Dúvida', message: '' });
    } catch (error: any) {
      toast.error('Envio falhou', error?.response?.data?.message || 'Tente novamente em alguns instantes.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Section title="Mandar sua dúvida" subtitle="Caixa de contato preparada para o admin responder depois.">
      <form className="auth-card" onSubmit={submit}>
        <input className="search-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Seu nome" />
        <input className="search-input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Seu email" />
        <input className="search-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Categoria" />
        <textarea className="code-editor" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Explique sua dúvida" />
        <button className="primary-button" type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</button>
      </form>
    </Section>
  );
}
