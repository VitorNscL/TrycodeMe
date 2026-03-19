import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ExerciseRunner } from '../components/ExerciseRunner';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../contexts/AuthContext';
import type { Exercise, Lesson } from '../types';

export function LessonDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: lesson, loading } = useFetch<Lesson>(async () => (await api.get(`/content/lessons/${slug}`)).data, [slug]);
  const { data: exercises } = useFetch<Exercise[]>(async () => (await api.get('/content/exercises')).data, []);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  useEffect(() => {
    if (user && lesson) {
      setStatus('in_progress');
      api.post('/progress', { lessonId: lesson.id, status: 'in_progress', progressPercent: 35 }).catch(() => undefined);
    }
  }, [user?.id, lesson?.id]);

  const exercise = exercises?.find((item) => item.id === lesson?.exercise_id);

  async function markCompleted() {
    if (!lesson || !user) return;
    await api.post('/progress', { lessonId: lesson.id, status: 'completed', progressPercent: 100 });
    setStatus('completed');
  }

  if (loading || !lesson) return <p>Carregando aula...</p>;

  return (
    <div className="page-grid">
      <Section title={lesson.title} subtitle={lesson.summary}>
        <div className="content-card compact">
          <div className="content-card__topline">
            <span className="badge">{lesson.language}</span>
            <span className="badge badge--outline">{lesson.difficulty}</span>
            <span className="badge badge--accent">{lesson.type}</span>
            <span className="badge badge--success">{status === 'completed' ? '✓ Concluída' : status === 'in_progress' ? 'Em processo' : 'Não iniciada'}</span>
          </div>
          <p><strong>O que será aprendido:</strong> {lesson.learn_outcomes}</p>
          {lesson.author ? (
            <Link className="teacher-card" to={`/perfil/${lesson.author.id}`}>
              <img src={lesson.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(lesson.author.name)}`} alt={lesson.author.name} />
              <div>
                <strong>{lesson.author.name}</strong>
                <span>{lesson.author.specialty || 'Professor do TryCodeMe'}</span>
              </div>
            </Link>
          ) : null}
        </div>

        <div className="lesson-stack">
          {(lesson.sections || []).map((section, index) => (
            <article key={`${section.kind}-${index}`} className="content-card">
              <div className="content-card__topline"><span className="badge">{section.kind}</span></div>
              <h3>{section.title}</h3>
              {section.kind === 'code' || section.kind === 'command' ? (
                <pre className="console-box">{section.content}</pre>
              ) : section.kind === 'image' || section.kind === 'gif' ? (
                <img className="media-preview" src={section.content} alt={section.title} />
              ) : section.kind === 'video' ? (
                <div className="video-frame"><iframe src={section.content} title={section.title} allowFullScreen /></div>
              ) : (
                <p>{section.content}</p>
              )}
            </article>
          ))}
        </div>
      </Section>

      {exercise ? (
        <Section title="Pratique no final da aula" subtitle="O exercício aparece na mesma página, como você pediu.">
          <ExerciseRunner exercise={exercise} />
          {user ? <button className="primary-button" onClick={markCompleted}>Marcar aula como concluída</button> : <p>Faça login para salvar progresso.</p>}
        </Section>
      ) : null}
    </div>
  );
}
