import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Search, Loader2, X, UserPlus, ArrowRight, TrendingUp, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface Participant {
  name: string;
  email: string;
  color?: string;
  is_registered_user: boolean;
}

interface Group {
  id: string;
  name: string;
  participants: Participant[];
  creator_id: string;
  totalSpent?: number;
  userBalance?: number;
}

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newParticipants, setNewParticipants] = useState<Participant[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Participant Search State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  // Debounced search for participants
  useEffect(() => {
    const timer = setTimeout(() => {
      if (participantName.trim().length >= 2) {
        searchUsers(participantName.trim());
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [participantName]);

  const searchUsers = async (query: string) => {
    try {
      setIsSearching(true);
      const data = await api.get(`/auth/users/search?q=${query}`);
      const filtered = data.filter((u: any) => 
        u.id !== user?.id && 
        !newParticipants.some(p => p.name === u.name)
      );
      setSearchResults(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchGroups = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Now fetching groups where user is creator OR participant (via email)
      const groupData = await api.get(`/groups/?user_id=${user.id}&user_email=${user.email}`);
      
      // Fetch balances for each group to enrich the list
      const enrichedGroups = await Promise.all(groupData.map(async (g: Group) => {
        try {
          const balanceData = await api.get(`/balances/${g.id}`);
          return {
            ...g,
            totalSpent: balanceData.total_spent || 0,
            userBalance: balanceData.net_balances[user.name] || 0
          };
        } catch {
          return { ...g, totalSpent: 0, userBalance: 0 };
        }
      }));
      
      setGroups(enrichedGroups);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setNewParticipants([{ 
      name: user?.name || 'You', 
      email: user?.email || '',
      is_registered_user: true 
    }]);
    setShowCreateModal(true);
  };

  const handleAddParticipant = (name?: string, email?: string, isRegistered = false) => {
    const finalName = name || participantName.trim();
    const finalEmail = email || (isRegistered ? '' : ''); // We need a way to input email for guests too
    
    if (!finalName) return;
    
    // For non-registered users, we'll need an email input. 
    // Since the user said "dont keep optional", we must have an email.
    if (!email && !isRegistered) {
      const guestEmail = window.prompt(`Enter email for ${finalName}:`);
      if (!guestEmail) return;
      email = guestEmail;
    }

    if (newParticipants.length >= 4) {
      alert("Maximum 4 participants allowed.");
      return;
    }
    
    if (newParticipants.some(p => p.name.toLowerCase() === finalName.toLowerCase())) {
      alert("This person is already added.");
      return;
    }

    setNewParticipants([...newParticipants, { 
      name: finalName, 
      email: email || '',
      is_registered_user: isRegistered 
    }]);
    setParticipantName('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveParticipant = (index: number) => {
    setNewParticipants(newParticipants.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || newParticipants.length === 0) return;
    
    // Validate all participants have emails
    if (newParticipants.some(p => !p.email)) {
      alert("All participants must have an email address.");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: newGroupName.trim(),
        participants: newParticipants
      };

      await api.post(`/groups/?creator_id=${user?.id}`, payload);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewParticipants([]);
      fetchGroups();
    } catch (err) {
      alert('Failed to create group. Please check participants (max 4).');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="groups-page animate-fade-in">
      <header className="page-header flex-between">
        <div>
          <h1 className="text-gradient">My Groups</h1>
          <p className="text-muted">Manage your shared expense circles</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} />
          <span>Create Group</span>
        </button>
      </header>

      <div className="search-bar glass-panel">
        <Search className="text-muted" size={20} />
        <input 
          type="text" 
          placeholder="Search groups..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="flex-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="section-grid">
          {filteredGroups.map(group => (
            <div key={group.id} className="card-premium group-card flex-column">
              <div className="flex-between mb-2">
                <h3 className="text-lg font-bold">{group.name}</h3>
                <div className="flex-center gap-1 text-muted text-small">
                  <Users size={14} />
                  <span>{group.participants.length}</span>
                </div>
              </div>
              
              <div className="group-stats-row mb-6 mt-2">
                <div className="flex-column gap-1">
                  <span className="text-tiny text-muted uppercase tracking-tighter">Total Spent</span>
                  <span className="text-sm font-bold text-white">${group.totalSpent?.toFixed(2)}</span>
                </div>
                <div className="flex-column gap-1 text-right">
                  <span className="text-tiny text-muted uppercase tracking-tighter">Your Position</span>
                  <span className={`text-sm font-bold ${group.userBalance! >= 0 ? 'text-primary' : 'text-orange'}`}>
                    {group.userBalance! >= 0 ? 'Owed ' : 'Owe '}${Math.abs(group.userBalance!).toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to={`/groups/${group.id}`} className="text-btn flex-center gap-1 mt-auto">
                <span>Enter Group</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-premium empty-state text-center">
          <Users className="text-muted" size={48} />
          <p className="text-muted">No groups found. Create one to get started!</p>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in shadow-xl">
            <header className="modal-header flex-between mb-8">
              <h2>New Expense Group</h2>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)} aria-label="Close"><X size={24} /></button>
            </header>

            <form onSubmit={handleCreateGroup} className="modal-form flex-column gap-6">
              <div className="input-group">
                <label className="text-small text-muted mb-2 block">Group Name</label>
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Goa Trip" className="input-premium w-full" required />
              </div>

              <div className="input-group relative">
                <label className="text-small text-muted mb-2 block">Add Participants (Max 3 others)</label>
                <div className="flex-center gap-2">
                  <input type="text" value={participantName} onChange={(e) => setParticipantName(e.target.value)} placeholder="Name or Email" className="input-premium w-full" onFocus={() => searchResults.length > 0 && setShowDropdown(true)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())} />
                  <button type="button" onClick={() => handleAddParticipant()} className="icon-btn-primary"><UserPlus size={20} /></button>
                </div>
                {showDropdown && (
                  <div className="search-dropdown glass-panel animate-fade-in">
                    {searchResults.map(u => (
                      <div key={u.id} className="search-result-item flex-between" onClick={() => handleAddParticipant(u.name, u.email, true)}>
                        <div className="flex-column">
                          <span className="font-bold">{u.name}</span>
                          <span className="text-xs text-muted">{u.email}</span>
                        </div>
                        <span className="badge-registered">Registered</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="participants-list">
                {newParticipants.map((p, i) => (
                  <div key={i} className="participant-chip flex-between">
                    <span>{p.name} {i === 0 && '(You)'}</span>
                    {i !== 0 && <button type="button" onClick={() => handleRemoveParticipant(i)}><X size={14} /></button>}
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isCreating} className="btn-primary w-full py-4 mt-2">
                {isCreating ? <Loader2 className="animate-spin" /> : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .groups-page { display: flex; flex-direction: column; gap: 2rem; }
        .search-bar { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.5rem; }
        .search-input { background: none; border: none; color: #fff; width: 100%; outline: none; }
        .group-card { min-height: 180px; padding: 1.5rem; }
        .group-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .text-tiny { font-size: 0.65rem; }
        .relative { position: relative; }
        .search-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: rgba(15, 18, 25, 0.95); z-index: 1100; padding: 0.5rem; }
        .search-result-item { padding: 0.75rem 1rem; cursor: pointer; border-radius: var(--radius-sm); }
        .search-result-item:hover { background: rgba(255,255,255,0.05); }
        .badge-registered { background: rgba(16, 233, 163, 0.1); color: var(--primary); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
        .participants-list { min-height: 80px; border: 1px dashed rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .participant-chip { background: rgba(16, 233, 163, 0.1); color: var(--primary); padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .icon-btn-primary { width: 52px; height: 52px; background: var(--primary); border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default Groups;
