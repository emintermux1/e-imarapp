import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/map-workspace', label: 'Map Workspace' },
  { to: '/plan-explain', label: 'Plan Explain' },
  { to: '/workspace', label: 'Workspace' }
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">e-IMAR</div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
