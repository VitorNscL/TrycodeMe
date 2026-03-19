import { useState } from 'react';
import { api } from '../api/client';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function CompetitionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: competitions, loading, refetch } = useFetch<any[]>(async () => (await api.get('/challenges/competitions')).data, []);
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'Médio', startsAt: '', durationMinutes: 60, exerciseId: 1 });

  async function create(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.post('/challenges/competitions', form);
      toast.success('Competição criada', 'A competição foi publicada no calendário competitivo.');
      setForm({ title: '', description: '', difficulty: 'Médio', startsAt: '', durationMinutes: 60, exerciseId: 1 });
      await refetch();
    } catch (error: any) {
      toast.error('Falha ao publicar', error?.response?.data?.message || 'Confira os campos e tente novamente.');
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await api.patch(`/challenges/competitions/${id}/status`, { status });
      toast.success('Competição atualizada', `Status alterado para ${status}.`);
      await refetch();
    } catch (error: any) {
      toast.error('Falha ao atualizar', error?.response?.data?.message || 'Tente novamente.');
    }
  }

  async function removeCompetition(id: number) {
    try {
      await api.delete(`/challenges/competitions/${id}`);
      toast.success('Competição apagada', 'A competição foi removida do calendário.');
      await refetch();
    } catch (error: any) {
      toast.error('Falha ao apagar', error?.response?.data?.message || 'Tente novamente.');
    }
  }

  return (
    <Section title="Programação competitiva" subtitle="Competições públicas por horário e ranking de resolução.">
      {loading ? <p>Carregando competições...</p> : (
        <div className="cards-grid">
          {(competitions || []).map((competition) => (
            <article key={competition.id} className="content-card">
              <div className="content-card__topline">
                <span className="badge badge--accent">{competition.status}</span>
                <span className="badge">{competition.difficulty}</span>
              </div>
              <h3>{competition.title}</h3>
              <p>{competition.description}</p>
              <p>Início: {new Date(competition.starts_at).toLocaleString()}</p>
              {user?.role === 'admin' ? (
                <div className="row-actions wrap-actions">
                  <button className="ghost-button" onClick={() => updateStatus(competition.id, 'live')}>Colocar ao vivo</button>
                  <button className="ghost-button" onClick={() => updateStatus(competition.id, 'suspended')}>Suspender</button>
                  <button className="ghost-button" onClick={() => updateStatus(competition.id, 'finished')}>Encerrar</button>
                  <button className="primary-button danger-button" onClick={() => removeCompetition(competition.id)}>Apagar</button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {user?.role === 'admin' ? (
        <form className="section-card" onSubmit={create}>
          <h3>Criar competição</h3>
          <div className="form-grid">
            <input className="search-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Título" />
            <input className="search-input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descrição" />
            <input className="search-input" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} placeholder="Dificuldade" />
            <input className="search-input" type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
            <input className="search-input" type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} placeholder="Duração" />
            <input className="search-input" type="number" value={form.exerciseId} onChange={(event) => setForm({ ...form, exerciseId: Number(event.target.value) })} placeholder="Exercise ID" />
          </div>
          <button className="primary-button">Publicar competição</button>
        </form>
      ) : null}
    </Section>
  );
}
