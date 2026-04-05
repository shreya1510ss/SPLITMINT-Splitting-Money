import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  Loader2,
  Trash2,
  Edit2,
  Settings,
  ArrowRight,
  HandCoins,
  CheckCircle2,
  Sparkles,
  FileText
} from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

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

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
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
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [recordingSettlementKey, setRecordingSettlementKey] = useState<string | null>(null);

  // MintSense Summary State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);

  useBodyScrollLock(showAddExpense || showSettings);

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

  const generateAiSummary = async () => {
    if (!id) return;
    setIsAiSummaryLoading(true);
    try {
      const result = await api.get(`/ai/group-summary/${id}`);
      setAiSummary(result);
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsAiSummaryLoading(false);
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
  const settlementTx = balances.transactions;
  const hasActiveSettlements = settlementTx.length > 0;
  const settlementsTotalOwed = settlementTx.reduce((sum, t) => sum + t.amount, 0);

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
        <div className="flex-center gap-5">
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
      <div className="stats-display flex flex-col gap-6 mb-10">
        <div className="card-premium flex-center p-8">
          <div className="stat-box text-center">
            <TrendingUp className="text-primary mb-2 mx-auto" size={24} />
            <span className="text-tiny uppercase text-muted font-bold tracking-widest">Total Group Spending</span>
            <h2 className="text-4xl font-bold">{balances.total_spent.toFixed(2)}</h2>
          </div>
        </div>

        {/* MintSense Group Summary */}
        <div className="card-premium p-6 border-primary/20 bg-primary/5">
          <div className="flex-between mb-4">
            <div className="flex-center gap-2 text-primary">
              <Sparkles size={20} />
              <h3 className="font-bold uppercase tracking-wider">MintSense Insights</h3>
            </div>
            <button 
              className="btn-secondary py-1 px-4 text-small flex-center gap-2"
              onClick={generateAiSummary}
              disabled={isAiSummaryLoading}
            >
              {isAiSummaryLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              <span>{aiSummary ? 'Refresh Summary' : 'Generate Summary'}</span>
            </button>
          </div>

          {aiSummary ? (
            <div className="animate-fade-in">
              <p className="text-muted leading-relaxed mb-4">{aiSummary.summary}</p>
              {aiSummary.top_spender && (
                <div className="flex-center justify-start gap-2">
                  <span className="badge-premium bg-primary/10 text-primary border-primary/20">
                    🏆 Top Spender: {aiSummary.top_spender}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted italic text-small">
              Click "Generate Summary" to get AI-powered insights about your group's spending habits.
            </div>
          )}
        </div>
      </div>

      <div className="details-layout grid grid-cols-12 gap-10">
        {/* Settlement section (Now takes up full width for better focus as requested) */}
        <div className="col-span-12 flex-column gap-8">
          <section
            className={`settlements-section card-premium overflow-hidden ${
              hasActiveSettlements ? 'settlements-section--active' : 'settlements-section--clear'
            }`}
          >
            {hasActiveSettlements ? (
              <>
                <div className="settlements-active-banner">
                  <div className="settlements-active-banner-inner flex-between gap-4 flex-wrap">
                    <div className="flex-center gap-3">
                      <div className="settlements-banner-icon">
                        <HandCoins size={22} strokeWidth={2.25} />
                      </div>
                      <div>
                        <h3 className="settlements-banner-title">Balances to settle</h3>
                        <p className="settlements-banner-sub text-muted text-tiny">
                          These are simplified payments that clear what people owe. Mark each one when the money has been sent or handed over.
                        </p>
                      </div>
                    </div>
                    <div className="settlements-summary-stack flex-column gap-1 text-right">
                      <span className="settlements-summary-label text-tiny uppercase text-muted font-bold tracking-widest">
                        Total to move
                      </span>
                      <span className="settlements-summary-amount">{settlementsTotalOwed.toFixed(2)}</span>
                      <span className="text-muted text-tiny">
                        {settlementTx.length} payment{settlementTx.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-6">
                  <div className="settlement-grid">
                    {settlementTx.map((t, i) => {
                      const stKey = `st-${i}-${t.from}-${t.to}-${t.amount}`;
                      const isRecording = recordingSettlementKey === stKey;
                      const youPay = t.from === currentUserName;
                      const youReceive = t.to === currentUserName;
                      return (
                        <div key={stKey} className="settlement-card-enhanced">
                          <div className="settlement-card-top">
                            {youPay && (
                              <span className="settlement-you-badge">You pay</span>
                            )}
                            {youReceive && !youPay && (
                              <span className="settlement-you-badge settlement-you-badge--in">You receive</span>
                            )}
                            {!youPay && !youReceive && (
                              <span className="settlement-you-badge settlement-you-badge--muted">Between members</span>
                            )}
                          </div>
                          <div className="settlement-parties">
                            <div className="settlement-party">
                              <span className="settlement-avatar settlement-avatar--from">
                                {nameInitials(t.from)}
                              </span>
                              <div className="settlement-party-text">
                                <span className="settlement-party-label">From</span>
                                <span className="settlement-party-name">{t.from}</span>
                              </div>
                            </div>
                            <div className="settlement-party">
                              <span className="settlement-avatar settlement-avatar--to">
                                {nameInitials(t.to)}
                              </span>
                              <div className="settlement-party-text">
                                <span className="settlement-party-label">To</span>
                                <span className="settlement-party-name">{t.to}</span>
                              </div>
                            </div>
                          </div>
                          <div className="settlement-card-footer flex-between gap-3 flex-wrap">
                            <span className="settlement-card-amount">{t.amount.toFixed(2)}</span>
                            <label className="settlement-paid-control">
                              <input
                                type="checkbox"
                                disabled={isRecording}
                                onChange={async (e) => {
                                  if (!e.target.checked) return;
                                  setRecordingSettlementKey(stKey);
                                  try {
                                    await api.post('/settlements/', {
                                      group_id: id,
                                      from_name: t.from,
                                      to_name: t.to,
                                      amount: t.amount
                                    });
                                    await fetchData();
                                  } catch (err) {
                                    alert('Failed to record settlement');
                                    e.target.checked = false;
                                  } finally {
                                    setRecordingSettlementKey(null);
                                  }
                                }}
                              />
                              {isRecording ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <span className="settlement-paid-label">Mark paid</span>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="settlements-empty p-10 text-center">
                <div className="settlements-empty-icon mx-auto mb-4">
                  <CheckCircle2 size={40} strokeWidth={1.75} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Everyone is settled up</h3>
                <p className="text-muted text-small max-w-md mx-auto">
                  No one owes anyone in this group right now. Add expenses to split new bills—settlements will show up here when balances are uneven.
                </p>
              </div>
            )}
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
                            {isSettlement ? '→ ' : ''}{exp.amount.toFixed(2)}
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

        .settlements-section--active {
          border-color: rgba(16, 233, 163, 0.22);
          box-shadow: 0 0 0 1px rgba(16, 233, 163, 0.08), var(--shadow-premium);
        }
        .settlements-section--clear {
          border-color: var(--card-border);
        }
        .settlements-active-banner {
          background: linear-gradient(
            135deg,
            rgba(16, 233, 163, 0.12) 0%,
            rgba(13, 17, 23, 0.4) 55%,
            rgba(215, 90%, 60%, 0.06) 100%
          );
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .settlements-active-banner-inner {
          padding: 1.5rem 2rem;
          align-items: flex-start;
        }
        .settlements-banner-icon {
          width: 3rem;
          height: 3rem;
          border-radius: var(--radius-md);
          background: rgba(16, 233, 163, 0.15);
          border: 1px solid rgba(16, 233, 163, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .settlements-banner-title {
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        .settlements-banner-sub {
          max-width: 36rem;
          line-height: 1.5;
        }
        .settlements-summary-stack {
          flex-shrink: 0;
          min-width: 8rem;
        }
        .settlements-summary-amount {
          font-size: 1.75rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: var(--primary);
          letter-spacing: -0.03em;
        }
        .settlement-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .settlement-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1280px) {
          .settlement-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .settlement-card-enhanced {
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .settlement-card-enhanced:hover {
          border-color: rgba(16, 233, 163, 0.25);
          box-shadow: 0 12px 32px -20px rgba(0, 0, 0, 0.6);
        }
        .settlement-card-top { min-height: 1.5rem; }
        .settlement-you-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.25rem 0.55rem;
          border-radius: 6px;
          background: rgba(249, 115, 22, 0.15);
          color: #fb923c;
          border: 1px solid rgba(249, 115, 22, 0.35);
        }
        .settlement-you-badge--in {
          background: rgba(16, 233, 163, 0.12);
          color: var(--primary);
          border-color: rgba(16, 233, 163, 0.35);
        }
        .settlement-you-badge--muted {
          background: rgba(255, 255, 255, 0.05);
          color: var(--muted);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .settlement-parties {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          position: relative;
        }
        .settlement-parties::before {
          content: '↓';
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 1rem;
          color: var(--primary);
          opacity: 0.3;
          z-index: 1;
        }
        .settlement-party {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          min-width: 0;
          flex: 1;
        }
        .settlement-arrow {
          flex-shrink: 0;
          opacity: 0.65;
        }
        .settlement-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: #000;
          flex-shrink: 0;
        }
        .settlement-avatar--from {
          background: linear-gradient(135deg, hsl(38 92% 58%), hsl(25 88% 48%));
        }
        .settlement-avatar--to {
          background: linear-gradient(135deg, hsl(160 84% 48%), hsl(160 70% 36%));
        }
        .settlement-party-text {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
          flex: 1;
          z-index: 2;
        }
        .settlement-party-label {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: -0.1rem;
        }
        .settlement-party-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #fff;
        }
        .settlement-card-footer {
          padding-top: 0.75rem;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          align-items: center;
        }
        .settlement-card-amount {
          font-size: 1.5rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: var(--primary);
          letter-spacing: -0.02em;
        }
        .settlement-paid-control {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .settlement-paid-control:hover {
          border-color: rgba(16, 233, 163, 0.45);
          background: rgba(16, 233, 163, 0.08);
        }
        .settlement-paid-control input {
          width: 1.1rem;
          height: 1.1rem;
          accent-color: var(--primary);
          cursor: pointer;
        }
        .settlement-paid-control input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .settlement-paid-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .settlements-empty-icon {
          width: 4.5rem;
          height: 4.5rem;
          border-radius: 50%;
          background: rgba(16, 233, 163, 0.1);
          border: 1px solid rgba(16, 233, 163, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
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
