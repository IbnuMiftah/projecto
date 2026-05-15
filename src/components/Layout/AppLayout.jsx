import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import './AppLayout.css';

export default function AppLayout({ pageTitle }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'app-layout--collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="app-layout__overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => {
          setSidebarCollapsed((prev) => !prev);
          setMobileOpen((prev) => !prev);
        }}
      />

      <div className="app-layout__main">
        <Topbar
          pageTitle={pageTitle}
          onMenuClick={() => setMobileOpen((prev) => !prev)}
        />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

