import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Calendar, Users, FileText, PieChart, LayoutGrid } from 'lucide-react';
import { api } from '../api/api';

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay flex-center">
      <div className="modal-content glass-panel animate-fade-in shadow-xl">
        <header className="modal-header flex-between mb-8">
          <div>
            <h2 className="text-gradient">{initialData ? 'Edit Expense' : 'Add New Expense'}</h2>
            <p className="text-muted text-small">Split a bill with your group</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
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

          {/* Split Mode Tabs */}
          <div className="split-mode-container">
            <label className="text-small text-muted mb-2 block">Split Mode</label>
            <div className="tabs-premium">
              <button 
                type="button" 
                className={splitMode === 'equal' ? 'active' : ''} 
                onClick={() => setSplitMode('equal')}
              >
                <LayoutGrid size={16} /> Equal
              </button>
              <button 
                type="button" 
                className={splitMode === 'percentage' ? 'active' : ''} 
                onClick={() => setSplitMode('percentage')}
              >
                <PieChart size={16} /> %
              </button>
              <button 
                type="button" 
                className={splitMode === 'custom' ? 'active' : ''} 
                onClick={() => setSplitMode('custom')}
              >
                <DollarSign size={16} /> Custom
              </button>
            </div>
          </div>

          {/* Detailed Splits Inputs */}
          {splitMode !== 'equal' && (
            <div className="splits-detail-grid glass-panel p-4">
              {splits.map((s, i) => (
                <div key={i} className="flex-between py-2 border-b border-white-05 last:border-0">
                  <span className="text-small">{s.participant_name}</span>
                  <div className="flex-center gap-2">
                    {splitMode === 'percentage' ? (
                      <div className="input-mini-wrapper">
                        <input 
                          type="number" 
                          step="0.1"
                          value={s.percentage || ''}
                          onChange={(e) => handleSplitValueChange(i, 'percentage', e.target.value)}
                          className="input-mini"
                        />
                        <span className="text-muted text-xs">%</span>
                      </div>
                    ) : (
                      <div className="input-mini-wrapper">
                        <span className="text-muted text-xs">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={s.owed_share || ''}
                          onChange={(e) => handleSplitValueChange(i, 'owed_share', e.target.value)}
                          className="input-mini"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={isSubmitting || !selectedGroupId} className="btn-primary w-full py-4 mt-4">
            {isSubmitting ? <Loader2 className="animate-spin" /> : (initialData ? 'Update Expense' : 'Add Expense')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
