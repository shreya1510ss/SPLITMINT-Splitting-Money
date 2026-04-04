import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Search, Loader2, X, UserPlus, ArrowRight, FolderPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ModalPortal } from '../components/ModalPortal';

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

  useBodyScrollLock(showCreateModal);

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
    setNewGroupName('');
    setParticipantName('');
    setSearchResults([]);
    setShowDropdown(false);
    setNewParticipants([
      {
        name: user?.name || 'You',
        email: user?.email || '',
        is_registered_user: true,
      },
    ]);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewGroupName('');
    setParticipantName('');
    setSearchResults([]);
    setShowDropdown(false);
    setNewParticipants([]);
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
      closeCreateModal();
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
            <div key={group.id} className="card-premium group-card">
              <div className="flex-between">
                <h3 className="text-lg font-bold">{group.name}</h3>
                <div className="flex-center gap-1 text-muted text-small">
                  <Users size={14} />
                  <span>{group.participants.length}</span>
                </div>
              </div>
              
              <div className="group-stats-row">
                <div className="flex-column gap-1">
                  <span className="text-tiny text-muted uppercase tracking-tighter">Total Spent</span>
                  <span className="text-sm font-bold text-white">{group.totalSpent?.toFixed(2)}</span>
                </div>
                <div className="flex-column gap-1 text-right">
                  <span className="text-tiny text-muted uppercase tracking-tighter">Your Position</span>
                  <span className={`text-sm font-bold ${group.userBalance! >= 0 ? 'text-primary' : 'text-orange'}`}>
                    {group.userBalance! >= 0 ? 'Owed ' : 'Owe '}{Math.abs(group.userBalance!).toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to={`/groups/${group.id}`} className="btn-enter-group flex-center gap-2 mt-auto">
                <span>Enter Group</span>
                <ArrowRight size={18} strokeWidth={2.5} />
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

      {/* Create Group Modal — portaled so it covers sidebar + full viewport */}
      {showCreateModal && (
        <ModalPortal>
        <div className="modal-overlay" role="presentation" onClick={closeCreateModal}>
          <div
            className="modal-content modal-content--create-group glass-panel animate-fade-in shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header flex-between">
              <div>
                <h2 id="create-group-title" className="text-gradient">Create group</h2>
                <p className="text-muted text-small" style={{ marginTop: '0.35rem' }}>
                  Name your circle and invite up to three others.
                </p>
              </div>
              <button type="button" className="close-btn" onClick={closeCreateModal} aria-label="Close">
                <X size={22} />
              </button>
            </header>

            <form onSubmit={handleCreateGroup} className="modal-form flex-column gap-6">
              <div className="input-group">
                <label className="text-small text-muted mb-2 block">Group name</label>
                <div className="input-with-icon">
                  <FolderPlus className="input-icon" size={18} />
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Weekend trip, Apartment"
                    className="input-premium input-premium-with-icon w-full"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="input-group relative">
                <label className="text-small text-muted mb-2 block">Add people</label>
                <p className="text-muted text-small" style={{ marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                  Search registered users by name, or type a name and press + to add a guest (email required).
                </p>
                <div className="create-group-add-row">
                  <div className="input-with-icon flex-1">
                    <Search className="input-icon" size={17} />
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Search name…"
                      className="input-premium input-premium-with-icon w-full"
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddParticipant();
                        }
                      }}
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="button"
                    className="create-group-icon-btn"
                    onClick={() => handleAddParticipant()}
                    disabled={!participantName.trim() || isSearching}
                    aria-label="Add participant"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                  </button>
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="create-group-dropdown animate-fade-in">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="create-group-result"
                        onClick={() => handleAddParticipant(u.name, u.email, true)}
                        role="option"
                      >
                        <div className="flex-column gap-1" style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}</span>
                          <span className="text-muted text-small" style={{ fontSize: '0.75rem' }}>
                            {u.email}
                          </span>
                        </div>
                        <span className="badge-registered">On SplitMint</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="text-small text-muted mb-2 block">In this group</label>
                <div className="create-group-participants-box">
                  {newParticipants.map((p, i) => (
                    <div key={`${p.email}-${i}`} className="create-group-chip">
                      <span>
                        {p.name}
                        {i === 0 && <span className="text-muted"> (you)</span>}
                      </span>
                      {i !== 0 && (
                        <button type="button" onClick={() => handleRemoveParticipant(i)} aria-label={`Remove ${p.name}`}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isCreating} className="btn-primary w-full py-4">
                {isCreating ? <Loader2 className="animate-spin" /> : 'Create group'}
              </button>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      <style>{`
        .groups-page { display: flex; flex-direction: column; gap: 2rem; }
        .search-bar { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.5rem; }
        .search-input { background: none; border: none; color: #fff; width: 100%; outline: none; }
        .group-card { min-height: 200px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .group-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .relative { position: relative; }
        .badge-registered { background: rgba(16, 233, 163, 0.12); color: var(--primary); padding: 3px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; border: 1px solid rgba(16, 233, 163, 0.25); flex-shrink: 0; }
        .btn-enter-group { 
          width: 100%; padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 800; 
          background: rgba(16, 233, 163, 0.05); border: 1px solid rgba(16, 233, 163, 0.15); color: var(--primary); 
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); text-decoration: none; 
        }
        .btn-enter-group:hover { 
          background: var(--primary); color: #000; transform: translateY(-3px); 
          box-shadow: 0 8px 24px var(--primary-glow); border-color: transparent; 
        }
        .btn-enter-group span { letter-spacing: 0.02em; }
      `}</style>
    </div>
  );
};

export default Groups;
