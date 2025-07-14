// components/boards/ViewMembersModal.tsx
import React, { useState, useEffect } from 'react';
import { Users, Crown, User, Trash2, X, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface ViewMembersModalProps {
  boardId: string;
  onClose: () => void;
}

const ViewMembersModal: React.FC<ViewMembersModalProps> = ({ boardId, onClose }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [boardId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/boards/${boardId}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data.members || []);
      setCurrentUserRole(data.currentUserRole || 'member');
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (currentUserRole !== 'owner') {
      toast.error('Only board owners can remove members');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${memberName} from this board?`)) {
      return;
    }

    try {
      setDeletingMember(memberId);
      const response = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      // Remove member from local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success(`${memberName} has been removed from the board`);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setDeletingMember(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Board Members</h2>
            <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-sm">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">
                          {member.name || 'Unknown User'}
                        </h3>
                        {member.role === 'owner' && (
                          <Crown className="w-4 h-4 text-yellow-400"  />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-3 h-3" />
                        <span>{member.email}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {formatDate(member.joinedAt)}
                      </p>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'owner'
                          ? 'bg-yellow-400/20 text-yellow-400'
                          : 'bg-blue-400/20 text-blue-400'
                      }`}>
                        {member.role === 'owner' ? 'Owner' : 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {currentUserRole === 'owner' && member.role !== 'owner' && (
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        disabled={deletingMember === member.id}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        {deletingMember === member.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {currentUserRole === 'owner' 
                ? 'You can remove members from this board' 
                : 'Only board owners can remove members'
              }
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMembersModal;