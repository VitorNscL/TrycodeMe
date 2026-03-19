import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { LessonCard } from '../components/LessonCard';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import type { Lesson } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function LessonsPage() {
  const { user } = useAuth();
  const { data: lessons, loading } = useFetch<Lesson[]>(async () => (await api.get('/content/lessons')).data, []);
  const { data: progress } = useFetch<any[]>(async () => user ? (await api.get('/progress')).data : [], [user?.id]);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return (lessons || []).filter((lesson) => {
      const searchable = [lesson.title, lesson.summary, lesson.language, lesson.category, ...(lesson.tags || []), ...(lesson.keywords || [])].join(' ').toLowerCase();
      const matchesText = !normalized || searchable.includes(normalized);
      const matchesLanguage = !language || lesson.language === language;
      return matchesText && matchesLanguage;
    });
  }, [lessons, query, language]);

  const progressMap = new Map((progress || []).map((item) => [item.lesson_id, item.status === 'completed' ? '✓ Concluída' : item.status === 'in_progress' ? 'Em processo' : 'Não iniciada']));
  const languages = Array.from(new Set((lessons || []).map((lesson) => lesson.language)));

  return (
    <Section title="Biblioteca de aulas" subtitle="Busque por aula, código, linguagem ou conceito aproximado.">
      <div className="toolbar">
        <input className="search-input" placeholder="Pesquise aulas, códigos, conceitos ou comandos..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="select-input" value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="">Todas as linguagens</option>
          {languages.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {loading ? <p>Carregando aulas...</p> : (
        <div className="cards-grid">
          {filtered.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} progressStatus={progressMap.get(lesson.id)} />)}
        </div>
      )}
    </Section>
  );
}
