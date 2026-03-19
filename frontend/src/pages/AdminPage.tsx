import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { Section } from '../components/Section';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Exercise, LessonSection, SiteSettings, User } from '../types';

const emptySection = (): LessonSection => ({ kind: 'text', title: '', content: '' });

type ContentMode = 'lesson' | 'exercise' | 'lesson_with_exercise';

export function AdminPage() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState<'content' | 'users' | 'catalog' | 'appearance'>('content');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [contentMode, setContentMode] = useState<ContentMode>('lesson_with_exercise');
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({
    homeBackgroundUrl: '/site-mark.png',
    communityRegisteredCount: '+ de 1000',
    communityHeadline: 'Conecte-se com devs, estudantes e especialistas que estão evoluindo junto com você.',
    communitySubtitle: 'Comunidade viva com perfis públicos, ranks, desafios e espaço para trocar conhecimento sem poluir a experiência visual.',
    donationQrUrl: '',
    donationGoalsText: 'Cada doação ajuda a manter o TryCodeMe no ar, publicar novas trilhas e abrir mais desafios gratuitos para quem está tentando mudar de vida através da tecnologia. Seu apoio fortalece uma comunidade real, acessível e feita para evoluir junto.'
  });
  const [sections, setSections] = useState<LessonSection[]>([emptySection()]);
  const [lessonForm, setLessonForm] = useState({
    title: '', slug: '', summary: '', learnOutcomes: '', language: 'JavaScript', category: 'Programação', difficulty: 'Iniciante', type: 'practical', tags: 'javascript, iniciante', keywords: 'javascript, lógica', featured: true, status: 'published', authorId: 0, authorLabel: 'Fundador', thumbnailUrl: ''
  });
  const [exerciseForm, setExerciseForm] = useState({
    title: '', summary: '', language: 'JavaScript', difficulty: 'Iniciante', type: 'code', prompt: '', starterCode: '', solution: '', testConfig: '{}', featured: true, thumbnailUrl: ''
  });

  useEffect(() => {
    if (!user) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const [lessonRes, exerciseRes, settingsRes] = await Promise.all([
        api.get('/content/lessons'),
        api.get('/content/exercises'),
        api.get('/settings/public')
      ]);
      setLessons(lessonRes.data);
      setExercises(exerciseRes.data);
      setSettingsForm(settingsRes.data);
      if (user.role === 'admin') {
        const userRes = await api.get('/auth/users');
        setUsers(userRes.data);
        setLessonForm((current) => ({ ...current, authorId: current.authorId || userRes.data[0]?.id || user.id }));
      } else {
        setUsers([user]);
        setLessonForm((current) => ({ ...current, authorId: user.id }));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!['admin', 'teacher'].includes(user.role)) return <Navigate to="/" replace />;

  function updateSection(index: number, field: keyof LessonSection, value: string) {
    setSections((current) => current.map((section, idx) => idx === index ? { ...section, [field]: value } : section));
  }

  function useSectionAsThumbnail(index: number) {
    const target = sections[index];
    if (!target || !['image', 'gif', 'video'].includes(target.kind)) {
      toast.info('Miniatura inválida', 'Escolha um bloco de imagem, gif ou vídeo para usar como thumbnail.');
      return;
    }
    setLessonForm((current) => ({ ...current, thumbnailUrl: target.content }));
    toast.success('Thumbnail definida', 'Essa mídia será usada como capa da aula.');
  }

  async function handleCreateContent(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.post('/content/bundles', {
        mode: contentMode,
        lesson: contentMode === 'exercise' ? undefined : {
          ...lessonForm,
          authorId: Number(lessonForm.authorId),
          featured: Boolean(lessonForm.featured),
          tags: lessonForm.tags.split(',').map((item) => item.trim()).filter(Boolean),
          keywords: lessonForm.keywords.split(',').map((item) => item.trim()).filter(Boolean),
          sections
        },
        exercise: contentMode === 'lesson' ? undefined : {
          ...exerciseForm,
          featured: Boolean(exerciseForm.featured),
          testConfig: JSON.parse(exerciseForm.testConfig || '{}')
        }
      });
      toast.success('Conteúdo publicado', 'A publicação foi salva e sua sessão foi mantida.');
      setSections([emptySection()]);
      setLessonForm((current) => ({ ...current, title: '', slug: '', summary: '', learnOutcomes: '', thumbnailUrl: '' }));
      setExerciseForm((current) => ({ ...current, title: '', summary: '', prompt: '', starterCode: '', solution: '', testConfig: '{}', thumbnailUrl: '' }));
      await loadData();
      await refresh();
    } catch (error: any) {
      toast.error('Falha ao publicar', error?.response?.data?.message || 'Não foi possível salvar o conteúdo.');
    }
  }

  async function updateRole(targetUserId: number, role: User['role']) {
    try {
      await api.patch(`/auth/users/${targetUserId}/role`, { role });
      setUsers((current) => current.map((item) => item.id === targetUserId ? { ...item, role } : item));
      toast.success('Permissão atualizada', 'O usuário recebeu a nova função no sistema.');
    } catch (error: any) {
      toast.error('Falha ao alterar permissão', error?.response?.data?.message || 'Falha ao alterar a permissão.');
    }
  }

  async function saveAppearance(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await api.put('/settings/public', settingsForm);
      setSettingsForm(response.data);
      toast.success('Aparência atualizada', 'A home e a área de doações já podem usar os novos conteúdos.');
    } catch (error: any) {
      toast.error('Falha ao salvar aparência', error?.response?.data?.message || 'Tente novamente em alguns instantes.');
    }
  }

  const stats = useMemo(() => ({
    lessons: lessons.length,
    exercises: exercises.length,
    users: users.length,
    featured: lessons.filter((item) => item.featured).length
  }), [lessons, exercises, users]);

  return (
    <div className="page-grid">
      <Section title="Painel administrativo" subtitle="Organizado por abas para conteúdo, usuários, aparência e catálogo publicado.">
        <div className="stats-grid admin-stats">
          <div><strong>{stats.lessons}</strong><span>Aulas</span></div>
          <div><strong>{stats.exercises}</strong><span>Exercícios</span></div>
          <div><strong>{stats.users}</strong><span>Usuários</span></div>
          <div><strong>{stats.featured}</strong><span>Destaques</span></div>
        </div>
        <div className="tab-row">
          <button className={`nav-link ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>Novo conteúdo</button>
          {user.role === 'admin' ? <button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Usuários</button> : null}
          {user.role === 'admin' ? <button className={`nav-link ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>Aparência</button> : null}
          <button className={`nav-link ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>Catálogo</button>
        </div>
      </Section>

      {tab === 'content' ? (
        <Section title="Criar conteúdo" subtitle="Escolha se quer publicar só aula, só exercício ou uma aula com exercício final.">
          <form className="section-card" onSubmit={handleCreateContent}>
            <div className="toolbar toolbar--single">
              <select className="select-input" value={contentMode} onChange={(event) => setContentMode(event.target.value as ContentMode)}>
                <option value="lesson">Só aula</option>
                <option value="exercise">Só exercício</option>
                <option value="lesson_with_exercise">Aula com exercício final</option>
              </select>
              {user.role === 'admin' ? (
                <select className="select-input" value={lessonForm.authorId} onChange={(event) => setLessonForm({ ...lessonForm, authorId: Number(event.target.value) })}>
                  {users.filter((entry) => entry.role === 'teacher' || entry.role === 'admin').map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.nickname} ({entry.role})</option>
                  ))}
                </select>
              ) : null}
            </div>

            {contentMode !== 'exercise' ? (
              <>
                <div className="form-grid">
                  <input className="search-input" value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} placeholder="Título da aula" />
                  <input className="search-input" value={lessonForm.slug} onChange={(event) => setLessonForm({ ...lessonForm, slug: event.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="Slug" />
                  <input className="search-input" value={lessonForm.summary} onChange={(event) => setLessonForm({ ...lessonForm, summary: event.target.value })} placeholder="Resumo" />
                  <input className="search-input" value={lessonForm.learnOutcomes} onChange={(event) => setLessonForm({ ...lessonForm, learnOutcomes: event.target.value })} placeholder="O que será aprendido" />
                  <input className="search-input" value={lessonForm.language} onChange={(event) => setLessonForm({ ...lessonForm, language: event.target.value })} placeholder="Linguagem" />
                  <input className="search-input" value={lessonForm.category} onChange={(event) => setLessonForm({ ...lessonForm, category: event.target.value })} placeholder="Categoria" />
                  <select className="select-input" value={lessonForm.difficulty} onChange={(event) => setLessonForm({ ...lessonForm, difficulty: event.target.value })}>
                    {['Iniciante', 'Fácil', 'Médio', 'Difícil', 'Master'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select className="select-input" value={lessonForm.type} onChange={(event) => setLessonForm({ ...lessonForm, type: event.target.value })}>
                    {['practical', 'theory', 'cyber', 'quiz', 'competitive'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input className="search-input" value={lessonForm.tags} onChange={(event) => setLessonForm({ ...lessonForm, tags: event.target.value })} placeholder="Tags separadas por vírgula" />
                  <input className="search-input" value={lessonForm.keywords} onChange={(event) => setLessonForm({ ...lessonForm, keywords: event.target.value })} placeholder="Palavras-chave" />
                  <input className="search-input" value={lessonForm.authorLabel} onChange={(event) => setLessonForm({ ...lessonForm, authorLabel: event.target.value })} placeholder="Crédito do autor" />
                  <input className="search-input" value={lessonForm.thumbnailUrl} onChange={(event) => setLessonForm({ ...lessonForm, thumbnailUrl: event.target.value })} placeholder="URL da thumbnail da aula" />
                  <select className="select-input" value={lessonForm.status} onChange={(event) => setLessonForm({ ...lessonForm, status: event.target.value })}>
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </div>
                {lessonForm.thumbnailUrl ? <div className="settings-preview__image lesson-thumb-preview" style={{ backgroundImage: `url(${lessonForm.thumbnailUrl})` }} /> : null}
                <div className="lesson-builder">
                  {sections.map((section, index) => (
                    <div key={index} className="builder-block">
                      <select className="select-input" value={section.kind} onChange={(event) => updateSection(index, 'kind', event.target.value as LessonSection['kind'])}>
                        {['text', 'code', 'image', 'gif', 'video', 'command', 'tip', 'alert'].map((kind) => <option key={kind}>{kind}</option>)}
                      </select>
                      <input className="search-input" value={section.title} onChange={(event) => updateSection(index, 'title', event.target.value)} placeholder="Título do bloco" />
                      <textarea className="code-editor" value={section.content} onChange={(event) => updateSection(index, 'content', event.target.value)} placeholder={['image', 'gif', 'video'].includes(section.kind) ? 'Cole a URL da mídia' : 'Conteúdo do bloco'} />
                      {['image', 'gif'].includes(section.kind) && section.content ? <img className="media-preview media-preview--small" src={section.content} alt={section.title || 'Prévia'} /> : null}
                      {section.kind === 'video' && section.content ? <div className="video-frame video-frame--small"><iframe src={section.content} title={section.title || 'Prévia'} allowFullScreen /></div> : null}
                      {['image', 'gif', 'video'].includes(section.kind) ? <button type="button" className="ghost-button" onClick={() => useSectionAsThumbnail(index)}>Usar este bloco como thumbnail</button> : null}
                    </div>
                  ))}
                  <button type="button" className="ghost-button" onClick={() => setSections((current) => [...current, emptySection()])}>Adicionar bloco</button>
                </div>
              </>
            ) : null}

            {contentMode !== 'lesson' ? (
              <div className="exercise-box">
                <h3>Exercício</h3>
                <div className="form-grid">
                  <input className="search-input" value={exerciseForm.title} onChange={(event) => setExerciseForm({ ...exerciseForm, title: event.target.value })} placeholder="Título do exercício" />
                  <input className="search-input" value={exerciseForm.summary} onChange={(event) => setExerciseForm({ ...exerciseForm, summary: event.target.value })} placeholder="Resumo" />
                  <input className="search-input" value={exerciseForm.language} onChange={(event) => setExerciseForm({ ...exerciseForm, language: event.target.value })} placeholder="Linguagem" />
                  <input className="search-input" value={exerciseForm.thumbnailUrl} onChange={(event) => setExerciseForm({ ...exerciseForm, thumbnailUrl: event.target.value })} placeholder="URL da thumbnail do exercício" />
                  <select className="select-input" value={exerciseForm.type} onChange={(event) => setExerciseForm({ ...exerciseForm, type: event.target.value })}>
                    {['code', 'quiz', 'cyber'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <textarea className="code-editor" value={exerciseForm.prompt} onChange={(event) => setExerciseForm({ ...exerciseForm, prompt: event.target.value })} placeholder="Enunciado" />
                  <textarea className="code-editor" value={exerciseForm.starterCode} onChange={(event) => setExerciseForm({ ...exerciseForm, starterCode: event.target.value })} placeholder="Starter code" />
                  <textarea className="code-editor" value={exerciseForm.solution} onChange={(event) => setExerciseForm({ ...exerciseForm, solution: event.target.value })} placeholder="Solução de referência" />
                  <textarea className="code-editor" value={exerciseForm.testConfig} onChange={(event) => setExerciseForm({ ...exerciseForm, testConfig: event.target.value })} placeholder='Test config JSON, ex.: {"correctOption":"A"}' />
                </div>
                {exerciseForm.thumbnailUrl ? <div className="settings-preview__image lesson-thumb-preview" style={{ backgroundImage: `url(${exerciseForm.thumbnailUrl})` }} /> : null}
              </div>
            ) : null}

            <button className="primary-button" disabled={loading}>{loading ? 'Carregando...' : 'Salvar conteúdo'}</button>
          </form>
        </Section>
      ) : null}

      {tab === 'users' && user.role === 'admin' ? (
        <Section title="Gerenciar usuários" subtitle="Promova usuários para professor ou admin sem editar o banco manualmente.">
          <div className="cards-grid admin-user-grid">
            {users.map((entry) => (
              <article key={entry.id} className="content-card compact">
                <div className="teacher-card">
                  <img src={entry.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.nickname)}`} alt={entry.nickname} />
                  <div>
                    <strong>{entry.nickname}</strong>
                    <p>{entry.email}</p>
                  </div>
                </div>
                <div className="form-grid admin-user-form">
                  <select className="select-input" value={entry.role} onChange={(event) => updateRole(entry.id, event.target.value as User['role'])}>
                    <option value="user">Usuário</option>
                    <option value="teacher">Professor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="tag-row">
                    <span className="badge">{entry.rank}</span>
                    <span className="tag">{entry.lessons_completed} aulas</span>
                    <span className="tag">{entry.exercises_completed} exercícios</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      {tab === 'appearance' && user.role === 'admin' ? (
        <Section title="Aparência e doações" subtitle="Ajuste a home e defina o conteúdo exibido na página de apoio.">
          <form className="section-card" onSubmit={saveAppearance}>
            <div className="form-grid">
              <input className="search-input" value={settingsForm.homeBackgroundUrl} onChange={(event) => setSettingsForm({ ...settingsForm, homeBackgroundUrl: event.target.value })} placeholder="URL da imagem de fundo da home" />
              <input className="search-input" value={settingsForm.communityRegisteredCount} onChange={(event) => setSettingsForm({ ...settingsForm, communityRegisteredCount: event.target.value })} placeholder="Contador da comunidade" />
              <input className="search-input" value={settingsForm.communityHeadline} onChange={(event) => setSettingsForm({ ...settingsForm, communityHeadline: event.target.value })} placeholder="Título da comunidade" />
              <textarea className="code-editor" value={settingsForm.communitySubtitle} onChange={(event) => setSettingsForm({ ...settingsForm, communitySubtitle: event.target.value })} placeholder="Texto curto da comunidade" />
              <input className="search-input" value={settingsForm.donationQrUrl} onChange={(event) => setSettingsForm({ ...settingsForm, donationQrUrl: event.target.value })} placeholder="URL da imagem do QR Code Pix" />
              <textarea className="code-editor" value={settingsForm.donationGoalsText} onChange={(event) => setSettingsForm({ ...settingsForm, donationGoalsText: event.target.value })} placeholder="Texto das metas do projeto / apoio" />
            </div>
            <div className="settings-preview">
              <div className="settings-preview__image" style={{ backgroundImage: `url(${settingsForm.homeBackgroundUrl || '/site-mark.png'})` }} />
              <div>
                <strong>Prévia rápida</strong>
                <p>{settingsForm.communityHeadline || 'Defina um título para a comunidade.'}</p>
                <span>{settingsForm.communityRegisteredCount}</span>
              </div>
            </div>
            <button className="primary-button">Salvar aparência</button>
          </form>
        </Section>
      ) : null}

      {tab === 'catalog' ? (
        <Section title="Catálogo publicado" subtitle="Visão rápida do que já existe no site.">
          <div className="cards-grid">
            {lessons.slice(0, 6).map((lesson) => (
              <article key={lesson.id} className="content-card compact">
                {lesson.thumbnail_url ? <div className="lesson-card__thumb lesson-card__thumb--small" style={{ backgroundImage: `url(${lesson.thumbnail_url})` }} /> : null}
                <span className="badge">{lesson.language}</span>
                <h3>{lesson.title}</h3>
                <p>{lesson.summary}</p>
              </article>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
