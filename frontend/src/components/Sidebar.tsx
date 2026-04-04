import React, { useState } from 'react';
import { LayoutGrid, Users, BarChart3, CreditCard, Menu, X, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/' },
    { name: 'My Groups', icon: Users, path: '/groups' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Content */}
      <aside className={`sidebar-panel glass-panel ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">
            <LayoutGrid color="#000" size={24} />
          </div>
          <h1>SplitMint</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        <style>{`
          .sidebar-panel {
            padding: 2rem;
            height: fit-content;
            position: sticky;
            top: 2rem;
            display: flex;
            flex-direction: column;
            gap: 3rem;
            z-index: 100;
          }

          .sidebar-header {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .logo-icon {
            width: 48px;
            height: 48px;
            background: var(--primary);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px -5px var(--primary-glow);
          }

          .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border-radius: var(--radius-md);
            color: var(--muted);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
          }

          .nav-item:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
          }

          .nav-item.active {
            background: var(--primary);
            color: #000;
            font-weight: 700;
            box-shadow: 0 10px 20px -10px var(--primary-glow);
          }

          .mobile-toggle {
            display: none;
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--primary);
            color: #000;
            border: none;
            box-shadow: var(--shadow-premium);
            z-index: 200;
            cursor: pointer;
            align-items: center;
            justify-content: center;
          }

          @media (max-width: 1024px) {
            .mobile-toggle {
              display: flex;
            }

            .sidebar-panel {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100vh;
              border-radius: 0;
              transform: translateX(-100%);
              transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .sidebar-panel.is-open {
              transform: translateX(0);
            }
          }

          .sidebar-footer {
            margin-top: auto;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }

          .logout-btn {
            width: 100%;
            background: none;
            border: none;
            cursor: pointer;
            text-align: left;
          }

          .logout-btn:hover {
            color: #ff4b4b;
            background: rgba(255, 75, 75, 0.1);
          }
        `}</style>
      </aside>
    </>
  );
};

export default Sidebar;

