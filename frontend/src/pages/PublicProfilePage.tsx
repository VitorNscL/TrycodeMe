import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { LessonCard } from '../components/LessonCard';
import { Section } from '../components/Section';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFetch } from '../hooks/useFetch';

export function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { data: profile, loading, error } = useFetch<any>(async () => (await api.get(`/profiles/users/${id}`)).data, [id]);
  const { data: exercises } = useFetch<any[]>(async () => (await api.get('/content/exercises')).data, []);

  async function challenge(mode: 'code' | 'quiz') {
    if (!user || !profile) return navigate('/login');
    const exercise = (exercises || []).find((item) => item.type === mode);
    if (!exercise) {
      toast.info('Nenhum exercício disponível', `Ainda não existe um exercício de ${mode === 'code' ? 'código' : 'quiz'} pronto para duelo.`);
      return;
    }
    try {
      await api.post('/challenges/duels', {
        opponentId: profile.id,
        exerciseId: exercise.id,
        difficulty: 'Médio'
      });
      toast.success('Desafio enviado', `Você desafiou ${profile.nickname || profile.display_name} para um 1x1.`);
      navigate('/duelos');
    } catch (error: any) {
      toast.error('Não foi possível desafiar', error?.response?.data?.message || 'Tente novamente daqui a pouco.');
    }
  }

  if (loading) return <p>Carregando perfil...</p>;
  if (error || !profile) return <p>{error || 'Perfil não encontrado.'}</p>;

  return (
    <div className="page-grid">
      <Section title={profile.nickname || profile.display_name} subtitle={profile.bio || 'Sem bio cadastrada.'}>
        <div className="teacher-card teacher-card--large public-profile-head">
          <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nickname || profile.display_name)}`} alt={profile.nickname || profile.display_name} />
          <div className="public-profile-main">
            <div className="row-actions profile-title-row">
              <strong className="profile-main-name">{profile.display_name}</strong>
              <span className="badge badge--accent">{profile.rank}</span>
              <span className="badge badge--outline">{profile.competitive_rank}</span>
              {profile.role !== 'user' ? <span className="badge">{profile.role === 'admin' ? 'ADMIN' : 'PROFESSOR'}</span> : null}
            </div>
            <p>{profile.specialty || 'Aprendendo e contribuindo no TryCodeMe.'}</p>
            <div className="tag-row">{(profile.certifications || []).map((cert: string) => <span key={cert} className="tag">{cert}</span>)}</div>
            {user && user.id !== profile.id ? (
              <div className="row-actions">
                <button className="primary-button" onClick={() => challenge('code')}>Desafiar no código</button>
                <button className="ghost-button" onClick={() => challenge('quiz')}>Desafiar no quiz</button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="stats-grid compact-stats">
          <div><strong>{profile.lessons_completed}</strong><span>Aulas concluídas</span></div>
          <div><strong>{profile.exercises_completed}</strong><span>Exercícios resolvidos</span></div>
          <div><strong>{profile.active_hours}h</strong><span>Horas ativas</span></div>
          <div><strong>{profile.wins}</strong><span>Vitórias 1x1</span></div>
          <div><strong>{profile.losses}</strong><span>Derrotas 1x1</span></div>
          <div><strong>{profile.win_rate}%</strong><span>Taxa de vitória</span></div>
        </div>
      </Section>

      <Section title="Aulas publicadas" subtitle="Se o perfil for professor ou admin, o conteúdo publicado aparece aqui.">
        <div className="cards-grid">
          {(profile.lessons || []).length ? (profile.lessons || []).map((lesson: any) => (
            <LessonCard key={lesson.id} lesson={{ ...lesson, tags: [], keywords: [], featured: 0, status: 'published', author_id: profile.id, author_label: '', learn_outcomes: '', type: lesson.type || 'practical' }} />
          )) : <p>Nenhuma aula pública cadastrada por este perfil ainda.</p>}
        </div>
      </Section>
    </div>
  );
}
