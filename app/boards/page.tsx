"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Search, Wifi, WifiOff, MoreVertical, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import InviteMemberForm from '@/components/invite/InviteMemberForm';
import { useUser } from '@clerk/nextjs';

interface Board {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: string;
  role?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

const BoardsPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showBoardModal, setShowBoardModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [selectedBoardForInvite, setSelectedBoardForInvite] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [boardName, setBoardName] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const router = useRouter();
  const { user } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug user information
  useEffect(() => {
    if (user) {
      console.log('Current user:', {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        fullName: user.fullName
      });
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchBoards();
    
    // Initialize socket connection
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    // Socket connection handlers
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchBoards = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/boards');
      if (response.ok) {
        const data: ApiResponse<Board[]> = await response.json();
        const boardsData = data.boards || [];
        
        // Debug boards data
        console.log('Fetched boards:', boardsData);
        boardsData.forEach(board => {
          console.log(`Board "${board.name}":`, {
            id: board.id,
            createdBy: board.createdBy,
            isOwner: user ? board.createdBy === user.id : false
          });
        });
        
        setBoards(boardsData);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
    setIsLoading(false);
  };

  const createBoard = async (): Promise<void> => {
    if (!boardName.trim()) return;
    
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: boardName })
      });
      
      if (response.ok) {
        await fetchBoards();
        setBoardName('');
        setShowBoardModal(false);
        
        // Emit board creation event (optional - if you want to sync board creation)
        if (socket && isConnected) {
          const newBoard = await response.json();
          socket.emit('board-created', newBoard);
        }
      }
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const updateBoard = async (boardId: string, name: string): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (response.ok) {
        await fetchBoards();
        setEditingItem(null);
        
        // Emit board update event (optional)
        if (socket && isConnected) {
          socket.emit('board-updated', { boardId, name });
        }
      }
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  const deleteBoard = async (boardId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this board?')) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchBoards();
        
        // Emit board deletion event (optional)
        if (socket && isConnected) {
          socket.emit('board-deleted', { boardId });
        }
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleInviteClick = (boardId: string) => {
    console.log('Invite clicked for board:', boardId);
    setSelectedBoardForInvite(boardId);
    setShowInviteModal(true);
    setActiveDropdown(null);
  };

  const handleDropdownToggle = (boardId: string) => {
    console.log('Dropdown toggled for board:', boardId);
    setActiveDropdown(activeDropdown === boardId ? null : boardId);
  };

  const filteredBoards = boards.filter(board => 
    board.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void): void => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>, action: (value: string) => void): void => {
    action(e.target.value);
  };

  // Improved owner check function
  const isOwner = (board: Board) => {
    if (!user) return false;
    
    const isOwnerResult = board.createdBy === user.id;
    console.log(`Owner check for board "${board.name}":`, {
      boardCreatedBy: board.createdBy,
      userId: user.id,
      isOwner: isOwnerResult
    });
    
    return isOwnerResult;
  };

  // Alternative: Check if user has owner role (if you're storing roles)
  const hasOwnerRole = (board: Board) => {
    return board.role === 'owner';
  };

  // Use this function to determine if invite button should show
  const canInviteMembers = (board: Board) => {
    return isOwner(board) || hasOwnerRole(board);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-semibold text-white">My Boards</h1>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <span className="text-sm text-gray-400">
                {isConnected ? 'Online' : 'Offline Mode'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={() => setShowBoardModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Board
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBoards.map((board) => (
              <div key={board.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:shadow-lg hover:bg-gray-800 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-8 h-8 text-blue-400" />
                    <div>
                      {editingItem === board.id ? (
                        <input
                          type="text"
                          defaultValue={board.name}
                          onBlur={(e) => handleInputBlur(e, (value) => updateBoard(board.id, value))}
                          onKeyPress={(e) => handleKeyPress(e, () => updateBoard(board.id, (e.target as HTMLInputElement).value))}
                          className="text-base font-medium bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                          autoFocus
                        />
                      ) : (
                        <h2 className="font-medium text-base truncate text-white">{board.name}</h2>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => handleDropdownToggle(board.id)}
                      className="text-gray-500 hover:text-gray-300 p-1"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeDropdown === board.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => setEditingItem(board.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleInviteClick(board.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Members
                          </button>
                          <button
                            onClick={() => {
                              console.log('View members for board:', board.id);
                              setActiveDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Members
                          </button>
                          <button
                            onClick={() => deleteBoard(board.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-4">
                  {canInviteMembers(board) ? 'Owner' : 'Member'}
                </div>
                
                <button
                  onClick={() => router.push(`/boards/${board.id}/collections`)}
                  className="w-full py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                >
                  Open Board
                </button>
              </div>
            ))}
            
            {filteredBoards.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No boards yet. Create your first board!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Board</h2>
            <input
              type="text"
              placeholder="Board name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
              onKeyPress={(e) => handleKeyPress(e, createBoard)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBoardModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createBoard}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Members Modal */}
      {showInviteModal && selectedBoardForInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Invite Members</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedBoardForInvite(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <InviteMemberForm 
              boardId={selectedBoardForInvite}
              onSuccess={() => {
                setShowInviteModal(false);
                setSelectedBoardForInvite(null);
              }}
            />
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedBoardForInvite(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsPage;