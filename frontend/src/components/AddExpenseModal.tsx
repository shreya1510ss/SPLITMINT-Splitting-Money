import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Calendar, Users, FileText, PieChart, LayoutGrid, Scale } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../api/api';
import { ModalPortal } from './ModalPortal';

function participantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

interface Participant {
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  participants: Participant[];
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: { id: string; name: string; email: string }; // Passing full user object now
  groupId?: string;
  initialData?: any;
}

const AddExpenseModal = ({ isOpen, onClose, onSuccess, user, groupId, initialData }: AddExpenseModalProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerName, setPayerName] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom' | 'percentage'>('equal');
  const [splits, setSplits] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormDataFromInitial(initialData);
      } else {
        fetchGroups();
      }
    }
  }, [isOpen, initialData, user]);

  const setFormDataFromInitial = (data: any) => {
    setSelectedGroupId(data.group_id);
    setDescription(data.description);
    setAmount(data.amount.toString());
    setDate(new Date(data.date).toISOString().split('T')[0]);
    setPayerName(data.payer_name);
    setSplitMode(data.split_mode);
    setSplits(data.splits);
    setLoadingGroups(false);
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const data = await api.get(`/groups/?user_id=${user.id}&user_email=${user.email}`);
      setGroups(data);
      if (data.length > 0) {
        const preSelectedId = groupId || data[0].id;
        const selectedGroup = data.find((g: any) => g.id === preSelectedId) || data[0];
        setSelectedGroupId(selectedGroup.id);
        setPayerName(selectedGroup.participants[0]?.name || '');
        initializeSplits(selectedGroup);
      }
    } catch (err) {
      console.error('Failed to fetch groups for expense:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const initializeSplits = (group: Group) => {
    setSplits(group.participants.map(p => ({
      participant_name: p.name,
      owed_share: 0,
      percentage: (100 / group.participants.length).toFixed(1)
    })));
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setPayerName(group.participants[0]?.name || '');
      initializeSplits(group);
    }
  };

  const handleSplitValueChange = (index: number, field: string, value: string) => {
    const nextSplits = [...splits];
    nextSplits[index][field] = parseFloat(value) || 0;
    setSplits(nextSplits);
  };

  const validateSplits = () => {
    const total = parseFloat(amount);
    if (splitMode === 'percentage') {
      const sumPercent = splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
      if (Math.abs(sumPercent - 100) > 0.1) {
        alert('Percentages must sum to exactly 100%');
        return false;
      }
    } else if (splitMode === 'custom') {
      const sumAmount = splits.reduce((acc, s) => acc + (s.owed_share || 0), 0);
      if (Math.abs(sumAmount - total) > 0.01) {
        alert(`Custom amounts must sum to the total amount ($${total})`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !description || !amount || !payerName) return;
    if (!validateSplits()) return;

    setIsSubmitting(true);
    try {
      const expensePayload = {
        group_id: selectedGroupId,
        description: description.trim(),
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        payer_name: payerName,
        split_mode: splitMode,
        splits: splits.map(s => ({
          participant_name: s.participant_name,
          owed_share: splitMode === 'custom' ? s.owed_share : 0,
          percentage: splitMode === 'percentage' ? s.percentage : undefined
        }))
      };

      if (initialData) {
        await api.put(`/expenses/${initialData.id}`, expensePayload);
      } else {
        await api.post('/expenses/', expensePayload);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setSplits([]);
  };

  const amountNum = parseFloat(amount) || 0;
  const pctSum = splits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
  const customSum = splits.reduce((acc, s) => acc + (Number(s.owed_share) || 0), 0);
  const equalShare = splits.length > 0 && amountNum > 0 ? amountNum / splits.length : 0;
  const pctOk = Math.abs(pctSum - 100) <= 0.1;
  const customOk = Math.abs(customSum - amountNum) <= 0.01;
  const pctBarPct = Math.min((pctSum / 100) * 100, 100);
  const customBarPct =
    amountNum > 0 ? Math.min((customSum / amountNum) * 100, 100) : 0;

  if (!isOpen) return null;

  return (
    <ModalPortal>
    <div className="modal-overlay">
      <div className="modal-content modal-content--expense glass-panel animate-fade-in shadow-xl">
        <header className="modal-header flex-between mb-8">
          <div>
            <h2 className="text-gradient">{initialData ? 'Edit Expense' : 'Add New Expense'}</h2>
            <p className="text-muted text-small">Split a bill with your group</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form flex-column gap-6">
          <div className="input-group">
            <label className="text-small text-muted mb-2 block">Choose Group</label>
            <div className="input-with-icon">
              <Users className="input-icon" size={18} />
              <select 
                value={selectedGroupId} 
                onChange={(e) => handleGroupChange(e.target.value)}
                className="input-premium input-premium-with-icon appearance-none w-full"
                required
                disabled={!!initialData}
              >
                {loadingGroups ? (
                  <option>Loading groups...</option>
                ) : groups.length > 0 ? (
                  groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                ) : (
                  <option disabled>No groups found</option>
                )}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="text-small text-muted mb-2 block">Description</label>
            <div className="input-with-icon">
              <FileText className="input-icon" size={18} />
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner, Rent, Uber"
                className="input-premium input-premium-with-icon w-full"
                required
              />
            </div>
          </div>

          <div className="flex-grid gap-4">
            <div className="input-group flex-1">
              <label className="text-small text-muted mb-2 block">Amount ($)</label>
              <div className="input-with-icon">
                <DollarSign className="input-icon" size={18} />
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-premium input-premium-with-icon w-full"
                  required
                />
              </div>
            </div>
            <div className="input-group flex-1">
              <label className="text-small text-muted mb-2 block">Date</label>
              <div className="input-with-icon">
                <Calendar className="input-icon" size={18} />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-premium input-premium-with-icon w-full"
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="text-small text-muted mb-2 block">Who Paid?</label>
            <div className="input-with-icon">
              <Users className="input-icon" size={18} />
              <select 
                value={payerName} 
                onChange={(e) => setPayerName(e.target.value)}
                className="input-premium input-premium-with-icon appearance-none w-full"
                required
              >
                {splits.map(p => (
                  <option key={p.participant_name} value={p.participant_name}>{p.participant_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="split-section">
            <div className="split-section-label">
              <span>Divide the bill</span>
              <Scale size={14} className="text-muted" aria-hidden />
            </div>

            <div className="split-mode-pills" role="tablist" aria-label="Split mode">
              <button
                type="button"
                role="tab"
                aria-selected={splitMode === 'equal'}
                className={clsx(splitMode === 'equal' && 'active')}
                onClick={() => setSplitMode('equal')}
              >
                <LayoutGrid size={16} strokeWidth={2.25} />
                Equal
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={splitMode === 'percentage'}
                className={clsx(splitMode === 'percentage' && 'active')}
                onClick={() => setSplitMode('percentage')}
              >
                <PieChart size={16} strokeWidth={2.25} />
                Percent
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={splitMode === 'custom'}
                className={clsx(splitMode === 'custom' && 'active')}
                onClick={() => setSplitMode('custom')}
              >
                <DollarSign size={16} strokeWidth={2.25} />
                Custom
              </button>
            </div>

            {splitMode === 'equal' && splits.length > 0 && (
              <>
                <div className="split-participant-list">
                  {splits.map((s, i) => (
                    <div key={s.participant_name} className="split-participant-row">
                      <div className="split-person">
                        <div className={clsx('split-avatar', `tone-${i % 5}`)}>
                          {participantInitials(s.participant_name)}
                        </div>
                        <span className="split-person-name">{s.participant_name}</span>
                      </div>
                      <span className="split-equal-amount">
                        {amountNum > 0
                          ? `$${equalShare.toFixed(2)}`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="split-hint">
                  Each person’s share updates from the total amount above. Everyone is charged the same split.
                </p>
              </>
            )}

            {splitMode === 'percentage' && splits.length > 0 && (
              <>
                <div className="split-participant-list">
                  {splits.map((s, i) => (
                    <div key={s.participant_name} className="split-participant-row">
                      <div className="split-person">
                        <div className={clsx('split-avatar', `tone-${i % 5}`)}>
                          {participantInitials(s.participant_name)}
                        </div>
                        <span className="split-person-name">{s.participant_name}</span>
                      </div>
                      <div className="split-field">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={100}
                          value={s.percentage === 0 || s.percentage ? String(s.percentage) : ''}
                          onChange={(e) => handleSplitValueChange(i, 'percentage', e.target.value)}
                          placeholder="0"
                          aria-label={`Percentage for ${s.participant_name}`}
                        />
                        <span className="split-field-prefix">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="split-summary">
                  <div className="split-summary-text">
                    <span>Assigned</span>
                    <strong>
                      {pctSum.toFixed(1)}% <span className="text-muted"> / 100%</span>
                    </strong>
                  </div>
                  <div className="split-summary-track" aria-hidden>
                    <div
                      className={clsx(
                        'split-summary-fill',
                        !pctOk && pctSum > 100 && 'is-error',
                        !pctOk && pctSum <= 100 && 'is-warning'
                      )}
                      style={{ width: `${pctBarPct}%` }}
                    />
                  </div>
                  <p className="split-hint">
                    {pctOk
                      ? 'Percentages match — you’re good to save.'
                      : 'Percentages must add up to exactly 100% before you can save.'}
                  </p>
                </div>
              </>
            )}

            {splitMode === 'custom' && splits.length > 0 && (
              <>
                <div className="split-participant-list">
                  {splits.map((s, i) => (
                    <div key={s.participant_name} className="split-participant-row">
                      <div className="split-person">
                        <div className={clsx('split-avatar', `tone-${i % 5}`)}>
                          {participantInitials(s.participant_name)}
                        </div>
                        <span className="split-person-name">{s.participant_name}</span>
                      </div>
                      <div className="split-field">
                        <span className="split-field-prefix">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={s.owed_share === 0 || s.owed_share ? String(s.owed_share) : ''}
                          onChange={(e) => handleSplitValueChange(i, 'owed_share', e.target.value)}
                          placeholder="0.00"
                          aria-label={`Amount owed for ${s.participant_name}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="split-summary">
                  <div className="split-summary-text">
                    <span>Subtotal</span>
                    <strong>
                      ${customSum.toFixed(2)}{' '}
                      <span className="text-muted">
                        / ${amountNum.toFixed(2)}
                      </span>
                    </strong>
                  </div>
                  <div className="split-summary-track" aria-hidden>
                    <div
                      className={clsx(
                        'split-summary-fill',
                        !customOk && customSum > amountNum && amountNum > 0 && 'is-error',
                        !customOk && customSum <= amountNum && amountNum > 0 && 'is-warning'
                      )}
                      style={{ width: `${customBarPct}%` }}
                    />
                  </div>
                  <p className="split-hint">
                    {amountNum <= 0
                      ? 'Enter an amount above, then assign each person’s share so the rows sum to that total.'
                      : customOk
                        ? 'Shares match the bill total — ready to save.'
                        : 'Each person’s amount should add up to the expense total.'}
                  </p>
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={isSubmitting || !selectedGroupId} className="btn-primary w-full py-4 mt-4">
            {isSubmitting ? <Loader2 className="animate-spin" /> : (initialData ? 'Update Expense' : 'Add Expense')}
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

export default AddExpenseModal;
