"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Search, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

interface Board {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

const BoardsPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showBoardModal, setShowBoardModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [boardName, setBoardName] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const router = useRouter();

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
        setBoards(data.boards || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs">Disconnected</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowBoardModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Board</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBoards.map((board) => (
              <div key={board.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FolderOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        {editingItem === board.id ? (
                          <input
                            type="text"
                            defaultValue={board.name}
                            onBlur={(e) => handleInputBlur(e, (value) => updateBoard(board.id, value))}
                            onKeyPress={(e) => handleKeyPress(e, () => updateBoard(board.id, (e.target as HTMLInputElement).value))}
                            className="text-lg font-semibold border rounded px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                        )}
                        <p className="text-sm text-gray-500">Board</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(board.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteBoard(board.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/boards/${board.id}/collections`)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Open Board
                  </button>
                </div>
              </div>
            ))}
            
            {filteredBoards.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No boards yet. Create your first board!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Board</h2>
            <input
              type="text"
              placeholder="Board name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => handleKeyPress(e, createBoard)}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBoardModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createBoard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsPage;