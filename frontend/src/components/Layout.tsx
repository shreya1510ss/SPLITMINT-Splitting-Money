import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="layout-root animate-fade-in">
      {/* Background Decor */}
      <div className="bg-glow-top" />
      <div className="bg-glow-bottom" />

      {/* Main Layout Container */}
      <div className="layout-container">
        <Sidebar aria-label="Main Navigation" />
        
        {/* Render child routes here */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        .layout-root {
          min-height: 100vh;
          position: relative;
          padding: 2rem;
          display: flex;
          justify-content: center;
        }

        .layout-container {
          width: 100%;
          max-width: 1280px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .bg-glow-top {
          position: absolute;
          top: 0;
          right: 0;
          width: 500px;
          height: 500px;
          background: var(--primary);
          opacity: 0.05;
          filter: blur(120px);
          z-index: -10;
          border-radius: 50%;
        }

        .bg-glow-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 400px;
          height: 400px;
          background: var(--accent);
          opacity: 0.05;
          filter: blur(130px);
          z-index: -10;
          border-radius: 50%;
        }

        @media (max-width: 1024px) {
          .layout-root {
            padding: 1rem;
          }
          .layout-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;

