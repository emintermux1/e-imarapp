import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/map-workspace', label: 'Map Workspace' },
  { to: '/plan-explain', label: 'Plan Açıklama' },
  { to: '/workspace', label: 'Workspace' }
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <div className="announcement-bar">
        <span className="dot" />
        RESMİ VERİ ENTEGRASYONU: TKGM / E-Plan / Belediye CBS durumuna göre canlı readiness gösterilir.
      </div>
      <header className="top-nav">
        <div className="brand-block">
          <div className="brand">e-IMAR</div>
          <small>İmar ve Parsel Platformu</small>
        </div>
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="ghost">Giriş</button>
          <button className="primary small">Kayıt Ol</button>
        </div>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
