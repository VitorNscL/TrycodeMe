import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import type { SiteSettings } from '../types';

const communityTestimonials = [
  {
    title: 'Aprendizado com prática real',
    text: 'O TryCodeMe pode unir aulas claras, desafios práticos e uma comunidade ativa para quem quer aprender de verdade, sem depender só de vídeo.'
  },
  {
    title: 'Ambiente para evoluir junto',
    text: 'Perfis públicos, ranks, desafios e chat ajudam a transformar estudo solitário em progresso compartilhado com outras pessoas da comunidade.'
  },
  {
    title: 'Organização sem poluição',
    text: 'Cada parte do site foi pensada para ficar limpa: conteúdo, exercícios, progresso do usuário e espaço de comunidade em um visual moderno.'
  }
];

export function HomePage() {
  const { data: settings } = useFetch<SiteSettings>(async () => (await api.get('/settings/public')).data, []);
  const backgroundImage = settings?.homeBackgroundUrl || '/site-mark.png';

  return (
    <div className="page-grid">
      <section className="hero-card hero-card--clean hero-card--immersive" style={{ ['--hero-image' as any]: `url(${backgroundImage})` }}>
        <div className="hero-copy">
          <span className="badge badge--accent">TryCodeMe</span>
          <h2>Aprenda código, desenvolvimento e cibersegurança com um visual limpo e prática de verdade.</h2>
          <p>
            Trilhas organizadas, exercícios, quizzes, perfis públicos, desafios e um painel próprio para publicar conteúdo sem bagunçar a experiência.
          </p>
          <div className="row-actions">
            <Link className="primary-button" to="/aulas">Explorar aulas</Link>
            <Link className="ghost-button" to="/perfil">Ver meu perfil</Link>
          </div>
        </div>
        <div className="hero-pillars hero-pillars--compact">
          <div><strong>Aprendizado multimídia</strong><span>Texto, código, gifs, prints e prática no mesmo fluxo.</span></div>
          <div><strong>Admin e professores</strong><span>Publicação organizada para aula, exercício ou aula com exercício final.</span></div>
          <div><strong>Comunidade</strong><span>Perfis, ranks, chat e desafios sem quebrar o visual dark do site.</span></div>
        </div>
      </section>

      <Section title="Como o site está organizado" subtitle="Uma estrutura pensada para manter o estudo claro e a navegação leve.">
        <div className="feature-grid">
          {[
            ['Aulas', 'Conteúdo multimídia em uma única página, com teoria, prática e exercício final opcional.'],
            ['Exercícios', 'Código, quiz e desafios defensivos de cibersegurança, cada um no seu tipo correto.'],
            ['Perfis', 'Estatísticas públicas, ranks, créditos dos professores e desafios 1x1.']
          ].map(([title, text]) => (
            <article key={title} className="content-card compact">
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Comunidade" subtitle={settings?.communitySubtitle || 'Conecte-se com outras pessoas que também estão evoluindo em programação, desenvolvimento e cibersegurança.'}>
        <div className="community-panel">
          <div className="community-panel__copy">
            <h3>{settings?.communityHeadline || 'Conecte-se com devs, estudantes e especialistas que estão evoluindo junto com você.'}</h3>
            <p>
              Entre no chat, acompanhe perfis públicos, veja ranks, envie dúvidas e participe de uma comunidade que pode crescer junto com o seu aprendizado.
            </p>
          </div>
          <div className="community-panel__metric">
            <strong>{settings?.communityRegisteredCount || '7.078.794'}</strong>
            <span>Usuários registrados</span>
          </div>
        </div>
        <div className="cards-grid community-cards">
          {communityTestimonials.map((item) => (
            <article key={item.title} className="content-card community-card">
              <div className="community-card__stars">★★★★★</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
