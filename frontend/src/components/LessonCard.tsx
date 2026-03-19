import { Link } from 'react-router-dom';
import type { Lesson } from '../types';

export function LessonCard({ lesson, progressStatus }: { lesson: Lesson; progressStatus?: string }) {
  return (
    <article className="content-card lesson-card">
      {lesson.thumbnail_url ? <div className="lesson-card__thumb" style={{ backgroundImage: `url(${lesson.thumbnail_url})` }} /> : null}
      <div className="content-card__topline">
        <span className="badge">{lesson.language}</span>
        <span className="badge badge--outline">{lesson.difficulty}</span>
        {lesson.featured ? <span className="badge badge--accent">Destaque</span> : null}
        {progressStatus ? <span className="badge badge--success">{progressStatus}</span> : null}
      </div>
      <h3>{lesson.title}</h3>
      <p>{lesson.summary}</p>
      <div className="tag-row">
        {(lesson.tags || []).slice(0, 3).map((tag) => <span key={tag} className="tag">#{tag}</span>)}
      </div>
      <Link to={`/aulas/${lesson.slug}`} className="primary-button">Abrir aula</Link>
    </article>
  );
}
