import React, { useState, useEffect } from 'react';
import { Users, ArrowUpRight, ArrowDownRight, Wallet, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const groupData = await api.get(`/groups/?user_id=${currentUser.id}&user_email=${currentUser.email}`);
      setGroups(groupData);

      let totalNet = 0;
      let totalOwe = 0;
      let totalOwed = 0;

      for (const group of groupData) {
        const balanceData = await api.get(`/balances/${group.id}`);
        const userBalance = balanceData.net_balances[currentUser.name] || 0;
        
        totalNet += userBalance;
        if (userBalance > 0) totalOwed += userBalance;
        if (userBalance < 0) totalOwe += Math.abs(userBalance);
      }

      setTotalBalance(totalNet);
      setYouAreOwed(totalOwed);
      setYouOwe(totalOwe);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = [
    { label: 'Total Balance', value: `$${totalBalance.toFixed(2)}`, icon: Wallet, color: totalBalance >= 0 ? 'var(--primary)' : '#f97316' },
    { label: 'You Owe', value: `$${youOwe.toFixed(2)}`, icon: ArrowDownRight, color: '#f97316' },
    { label: 'You are Owed', value: `$${youAreOwed.toFixed(2)}`, icon: ArrowUpRight, color: 'var(--primary)' },
  ];

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <header className="dashboard-header">
        <h1 className="text-gradient">Hello, {currentUser?.name || 'User'}</h1>
        <p className="text-muted">Summary of your shared expenses across all groups.</p>
      </header>

      <section className="summary-grid">
        {summary.map((item, i) => (
          <div key={i} className="card-premium summary-card">
            <div className="flex-between mb-4">
              <span className="text-muted text-small font-bold tracking-widest uppercase">{item.label}</span>
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <h2 style={{ color: item.color }} className="text-3xl font-bold">
              {totalBalance < 0 && i === 0 ? '-' : ''}{item.value}
            </h2>
          </div>
        ))}
      </section>

      <section className="groups-overview">
        <div className="flex-between mb-6">
          <h3 className="text-muted uppercase tracking-widest text-small font-bold">Your Active Groups</h3>
          <Link to="/groups" className="text-btn flex-center gap-1">
            <span>See All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : groups.length > 0 ? (
          <div className="section-grid">
            {groups.slice(0, 3).map(group => (
              <Link key={group.id} to={`/groups/${group.id}`} className="card-premium group-preview-card no-underline">
                <div className="flex-between w-full">
                  <div className="flex-center gap-4">
                    <div className="icon-box-small"><Users size={18} /></div>
                    <div>
                      <h4 className="font-bold text-white">{group.name}</h4>
                      <p className="text-muted text-small">{group.participants.length} members</p>
                    </div>
                  </div>
                  <ArrowRight className="text-muted" size={20} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card-premium empty-state text-center italic">
            <p className="text-muted">No groups yet. Start by creating one!</p>
            <Link to="/groups" className="btn-primary mt-4 inline-block no-underline">Create Group</Link>
          </div>
        )}
      </section>

      <style>{`
        .dashboard-wrapper { display: flex; flex-direction: column; gap: 3rem; }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .summary-card { padding: 2rem; }
        .group-preview-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          transition: var(--transition);
        }
        .group-preview-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }
        .icon-box-small {
          width: 44px;
          height: 44px;
          background: rgba(16, 233, 163, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }
        .no-underline { text-decoration: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
