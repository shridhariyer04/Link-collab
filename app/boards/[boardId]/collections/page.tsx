"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Search, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

interface Board {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: string;
}

interface Collection {
  id: string;
  name: string;
  boardId: string;
  createdBy: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

export default function CollectionsPage(){
  const [board, setBoard] = useState<Board | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCollectionModal, setShowCollectionModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

  useEffect(() => {
    if (boardId) {
      fetchBoard();
      fetchCollections();
      
      // Initialize socket connection
      const newSocket = io('http://localhost:4000');
      setSocket(newSocket);

      // Socket connection handlers
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        
        // Join the board room
        newSocket.emit('join-board', boardId);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Listen for real-time updates (if you want to sync collections in real-time)
      newSocket.on('collection-added', (data: { boardId: string; collection: Collection }) => {
        if (data.boardId === boardId) {
          setCollections(prev => [...prev, data.collection]);
        }
      });

      newSocket.on('collection-updated', (data: { boardId: string; collectionId: string; fields: Partial<Collection> }) => {
        if (data.boardId === boardId) {
          setCollections(prev => prev.map(collection => 
            collection.id === data.collectionId 
              ? { ...collection, ...data.fields }
              : collection
          ));
        }
      });

      newSocket.on('collection-deleted', (data: { boardId: string; collectionId: string }) => {
        if (data.boardId === boardId) {
          setCollections(prev => prev.filter(collection => collection.id !== data.collectionId));
        }
      });

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [boardId]);

  const fetchBoard = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data.board);
      }
    } catch (error) {
      console.error('Error fetching board:', error);
    }
  };

  const fetchCollections = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/boards/${boardId}/collections`);
      if (response.ok) {
        const data: ApiResponse<Collection[]> = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
    setIsLoading(false);
  };

  const createCollection = async (): Promise<void> => {
    if (!collectionName.trim()) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: collectionName })
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchCollections();
        setCollectionName('');
        setShowCollectionModal(false);
        
        // Emit collection creation event (optional - if you want to sync collection creation)
        if (socket && isConnected) {
          socket.emit('collection-created', { boardId, collection: data.collection });
        }
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const updateCollection = async (collectionId: string, name: string): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (response.ok) {
        await fetchCollections();
        setEditingItem(null);
        
        // Emit collection update event (optional)
        if (socket && isConnected) {
          socket.emit('collection-updated', { boardId, collectionId, fields: { name } });
        }
      }
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  };

  const deleteCollection = async (collectionId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchCollections();
        
        // Emit collection deletion event (optional)
        if (socket && isConnected) {
          socket.emit('collection-deleted', { boardId, collectionId });
        }
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const filteredCollections = collections.filter(collection => 
    collection.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/boards')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {board?.name || 'Collections'}
                </h1>
                <p className="text-sm text-gray-500">Board Collections</p>
              </div>
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
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowCollectionModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Collection</span>
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
            {filteredCollections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FolderOpen className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        {editingItem === collection.id ? (
                          <input
                            type="text"
                            defaultValue={collection.name}
                            onBlur={(e) => handleInputBlur(e, (value) => updateCollection(collection.id, value))}
                            onKeyPress={(e) => handleKeyPress(e, () => updateCollection(collection.id, (e.target as HTMLInputElement).value))}
                            className="text-lg font-semibold border rounded px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
                        )}
                        <p className="text-sm text-gray-500">Collection</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(collection.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteCollection(collection.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/boards/${boardId}/collections/${collection.id}/links`)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Open Collection
                  </button>
                </div>
              </div>
            ))}
            
            {filteredCollections.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No collections yet. Create your first collection!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Collection</h2>
            <input
              type="text"
              placeholder="Collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => handleKeyPress(e, createCollection)}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCollectionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createCollection}
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