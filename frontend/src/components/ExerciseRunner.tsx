import { useState } from 'react';
import { api } from '../api/client';
import type { Exercise } from '../types';

export function ExerciseRunner({ exercise }: { exercise: Exercise }) {
  const [source, setSource] = useState(exercise.starter_code || '');
  const [output, setOutput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hint, setHint] = useState('');
  const [score, setScore] = useState<number | null>(null);

  async function run() {
    const payload = exercise.type === 'quiz' ? { language: 'quiz', source } : { language: exercise.language, source };
    try {
      const { data } = await api.post('/code/run', payload);
      setOutput(data.output || 'Executado sem saída.');
    } catch (error: any) {
      setOutput(error?.response?.data?.message || 'Falha ao executar.');
    }
  }

  async function evaluate() {
    const payload = exercise.type === 'quiz' ? { language: 'quiz', source } : { language: exercise.language, source };
    try {
      const { data } = await api.post(`/code/evaluate/${exercise.id}`, payload);
      setFeedback(data.feedback);
      setHint(data.hint || '');
      setScore(data.score);
      if (data.output) setOutput(data.output);
    } catch (error: any) {
      setFeedback(error?.response?.data?.message || 'Falha ao avaliar.');
      setHint(error?.response?.data?.hint || '');
    }
  }

  return (
    <div className="runner-card">
      <h3>Desafio final</h3>
      <p>{exercise.prompt}</p>
      {exercise.type === 'quiz' ? (
        <textarea className="code-editor" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Digite a opção correta. Ex.: A" />
      ) : (
        <textarea className="code-editor" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} />
      )}
      <div className="row-actions">
        {exercise.type !== 'quiz' ? <button className="ghost-button" onClick={run}>Executar</button> : null}
        <button className="primary-button" onClick={evaluate}>Enviar resposta</button>
      </div>
      {output ? <pre className="console-box">{output}</pre> : null}
      {feedback ? <div className="feedback-box"><strong>Feedback:</strong> {feedback} {score !== null ? <span>• Nota: {score}/10</span> : null}</div> : null}
      {hint ? <div className="feedback-box feedback-box--hint"><strong>Dica:</strong> {hint}</div> : null}
    </div>
  );
}
