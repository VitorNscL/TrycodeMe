import { Router } from 'express';
import { z } from 'zod';
import { runJavaScript } from '../utils/codeRunner.js';
import { db } from '../db/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const codeRouter = Router();

function getDiffHint(source: string, solution: string) {
  const sourceLines = source.split('\n');
  const solutionLines = solution.split('\n');
  const max = Math.max(sourceLines.length, solutionLines.length);
  for (let i = 0; i < max; i += 1) {
    const userLine = (sourceLines[i] || '').trim();
    const expectedLine = (solutionLines[i] || '').trim();
    if (userLine !== expectedLine) {
      return `A principal diferença começa perto da linha ${i + 1}. Revise essa parte e compare com a lógica esperada.`;
    }
  }
  return 'Revise a estrutura da função e confira retorno, nomes e tratamento dos casos esperados.';
}

codeRouter.post('/run', (req, res) => {
  const schema = z.object({ language: z.string(), source: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  if (parsed.data.language.toLowerCase() !== 'javascript') {
    return res.status(400).json({ message: 'Runner local demo disponível apenas para JavaScript. Integre Judge0/Piston para múltiplas linguagens.' });
  }

  try {
    const result = runJavaScript(parsed.data.source);
    res.json({ output: result.output });
  } catch (error: any) {
    res.status(400).json({ message: error?.message ?? 'Erro ao executar o código.' });
  }
});

codeRouter.post('/evaluate/:exerciseId', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({ source: z.string().min(1), language: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.exerciseId) as any;
  if (!exercise) return res.status(404).json({ message: 'Exercício não encontrado.' });

  if (exercise.type === 'quiz') {
    const config = JSON.parse(exercise.test_config);
    const isCorrect = String(parsed.data.source).trim().toUpperCase() === String(config.correctOption).trim().toUpperCase();
    return res.json({ score: isCorrect ? 10 : 4, feedback: isCorrect ? 'Resposta correta.' : 'Resposta incorreta. Reveja a teoria.', hint: isCorrect ? '' : 'Leia novamente as alternativas e elimine as opções que contradizem o conceito principal.', passed: isCorrect });
  }

  if (parsed.data.language.toLowerCase() !== 'javascript') {
    return res.status(400).json({ message: 'Avaliação automática local disponível apenas para JavaScript.' });
  }

  try {
    const solution = exercise.solution || '';
    const sourcePasses = parsed.data.source.replace(/\s+/g, '') === solution.replace(/\s+/g, '');
    const result = runJavaScript(parsed.data.source);
    const score = sourcePasses ? 10 : 7;
    const feedback = sourcePasses
      ? 'Código correto. Boa organização e execução consistente.'
      : 'Seu código executou, mas ainda não bate exatamente com a solução de referência.';
    const hint = sourcePasses ? '' : getDiffHint(parsed.data.source, solution);
    if (sourcePasses) {
      db.prepare('UPDATE users SET exercises_completed = exercises_completed + 1 WHERE id = ?').run(req.user.id);
    }
    res.json({ score, feedback, hint, passed: sourcePasses, output: result.output });
  } catch (error: any) {
    res.status(400).json({ score: 0, passed: false, feedback: error?.message ?? 'Erro ao avaliar.', hint: 'Veja a mensagem de erro e revise a sintaxe perto da linha indicada.' });
  }
});
