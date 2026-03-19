import { useState } from 'react';
import { Section } from '../components/Section';
import { useFetch } from '../hooks/useFetch';
import { api } from '../api/client';

export function DonationsPage() {
  const { data: settings } = useFetch<any>(async () => (await api.get('/settings/public')).data, []);
  const [openQr, setOpenQr] = useState(false);
  const [openGoals, setOpenGoals] = useState(false);

  return (
    <Section title="Apoie o TryCodeMe" subtitle="Cada apoio ajuda a manter a plataforma viva, gratuita e evoluindo com novos desafios.">
      <div className="content-card">
        <p>
          Seu apoio ajuda a manter hospedagem, mídia, desafios e novas aulas gratuitas no ar. Você escolhe quanto quer contribuir e participa da construção de algo que pode mudar o caminho de muita gente.
        </p>
        <div className="row-actions">
          <button className="primary-button" onClick={() => setOpenQr(true)}>Abrir QR Code Pix</button>
          <button className="ghost-button" onClick={() => setOpenGoals(true)}>Ver metas do projeto</button>
        </div>
      </div>

      {openQr ? (
        <div className="modal-overlay" onClick={() => setOpenQr(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>QR Code Pix</h3>
            <p>Coloque a URL da imagem do seu QR Code no admin, em Aparência / Doações.</p>
            {settings?.donationQrUrl ? <img className="donation-qr" src={settings.donationQrUrl} alt="QR Code Pix" /> : <div className="donation-qr donation-qr--placeholder">QR Code ainda não configurado</div>}
            <button className="primary-button" onClick={() => setOpenQr(false)}>Fechar</button>
          </div>
        </div>
      ) : null}

      {openGoals ? (
        <div className="modal-overlay" onClick={() => setOpenGoals(false)}>
          <div className="modal-card modal-card--wide" onClick={(event) => event.stopPropagation()}>
            <h3>Metas do projeto</h3>
            <p>{settings?.donationGoalsText || 'Cada doação ajuda a manter o TryCodeMe no ar, publicar novas trilhas e abrir mais desafios gratuitos para quem está tentando mudar de vida através da tecnologia. Seu apoio fortalece uma comunidade real, acessível e feita para evoluir junto.'}</p>
            <button className="primary-button" onClick={() => setOpenGoals(false)}>Fechar</button>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
