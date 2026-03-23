import bcrypt from 'bcryptjs';
import { db } from './database.js';

const settingRows = [
  ['home_background_url', '/site-mark.png'],
  ['community_registered_count', '7.078.794'],
  ['community_headline', 'Conecte-se com devs, estudantes e especialistas que estão evoluindo junto com você.'],
  ['community_subtitle', 'Comunidade viva com perfis públicos, ranks, desafios e espaço para trocar conhecimento sem poluir a experiência visual.'],
  ['donation_qr_url', ''],
  ['donation_goals_text', 'Cada doação ajuda a manter o TryCodeMe no ar, publicar novas trilhas e abrir mais desafios gratuitos para quem está tentando mudar de vida através da tecnologia. Seu apoio fortalece uma comunidade real, acessível e feita para evoluir junto.']
] as const;

for (const [key, value] of settingRows) {
  db.prepare(`INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)`)
    .run(key, value);
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const teacherPassword = bcrypt.hashSync('teacher123', 10);
  db.prepare(`INSERT INTO users (email, password_hash, display_name, nickname, role, bio, specialty, certifications, avatar_url, lessons_completed, exercises_completed, active_hours)
    VALUES
    ('admin@trycodeme.dev', ?, 'Vitor Dev', 'VitorDev', 'admin', 'Fundador do TryCodeMe.', 'Full Stack, Cibersegurança', '["Arquitetura de Sistemas", "JavaScript Avançado"]', '/perfil_fundador.jpg', 18, 27, 120),
    ('teacher@trycodeme.dev', ?, 'Carlos Spring', 'CarlosSpring', 'teacher', 'Professor convidado focado em backend.', 'Java, Spring Boot, APIs REST', '["Spring Professional", "Java Specialist"]', 'https://i.pravatar.cc/150?img=15', 12, 19, 85),
    ('user@trycodeme.dev', ?, 'Ana Code', 'AnaCode', 'user', 'Usuária demo para testar o chat.', 'JavaScript, CSS', '["Frontend Basics"]', 'https://i.pravatar.cc/150?img=32', 4, 8, 26)`)
    .run(adminPassword, teacherPassword, bcrypt.hashSync('user123', 10));

  const exerciseResult = db.prepare(`INSERT INTO exercises (title, summary, language, difficulty, type, prompt, starter_code, solution, test_config, featured, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      'Função soma segura',
      'Crie uma função que some dois números e exiba o resultado no console.',
      'JavaScript',
      'Iniciante',
      'code',
      'Implemente uma função soma(a, b) e faça console.log(soma(2, 3)).',
      'function soma(a, b) {\n  // sua resposta\n}\nconsole.log(soma(2, 3));',
      'function soma(a, b) {\n  return a + b;\n}\nconsole.log(soma(2, 3));',
      JSON.stringify({}),
      1,
      1
    );

  db.prepare(`INSERT INTO lessons (title, slug, summary, learn_outcomes, language, category, difficulty, type, tags, keywords, featured, status, author_id, author_label, sections, exercise_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      'Introdução ao JavaScript',
      'introducao-javascript',
      'Aprenda variáveis, condicionais e prática guiada com uma linguagem simples e clara.',
      'Entender fluxo básico, sintaxe e primeiros comandos para construir lógica.',
      'JavaScript',
      'Programação',
      'Iniciante',
      'practical',
      JSON.stringify(['javascript', 'iniciante', 'lógica']),
      JSON.stringify(['javascript', 'condição', 'variáveis', 'primeiros passos']),
      1,
      'published',
      1,
      'Fundador',
      JSON.stringify([
        { kind: 'text', title: 'Conceito', content: 'JavaScript é uma linguagem versátil para web, automação e lógica de programação.' },
        { kind: 'code', title: 'Exemplo', content: 'const nome = "TryCodeMe";\nconsole.log(`Olá, ${nome}`);' },
        { kind: 'tip', title: 'Dica', content: 'Comece dominando variáveis, comparação e funções simples.' },
        { kind: 'image', title: 'Print de fluxo', content: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80' }
      ]),
      exerciseResult.lastInsertRowid
    );

  db.prepare(`INSERT INTO lessons (title, slug, summary, learn_outcomes, language, category, difficulty, type, tags, keywords, featured, status, author_id, author_label, sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      'Fundamentos de DNS',
      'fundamentos-de-dns',
      'Aula teórica sobre resolução de nomes e segurança básica em DNS.',
      'Entender o papel do DNS, cache e boas práticas defensivas.',
      'Teoria',
      'Cibersegurança',
      'Iniciante',
      'theory',
      JSON.stringify(['dns', 'redes', 'segurança']),
      JSON.stringify(['dns', 'resolução de nomes', 'teoria redes']),
      1,
      'published',
      2,
      'Professor convidado',
      JSON.stringify([
        { kind: 'text', title: 'Visão geral', content: 'DNS traduz nomes amigáveis em endereços IP para facilitar a navegação.' },
        { kind: 'alert', title: 'Segurança', content: 'Ataques de spoofing e cache poisoning existem, então valide a cadeia de confiança.' },
        { kind: 'video', title: 'Vídeo recomendado', content: 'https://www.youtube.com/embed/72snZctFFtA' }
      ])
    );
}

console.log('Seed concluído.');
