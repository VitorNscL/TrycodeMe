import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { Section } from '../components/Section';

const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', { autoConnect: false });

export function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [online, setOnline] = useState<any[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit('chat:join', { userId: user.id });
    socket.on('chat:history', (payload) => setMessages(payload));
    socket.on('chat:message', (payload) => setMessages((current) => [...current, payload]));
    socket.on('chat:presence', (payload) => setOnline(payload));

    socket.on('chat:cleared', () => setMessages([]));

    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('chat:presence');
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const onlineCount = useMemo(() => new Map(online.map((item) => [item.userId, item])).size, [online]);

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('chat:message', { text });
    setText('');
  }

  return (
    <Section title="Chat público" subtitle="Mantenha o respeito e a organização no chat. Evite spam, mensagens fora de contexto e comportamentos inadequados. 
    O objetivo é criar um ambiente saudável para aprendizado e troca de conhecimento.">
      {!user ? <p>Faça login para entrar no chat.</p> : (
        <div className="chat-layout">
          <aside className="online-panel">
            <strong>Online agora: {onlineCount}</strong>
            {online.map((person) => (
              <Link key={`${person.userId}-${person.nickname}`} className="online-user" to={`/perfil/${person.userId}`}>
                <img src={person.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.nickname)}`} alt={person.nickname} />
                <div>
                  <strong>{person.nickname}</strong>
                  <span>{person.role === 'admin' ? 'ADMIN • ' : ''}{person.rank}</span>
                </div>
              </Link>
            ))}
          </aside>
          <div className="chat-panel">
            <div className="chat-feed">
              {messages.map((message) => {
                const own = message.userId === user.id;
                return (
                  <article key={message.id} className={`chat-message ${own ? 'own' : 'other'}`}>
                    {!own ? <img className="avatar" src={message.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.nickname)}`} alt={message.nickname} /> : null}
                    <div className="chat-bubble">
                      <div className="chat-meta">
                        {!own ? <Link to={`/perfil/${message.userId}`}>{message.nickname}</Link> : <strong>Você</strong>}
                        {message.role === 'admin' ? <span className="badge badge--accent">ADMIN</span> : null}
                        <span className="badge badge--outline">{message.rank}</span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  </article>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {user?.role === 'admin' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja limpar o chat?')) {
                      socket.emit('chat:clear');
                    }
                  }}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)', // roxo suave
                    color: '#a78bfa', // roxo claro
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  clear chat
                </button>
              </div>
            )}
            <div className="chat-input-row">
              <input className="search-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva sua mensagem..." onKeyDown={(event) => event.key === 'Enter' && sendMessage()} />
              <button className="primary-button" onClick={sendMessage}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
