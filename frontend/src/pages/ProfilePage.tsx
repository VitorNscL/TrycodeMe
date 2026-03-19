import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { Section } from '../components/Section';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ nickname: '', bio: '', avatarUrl: '', specialty: '', certifications: '' });

  useEffect(() => {
    if (user) {
      setForm({
        nickname: user.nickname,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        specialty: user.specialty,
        certifications: Array.isArray(user.certifications) ? user.certifications.join(', ') : ''
      });
    }
  }, [user?.id]);

  if (!user) return <Navigate to="/login" replace />;

  async function save() {
    try {
      await api.put('/auth/me', {
        nickname: form.nickname,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        specialty: form.specialty,
        certifications: form.certifications.split(',').map((item) => item.trim()).filter(Boolean)
      });
      await refresh();
      toast.success('Perfil atualizado', 'Suas informações públicas foram salvas com sucesso.');
    } catch (error: any) {
      toast.error('Não foi possível salvar', error?.response?.data?.message || 'Confira os campos e tente novamente.');
    }
  }

  return (
    <Section title="Seu perfil" subtitle="Nickname, bio, avatar e especialidades públicas.">
      <div className="profile-grid">
        <div className="profile-card">
          <img className="profile-avatar" src={form.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nickname || user.nickname)}`} alt={user.nickname} />
          <h3>{user.nickname}</h3>
          <p>{user.rank}</p>
          <div className="stats-grid">
            <div><strong>{user.lessons_completed}</strong><span>Aulas concluídas</span></div>
            <div><strong>{user.exercises_completed}</strong><span>Exercícios</span></div>
            <div><strong>{user.active_hours}h</strong><span>Horas ativas</span></div>
            <div><strong>{user.wins}</strong><span>Vitórias</span></div>
          </div>
        </div>
        <div className="section-card">
          <div className="form-grid">
            <input className="search-input" placeholder="Nickname" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} />
            <input className="search-input" placeholder="URL do avatar" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} />
            <input className="search-input" placeholder="Especialidade" value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} />
            <input className="search-input" placeholder="Certificações separadas por vírgula" value={form.certifications} onChange={(event) => setForm({ ...form, certifications: event.target.value })} />
            <textarea className="code-editor" placeholder="Biografia" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </div>
          <button className="primary-button" onClick={save}>Salvar perfil</button>
        </div>
      </div>
    </Section>
  );
}
