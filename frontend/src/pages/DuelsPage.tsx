import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function DuelsPage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duelId = searchParams.get('duel');
  const { data: duels, loading, refetch } = useFetch<any[]>(async () => user ? (await api.get('/challenges/duels')).data : [], [user?.id]);
  const { data: users } = useFetch<any[]>(async () => user?.role ? (await api.get('/auth/directory')).data : [], [user?.id]);
  const activeDuel = useMemo(() => (duels || []).find((item) => String(item.id) === String(duelId)) || null, [duels, duelId]);
  const [form, setForm] = useState({ opponentId: 2, difficulty: 'Médio', mode: 'code' as 'code' | 'quiz' });
  const [submission, setSubmission] = useState('');
  const [duelFeedback, setDuelFeedback] = useState('');

  async function challenge(event: React.FormEvent) {
    event.preventDefault();
    try {
      const { data } = await api.post('/challenges/duels', form);
      toast.success('Desafio enviado', 'O convite foi criado e o outro usuário já pode aceitar.');
      await refetch();
      navigate(`/duelos?duel=${data.id}`);
    } catch (error: any) {
      toast.error('Não foi possível enviar', error?.response?.data?.message || 'Verifique os dados e tente novamente.');
    }
  }

  async function acceptDuel(id: number) {
    try {
      await api.post(`/challenges/duels/${id}/accept`);
      toast.success('Duelo aceito', 'A arena foi aberta para vocês dois.');
      await refetch();
      navigate(`/duelos?duel=${id}`);
    } catch (error: any) {
      toast.error('Não foi possível aceitar', error?.response?.data?.message || 'Tente novamente.');
    }
  }

  async function rejectDuel(id: number) {
    try {
      await api.post(`/challenges/duels/${id}/reject`);
      toast.info('Duelo recusado', 'O convite foi recusado.');
      await refetch();
    } catch (error: any) {
      toast.error('Não foi possível recusar', error?.response?.data?.message || 'Tente novamente.');
    }
  }

  async function submitDuel() {
    if (!activeDuel) return;
    try {
      const { data } = await api.post(`/challenges/duels/${activeDuel.id}/submit`, { source: submission });
      setDuelFeedback(data.feedback);
      if (data.passed) {
        toast.success('Vitória confirmada', 'Seu resultado foi salvo no perfil.');
        await refresh();
        await refetch();
      }
    } catch (error: any) {
      setDuelFeedback(error?.response?.data?.message || 'Não foi possível enviar sua solução.');
    }
  }

  const availableOpponents = (users || []).filter((entry) => entry.id !== user?.id);
  const pendingForUser = (duels || []).filter((item) => item.status === 'pending' && item.opponent_id === user?.id);

  return (
    <Section title="Desafios 1x1" subtitle="Desafie alguém, receba convites e entre na arena automaticamente ao aceitar.">
      {!user ? <p>Faça login para desafiar alguém.</p> : (
        <>
          {pendingForUser.length ? (
            <div className="cards-grid duel-pending-grid">
              {pendingForUser.map((duel) => (
                <article key={duel.id} className="content-card compact">
                  <h3>Convite pendente</h3>
                  <p><strong>{duel.challenger?.nickname}</strong> te desafiou para um duelo {duel.mode === 'quiz' ? 'de quiz' : 'de código'}.</p>
                  <div className="row-actions">
                    <button className="primary-button" onClick={() => acceptDuel(duel.id)}>Aceitar</button>
                    <button className="ghost-button" onClick={() => rejectDuel(duel.id)}>Recusar</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <form className="auth-card" onSubmit={challenge}>
            <select className="select-input" value={form.opponentId} onChange={(event) => setForm({ ...form, opponentId: Number(event.target.value) })}>
              {availableOpponents.map((entry) => <option key={entry.id} value={entry.id}>{entry.nickname} ({entry.role})</option>)}
            </select>
            <select className="select-input" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as 'code' | 'quiz' })}>
              <option value="code">Programa / código</option>
              <option value="quiz">Quiz</option>
            </select>
            <select className="select-input" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {['Iniciante', 'Fácil', 'Médio', 'Difícil', 'Master'].map((level) => <option key={level}>{level}</option>)}
            </select>
            <button className="primary-button">Enviar desafio</button>
          </form>

          {activeDuel && activeDuel.status === 'active' ? (
            <div className="content-card duel-arena">
              <div className="content-card__topline">
                <span className="badge badge--accent">Arena ativa</span>
                <span className="badge">{activeDuel.difficulty}</span>
                <span className="badge badge--outline">{activeDuel.mode}</span>
              </div>
              <h3>{activeDuel.exercise?.title}</h3>
              <p>{activeDuel.exercise?.prompt}</p>
              <textarea
                className="code-editor"
                value={submission}
                onChange={(event) => setSubmission(event.target.value)}
                placeholder={activeDuel.mode === 'quiz' ? 'Digite a opção correta' : activeDuel.exercise?.starter_code || 'Escreva sua solução aqui'}
              />
              <div className="row-actions">
                <button className="primary-button" onClick={submitDuel}>Enviar solução</button>
              </div>
              {duelFeedback ? <div className="feedback-box"><strong>Status:</strong> {duelFeedback}</div> : null}
            </div>
          ) : null}

          {loading ? <p>Carregando duelos...</p> : (
            <div className="cards-grid">
              {(duels || []).map((duel) => (
                <article key={duel.id} className="content-card">
                  <h3>Duelo #{duel.id}</h3>
                  <p>Status: {duel.status}</p>
                  <p>Dificuldade: {duel.difficulty}</p>
                  <p>Modo: {duel.mode === 'quiz' ? 'Quiz' : 'Código'}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </Section>
  );
}
