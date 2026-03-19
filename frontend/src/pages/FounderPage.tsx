import { Section } from '../components/Section';

export function FounderPage() {
  return (
    <Section title="Fundador do Site" subtitle="A plataforma foi pensada para ser seu projeto principal de portfólio.">
      <div className="content-card founder-card">
        <img className="profile-avatar" src="/perfil_fundador.jpg" alt="Vitor Dev" />
        <div>
          <h3>Vitor Dev</h3>
          <p>
            Criador do TryCodeMe, com foco em programação, desenvolvimento web e cibersegurança.
            O objetivo do projeto é unir ensino prático, identidade visual forte e comunidade em uma plataforma moderna.
          </p>
          <div className="tag-row">
            <span className="tag">JavaScript</span>
            <span className="tag">React</span>
            <span className="tag">Node.js</span>
            <span className="tag">Cybersecurity</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
