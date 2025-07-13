// app/boards/[boardId]/collections/page.tsx
"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Search, ArrowLeft, Wifi, WifiOff, AlertCircle } from 'lucide-react';
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

export default function CollectionsPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCollectionModal, setShowCollectionModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

  useEffect(() => {
    if (boardId) {
      fetchBoard();
      fetchCollections();

      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"],
});
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
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
      } else {
        setError(`Failed to fetch board: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      setError('Network error fetching board. Please try again.');
    }
  };

  const fetchCollections = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boards/${boardId}/collections`);
      if (response.ok) {
        const data: ApiResponse<Collection[]> = await response.json();
        setCollections(data.collections || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to fetch collections: ${response.statusText}`);
        console.error("Failed to fetch collections:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      setError("Network error fetching collections. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async (): Promise<void> => {
    if (!collectionName.trim()) {
      setError("Collection name cannot be empty");
      return;
    }

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
        if (socket && isConnected) {
          socket.emit('collection-created', { boardId, collection: data.collection });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create collection");
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      setError("Network error creating collection. Please try again.");
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
        if (socket && isConnected) {
          socket.emit('collection-updated', { boardId, collectionId, fields: { name } });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update collection");
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      setError("Network error updating collection. Please try again.");
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
        if (socket && isConnected) {
          socket.emit('collection-deleted', { boardId, collectionId });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete collection");
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      setError("Network error deleting collection. Please try again.");
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/boards')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {board?.name || 'Collections'}
              </h1>
              <p className="text-sm text-gray-400">Collections in this board</p>
            </div>
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
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={() => setShowCollectionModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Collection
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg flex items-start gap-2 bg-red-900/20 border border-red-800">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Collections Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCollections.map((collection) => (
              <div key={collection.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:shadow-lg hover:bg-gray-800 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-8 h-8 text-blue-400" />
                    <div>
                      {editingItem === collection.id ? (
                        <input
                          type="text"
                          defaultValue={collection.name}
                          onBlur={(e) => handleInputBlur(e, (value) => updateCollection(collection.id, value))}
                          onKeyPress={(e) => handleKeyPress(e, () => updateCollection(collection.id, (e.target as HTMLInputElement).value))}
                          className="text-base font-medium bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                          autoFocus
                        />
                      ) : (
                        <h2 className="font-medium text-base truncate text-white">{collection.name}</h2>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem(collection.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-4">
                  Collection
                </div>
                
                <button
                  onClick={() => router.push(`/boards/${boardId}/collections/${collection.id}/items`)}
                  className="w-full py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                >
                  Open Collection
                </button>
              </div>
            ))}
            
            {filteredCollections.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No collections yet. Create your first collection!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Collection</h2>
            <input
              type="text"
              placeholder="Collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
              onKeyPress={(e) => handleKeyPress(e, createCollection)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCollectionModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCollection}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}