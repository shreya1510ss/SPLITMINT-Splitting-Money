import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ChevronRight,
  HandCoins,
  Loader2,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Settings,
  ArrowRight
} from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import GroupSettingsModal from '../components/GroupSettingsModal';

interface Participant {
  name: string;
  email: string;
  is_registered_user: boolean;
}

interface Group {
  id: string;
  name: string;
  participants: Participant[];
  creator_id: string;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

interface GroupBalances {
  total_spent: number;
  net_balances: Record<string, number>;
  transactions: Transaction[];
  contributions: Record<string, number>;
  shares: Record<string, number>;
}

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  // Settle Up State
  const [settlePayer, setSettlePayer] = useState('');
  const [settleRecipient, setSettleRecipient] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupData, balanceData, expenseData] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/balances/${id}`),
        api.get(`/expenses/group/${id}`)
      ]);
      setGroup(groupData);
      setBalances(balanceData);
      setExpenses(expenseData);
    } catch (err) {
      console.error('Failed to fetch group details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setShowAddExpense(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const handleSettleUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePayer || !settleRecipient || !settleAmount || settlePayer === settleRecipient) return;

    try {
      await api.post('/expenses/', {
        group_id: id,
        description: `Settle Up: ${settlePayer} → ${settleRecipient}`,
        amount: parseFloat(settleAmount),
        date: new Date().toISOString(),
        payer_name: settlePayer,
        split_mode: 'custom',
        type: 'settlement',
        splits: [{
          participant_name: settleRecipient,
          owed_share: parseFloat(settleAmount)
        }]
      });
      setShowSettleUp(false);
      setSettleAmount('');
      fetchData();
    } catch (err) {
      alert('Failed to settle up');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? All expenses will be lost.')) return;
    try {
      await api.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (err) {
      alert('Failed to delete group');
    }
  };

  const handleToggleCheck = async (expenseId: string) => {
    try {
      await api.patch(`/expenses/${expenseId}/toggle-check`, {});
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };
  if (loading) return <div className="flex-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!group || !balances) return <div className="text-center py-20 text-muted">Group not found</div>;

  const currentUserName = user?.name || '';
  const userNet = balances.net_balances[currentUserName] || 0;

  return (
    <div className="group-details-page animate-fade-in shadow-inner">
      {/* Premium Header */}
      <header className="page-header flex-between mb-8">
        <div className="flex-center gap-6">
          <button onClick={() => navigate('/groups')} className="back-btn"><ArrowLeft size={20} /></button>
          <div>
            <span className="badge-premium mb-1">Active Group</span>
            <h1 className="text-gradient leading-tight">{group.name}</h1>
          </div>
        </div>
        <div className="flex-center gap-3">
          <button className="icon-btn-secondary" title="Group Settings" onClick={() => setShowSettings(true)}>
            <Settings size={20} />
          </button>
          <button className="btn-primary flex-center gap-2" onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}>
            <Plus size={20} />
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      {/* Stats Summary Panel */}
      <div className="stats-display card-premium flex-center p-8 mb-10">
        <div className="stat-box text-center">
          <TrendingUp className="text-primary mb-2 mx-auto" size={24} />
          <span className="text-tiny uppercase text-muted font-bold tracking-widest">Total Group Spending</span>
          <h2 className="text-4xl font-bold">${balances.total_spent.toFixed(2)}</h2>
        </div>
      </div>

      <div className="details-layout grid grid-cols-12 gap-10">
        {/* Settlement section (Now takes up full width for better focus as requested) */}
        <div className="col-span-12 flex-column gap-8">
          <section className="card-premium p-8">
            <div className="flex-between mb-8">
              <div>
                <h3 className="text-small uppercase font-bold tracking-widest text-primary mb-1">Active Settlements</h3>
                <p className="text-muted text-tiny">Tally of who needs to pay whom. Check the box once paid.</p>
              </div>
              <div className="flex-center gap-4">
                <button className="btn-secondary text-tiny py-2" onClick={() => setShowSettleUp(true)}>Manual Record</button>
              </div>
            </div>
            
            <div className="settlement-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {balances.transactions.length > 0 ? (
                balances.transactions.map((t, i) => (
                  <div key={i} className="settlement-card glass-panel p-5 flex-between border-l-4 border-primary">
                    <div className="flex-column gap-1">
                      <div className="flex-center gap-2">
                        <span className="font-bold text-white">{t.from}</span>
                        <ArrowRight size={14} className="text-muted" />
                        <span className="font-bold text-white">{t.to}</span>
                      </div>
                      <span className="text-2xl font-black text-primary">${t.amount.toFixed(2)}</span>
                    </div>
                    <label className="settle-checkbox-container" title="Mark as settled">
                      <input 
                        type="checkbox" 
                        onChange={async (e) => {
                          if (e.target.checked) {
                            try {
                              await api.post('/settlements/', {
                                group_id: id,
                                from_name: t.from,
                                to_name: t.to,
                                amount: t.amount
                              });
                              fetchData();
                            } catch (err) {
                              alert('Failed to record settlement');
                              e.target.checked = false;
                            }
                          }
                        }}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 bg-primary/05 border border-dashed border-primary/20 rounded-2xl">
                  <p className="text-primary font-bold tracking-widest uppercase">🎉 Everyone is settled up! 🎉</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Tabular Expense Ledger (Takes full width now) */}
        <div className="col-span-12 flex-column">
          <section className="card-premium overflow-hidden p-0">
            <div className="p-6 border-b border-white-05">
                <h3 className="text-small uppercase font-bold tracking-widest text-muted">Expense Ledger (Tabular)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Payer</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? expenses.map(exp => {
                    const isSettlement = exp.type === 'settlement';
                    return (
                      <tr key={exp.id} className={`${isSettlement ? 'row-settlement' : ''} ${exp.is_checked ? 'row-checked' : ''}`}>
                        <td>
                          {isSettlement && (
                            <input 
                              type="checkbox" 
                              checked={exp.is_checked || false} 
                              onChange={() => handleToggleCheck(exp.id)}
                              className="checkbox-premium"
                            />
                          )}
                        </td>
                        <td className="text-muted text-tiny">{new Date(exp.date).toLocaleDateString()}</td>
                        <td>
                          <div className="flex-column">
                            <span className="font-bold text-sm">{exp.description}</span>
                            {isSettlement && <span className="badge-settled-tiny">Settlement</span>}
                          </div>
                        </td>
                        <td className="text-muted text-sm">{exp.payer_name}</td>
                        <td className="text-right font-bold text-white">
                          <span className={isSettlement ? 'text-primary' : ''}>
                            {isSettlement ? '→ ' : ''}${exp.amount.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <div className="flex-center gap-2 justify-center">
                            {!isSettlement && (
                              <button onClick={() => handleEditExpense(exp)} className="icon-action-btn hover-primary">
                                <Edit2 size={14}/>
                              </button>
                            )}
                            <button onClick={() => handleDeleteExpense(exp.id)} className="icon-action-btn hover-orange">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-muted italic">No expenses recorded for this group yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <AddExpenseModal 
        isOpen={showAddExpense}
        onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
        onSuccess={fetchData}
        user={user!}
        groupId={id}
        initialData={editingExpense}
      />

      {/* Simplified Settle Up Overlay */}
      {showSettleUp && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in max-w-sm">
            <header className="modal-header flex-between">
              <h2 className="text-gradient">Quick Settle</h2>
              <button type="button" onClick={() => setShowSettleUp(false)} className="close-btn" aria-label="Close"><X size={24}/></button>
            </header>
            <form onSubmit={handleSettleUp} className="flex-column gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="text-tiny uppercase text-muted font-bold block mb-2">Payer</label>
                  <select value={settlePayer} onChange={e => setSettlePayer(e.target.value)} className="input-premium w-full text-sm" required>
                    <option value="">Select...</option>
                    {group.participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="text-tiny uppercase text-muted font-bold block mb-2">Recipient</label>
                  <select value={settleRecipient} onChange={e => setSettleRecipient(e.target.value)} className="input-premium w-full text-sm" required>
                    <option value="">Select...</option>
                    {group.participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="text-tiny uppercase text-muted font-bold block mb-2">Amount</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-4 text-muted" />
                  <input type="number" step="0.01" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} className="input-premium w-full pl-10" placeholder="0.00" required />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-4 mt-2">Record Settlement</button>
            </form>
          </div>
        </div>
      )}

      {/* Group Settings Modal (Externalized) */}
      <GroupSettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSuccess={fetchData}
        group={group}
        currentUserId={user?.id || ''}
        currentUserName={user?.name || ''}
      />

      <style>{`
        .group-details-page { padding: 1rem; }
        .grid { display: grid; }
        .col-span-4 { grid-column: span 4; }
        .col-span-8 { grid-column: span 8; }
        .col-span-12 { grid-column: span 12; }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .gap-10 { gap: 2.5rem; }
        .p-8 { padding: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        
        .back-btn { 
          width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; transition: 0.3s;
        }
        .back-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--primary); }

        .badge-premium { 
          display: inline-block; padding: 3px 10px; background: rgba(16, 233, 163, 0.1); 
          color: var(--primary); font-size: 0.65rem; font-weight: 800; text-transform: uppercase; border-radius: 6px; letter-spacing: 0.1rem;
        }

        .stat-box h2 { letter-spacing: -0.02em; }
        
        .avatar-initial { 
          width: 32px; height: 32px; border-radius: 10px; background: rgba(255,255,255,0.05); 
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: var(--primary);
          border: 1px solid rgba(16, 233, 163, 0.2);
        }

        .transaction-chip { border-radius: 12px; transition: 0.3s; cursor: pointer; }
        .transaction-chip:hover { transform: scale(1.02); background: rgba(255,255,255,0.05); }

        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th { 
          padding: 1.25rem 1.5rem; text-align: left; font-size: 0.65rem; text-transform: uppercase; 
          color: var(--muted); font-weight: 800; tracking-widest: 0.1rem; background: rgba(255,255,255,0.02);
        }
        .modern-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .modern-table tr:last-child td { border-bottom: none; }
        .modern-table tr:hover td { background: rgba(255,255,255,0.01); }

        .icon-action-btn { 
          background: rgba(255,255,255,0.05); border: none; color: var(--muted); 
          width: 30px; height: 30px; border-radius: 8px; cursor: pointer; transition: 0.3s;
          display: flex; align-items: center; justify-content: center;
        }
        .icon-action-btn.hover-primary:hover { background: rgba(16, 233, 163, 0.2); color: var(--primary); }
        .icon-action-btn.hover-orange:hover { background: rgba(249, 115, 22, 0.2); color: #f97316; }
        
        .icon-btn-secondary {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--muted);
            width: 44px; height: 44px; border-radius: 12px; cursor: pointer; transition: 0.3s;
            display: flex; align-items: center; justify-content: center;
        }
        .icon-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: var(--primary); }

        .btn-danger-premium {
            background: rgba(249, 115, 22, 0.05); border: 1px solid rgba(249, 115, 22, 0.2);
            color: #f97316; padding: 0.75rem; border-radius: var(--radius-md); font-weight: 700;
            cursor: pointer; transition: 0.3s; display: flex; font-size: 0.8rem;
        }
        .btn-danger-premium:hover { background: #f97316; color: #000; box-shadow: 0 5px 15px rgba(249, 115, 22, 0.3); }

        .btn-secondary.danger { color: #f97316; }
        .btn-secondary.danger:hover { background: rgba(249, 115, 22, 0.1); border-color: #f97316; }
        
        .row-settlement td { background: rgba(16, 233, 163, 0.03); }
        .badge-settled-tiny { 
          font-size: 0.6rem; text-transform: uppercase; font-weight: 800; 
          color: var(--primary); background: rgba(16, 233, 163, 0.1); 
          padding: 1px 4px; border-radius: 4px; width: fit-content; margin-top: 2px;
        }

        .row-checked { opacity: 0.6; }
        .row-checked span { text-decoration: line-through; }
        
        .checkbox-premium {
          width: 18px; height: 18px; border-radius: 6px; border: 2px solid var(--primary);
          background: rgba(16, 233, 163, 0.1); cursor: pointer; transition: 0.2s;
          accent-color: var(--primary);
        }

        .tracking-widest { letter-spacing: 0.1rem; }
        .border-white-10 { border-color: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default GroupDetails;
