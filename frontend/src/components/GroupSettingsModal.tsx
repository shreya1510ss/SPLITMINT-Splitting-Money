import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Users, Loader2, Search, Settings, Info, UserPlus } from 'lucide-react';
import { api } from '../api/api';

interface Participant {
  name: string;
  email: string;
  is_registered_user: boolean;
}

interface Group {
  id: string;
  name: string;
  participants: Participant[];
}

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group: Group;
  currentUserId: string;
  currentUserName: string;
}

const GroupSettingsModal = ({ isOpen, onClose, onSuccess, group, currentUserId, currentUserName }: GroupSettingsModalProps) => {
  // Local Draft State
  const [draftName, setDraftName] = useState(group.name);
  const [draftParticipants, setDraftParticipants] = useState<Participant[]>(group.participants);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync draft state with group when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftName(group.name);
      setDraftParticipants([...group.participants]);
      setSearchTerm('');
      setShowSearchDropdown(false);
    }
  }, [isOpen, group]);

  // Handle outside clicks for search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search for Registered Users
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchUsers(searchTerm.trim());
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchUsers = async (query: string) => {
    try {
      setIsSearching(true);
      const data = await api.get(`/auth/users/search?q=${query}`);
      const filtered = data.filter((u: any) => 
        !draftParticipants.some(p => p.email === u.email)
      );
      setSearchResults(filtered);
      setShowSearchDropdown(filtered.length > 0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddParticipant = (p: Participant) => {
    if (draftParticipants.length >= 4) {
      alert("Maximum 4 participants allowed.");
      return;
    }
    if (draftParticipants.some(dp => dp.email === p.email)) {
      alert("Already in group.");
      return;
    }
    setDraftParticipants([...draftParticipants, p]);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleRemoveParticipant = (email: string) => {
    if (draftParticipants.find(p => p.email === email)?.name === currentUserName) {
      alert("You cannot remove yourself from the group.");
      return;
    }
    setDraftParticipants(draftParticipants.filter(p => p.email !== email));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || draftParticipants.length < 1) {
      alert("Group name and at least one member are required.");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/groups/${group.id}`, {
        name: draftName.trim(),
        participants: draftParticipants
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Failed to update group settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: Delete this group permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/groups/${group.id}`);
      window.location.href = '/groups';
    } catch (err) {
      alert("Failed to delete group.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <header className="modal-header flex-between">
          <div>
            <h2 className="text-gradient">Group Hub</h2>
            <p className="text-muted text-small">Manage branding and members</p>
          </div>
          <button onClick={onClose} className="close-btn"><X size={20}/></button>
        </header>

        <form onSubmit={handleSave} className="modal-form">
          {/* Group Identity */}
          <div className="input-group">
            <label className="text-small text-muted font-bold uppercase tracking-wider">Group Identity</label>
            <div className="input-with-icon">
              <Settings className="input-icon" size={18} />
              <input 
                type="text" 
                value={draftName} 
                onChange={e => setDraftName(e.target.value)} 
                placeholder="Group Name" 
                className="input-premium input-premium-with-icon"
                required
              />
            </div>
          </div>

          {/* Members Section */}
          <div className="flex-column gap-4">
            <div className="flex-between">
              <label className="text-small text-muted font-bold uppercase tracking-wider">Members ({draftParticipants.length}/4)</label>
              <span className="text-tiny text-muted uppercase font-bold">{4 - draftParticipants.length} slots open</span>
            </div>
            
            <div className="participant-manager-list flex-column">
              {draftParticipants.map((p) => (
                <div key={p.email} className="flex-between p-3 border-b border-white-05 last:border-0 hover:bg-white-02 transition-colors">
                  <div className="flex-center gap-3">
                    <div className="avatar-xs flex-center" style={{ width: '32px', height: '32px', background: 'var(--primary)', color: '#000', borderRadius: '8px', fontWeight: 900 }}>
                      {p.name[0]}
                    </div>
                    <div className="flex-column">
                      <span className="text-sm font-bold">{p.name} {p.name === currentUserName && <span className="text-primary-50 opacity-60 ml-1">(You)</span>}</span>
                      <span className="text-tiny text-muted">{p.email}</span>
                    </div>
                  </div>
                  {p.name !== currentUserName && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveParticipant(p.email)} 
                      className="text-error hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Members Search */}
          <div className="input-group" ref={searchRef}>
            <label className="text-small text-muted font-bold uppercase tracking-wider">Add Members</label>
            <div className="input-with-icon relative">
              <Search className="input-icon" size={18} />
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-premium input-premium-with-icon"
              />
              {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-primary" size={18}/></div>}
              
              {showSearchDropdown && (
                <div className="dropdown-panel-premium animate-fade-in shadow-xl">
                  {searchResults.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => handleAddParticipant({ name: u.name, email: u.email, is_registered_user: true })} 
                      className="dropdown-item-premium"
                    >
                      <div className="flex-center gap-3">
                        <div className="avatar-tiny" style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                          {u.name[0]}
                        </div>
                        <div className="flex-column">
                          <span className="text-xs font-bold">{u.name}</span>
                          <span className="text-tiny text-muted">{u.email}</span>
                        </div>
                      </div>
                      <div className="flex-center gap-1 text-primary text-tiny font-black uppercase">
                        <UserPlus size={12}/> add
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-tiny text-muted italic text-center mt-1">Note: Only registered SplitMint users can be added.</p>
          </div>

          {/* Actions */}
          <div className="flex-column gap-6 pt-4 v-divider-top">
            <div className="flex-grid">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving} 
                className="btn-primary flex-1"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                <span>Save Changes</span>
              </button>
            </div>
            
            <button 
              type="button" 
              onClick={handleDelete} 
              className="btn-danger-premium w-full mt-2"
            >
              <Trash2 size={16}/>
              <span>Delete Group Permanently</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
