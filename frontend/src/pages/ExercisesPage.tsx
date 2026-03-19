import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { ExerciseRunner } from '../components/ExerciseRunner';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import type { Exercise } from '../types';

export function ExercisesPage() {
  const { data: exercises } = useFetch<Exercise[]>(async () => (await api.get('/content/exercises')).data, []);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (exercises || []).filter((exercise) =>
    [exercise.title, exercise.summary, exercise.language, exercise.type].join(' ').toLowerCase().includes(query.toLowerCase())
  ), [exercises, query]);
  const active = filtered.find((exercise) => exercise.id === activeId) || filtered[0];

  return (
    <Section title="Exercícios e quizzes" subtitle="Treinos práticos, teóricos e de cibersegurança.">
      <div className="toolbar">
        <input className="search-input" placeholder="Buscar exercício..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="split-layout">
        <div className="list-panel">
          {filtered.map((exercise) => (
            <button key={exercise.id} className={`list-item ${active?.id === exercise.id ? 'active' : ''}`} onClick={() => setActiveId(exercise.id)}>
              <strong>{exercise.title}</strong>
              <span>{exercise.language} • {exercise.difficulty}</span>
            </button>
          ))}
        </div>
        <div>
          {active ? <ExerciseRunner exercise={active} /> : <p>Nenhum exercício encontrado.</p>}
        </div>
      </div>
    </Section>
  );
}
