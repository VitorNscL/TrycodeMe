import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, refresh } = useAuth();
  const [pendingDuels, setPendingDuels] = useState<any[]>([]);
  const [handledDuelIds, setHandledDuelIds] = useState<number[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    const runHeartbeat = () => api.post('/progress/heartbeat').then(() => refresh()).catch(() => undefined);
    runHeartbeat();
    const interval = window.setInterval(runHeartbeat, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setPendingDuels([]);
      return;
    }
    let cancelled = false;
    async function loadPending() {
      try {
        const { data } = await api.get('/challenges/duels/pending');
        if (!cancelled) setPendingDuels(data);
      } catch {
        if (!cancelled) setPendingDuels([]);
      }
    }
    loadPending();
    const interval = window.setInterval(loadPending, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.id]);

  const pendingBanner = useMemo(() => pendingDuels.find((duel) => !handledDuelIds.includes(duel.id)), [pendingDuels, handledDuelIds]);

  async function acceptDuel(duelId: number) {
    try {
      await api.post(`/challenges/duels/${duelId}/accept`);
      setHandledDuelIds((current) => [...current, duelId]);
      toast.success('Duelo aceito', 'Vocês foram levados para a arena 1x1.');
      navigate(`/duelos?duel=${duelId}`);
    } catch (error: any) {
      toast.error('Não foi possível aceitar', error?.response?.data?.message || 'Tente novamente.');
    }
  }

  async function rejectDuel(duelId: number) {
    try {
      await api.post(`/challenges/duels/${duelId}/reject`);
      setHandledDuelIds((current) => [...current, duelId]);
      setPendingDuels((current) => current.filter((duel) => duel.id !== duelId));
      toast.info('Duelo recusado', 'O convite foi recusado.');
    } catch (error: any) {
      toast.error('Não foi possível recusar', error?.response?.data?.message || 'Tente novamente.');
    }
  }

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <header className="topbar">
        <button className="menu-button" onClick={() => setOpen(true)} aria-label="Abrir menu">☰</button>
        <div>
          <h1 className="topbar__title">TryCodeMe</h1>
          <p className="topbar__subtitle">Aprenda programação, desenvolvimento e cibersegurança na prática.</p>
        </div>
      </header>
      {user && pendingBanner && !location.pathname.startsWith('/duelos') ? (
        <div className="duel-banner">
          <div>
            <strong>{pendingBanner.challenger?.nickname || 'Alguém'}</strong>
            <p>te desafiou para um duelo {pendingBanner.mode === 'quiz' ? 'de quiz' : 'de código'} • dificuldade {pendingBanner.difficulty}</p>
          </div>
          <div className="row-actions">
            <button className="primary-button" onClick={() => acceptDuel(pendingBanner.id)}>Aceitar</button>
            <button className="ghost-button" onClick={() => rejectDuel(pendingBanner.id)}>Recusar</button>
          </div>
        </div>
      ) : null}
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
