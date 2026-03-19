import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type Props = { open: boolean; onClose: () => void };

export function Sidebar({ open, onClose }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar__header">
          <Link to="/" className="brand" onClick={onClose}>TryCodeMe</Link>
          <button className="ghost-button" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark' ? '💡' : '🌙'}
          </button>
        </div>

        <nav className="sidebar__nav">
          {[
            ['/', 'Home'],
            ['/aulas', 'Aulas'],
            ['/exercicios', 'Exercícios'],
            ['/chat', 'Chat'],
            ['/competicoes', 'Competições'],
            ['/duvida', 'Mandar sua dúvida'],
            ['/perfil', 'Perfil'],
            ['/fundador', 'Fundador do Site'],
            ['/doacoes', 'Doações']
          ].map(([to, label]) => (
            <NavLink key={to} to={to} className="nav-link" onClick={onClose}>{label}</NavLink>
          ))}
          {user?.role === 'admin' || user?.role === 'teacher' ? (
            <NavLink to="/admin" className="nav-link" onClick={onClose}>Painel</NavLink>
          ) : null}
        </nav>

        <div className="sidebar__footer">
          {user ? (
            <>
              <div className="user-chip">
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}`} alt={user.nickname} />
                <div>
                  <strong>{user.nickname}</strong>
                  <span>{user.rank}</span>
                </div>
              </div>
              <button className="primary-button" onClick={() => { logout(); onClose(); }}>Sair da conta</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={onClose}>Login</Link>
              <Link to="/register" className="primary-button" onClick={onClose}>Registrar</Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
