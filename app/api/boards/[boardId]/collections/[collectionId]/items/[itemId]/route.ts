"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Search, ArrowLeft, AlertCircle, FileText, StickyNote, Link2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

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

interface Item {
  id: string;
  type: 'link' | 'note' | 'file';
  title: string;
  url?: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  favicon?: string;
  tags?: string[];
  collectionId: string;
  createdBy: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  items: T[];
}

export default function ItemsPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [itemType, setItemType] = useState<'link' | 'note' | 'file'>('link');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    content: '',
    fileUrl: ''
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;
  const collectionId = params.collectionId as string;

  useEffect(() => {
    if (boardId && collectionId) {
      fetchBoard();
      fetchCollection();
      fetchItems();
      
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        transports: ["websocket"],
      });
      setSocket(newSocket);

      // Socket connection handlers
      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join-board', boardId);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', () => {
        setIsConnected(false);
      });

      // Listen for real-time updates
      newSocket.on('item-added', (data: { collectionId: string; item: Item }) => {
        if (data.collectionId === collectionId) {
          setItems(prev => [...prev, data.item]);
        }
      });

      newSocket.on('item-updated', (data: { collectionId: string; itemId: string; fields: Partial<Item> }) => {
        if (data.collectionId === collectionId) {
          setItems(prev => prev.map(item => 
            item.id === data.itemId ? { ...item, ...data.fields } : item
          ));
        }
      });

      newSocket.on('item-deleted', (data: { collectionId: string; itemId: string }) => {
        if (data.collectionId === collectionId) {
          setItems(prev => prev.filter(item => item.id !== data.itemId));
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [boardId, collectionId]);

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
      setError('Network error fetching board. Please try again.');
    }
  };

  const fetchCollection = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data.collection);
      } else {
        setError(`Failed to fetch collection: ${response.statusText}`);
      }
    } catch (error) {
      setError('Network error fetching collection. Please try again.');
    }
  };

  const fetchItems = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/items`);
      if (response.ok) {
        const data: ApiResponse<Item> = await response.json();
        setItems(data.items || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to fetch items: ${response.statusText}`);
      }
    } catch (error) {
      setError('Network error fetching items. Please try again.');
    }
    setIsLoading(false);
  };

  const createItem = async (): Promise<void> => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (itemType === 'link' && !formData.url.trim()) {
      setError("URL is required for links");
      return;
    }

    if (itemType === 'note' && !formData.content.trim()) {
      setError("Content is required for notes");
      return;
    }

    if (itemType === 'file' && !formData.fileUrl.trim()) {
      setError("File URL is required for files");
      return;
    }

    try {
      const payload = {
        type: itemType,
        title: formData.title,
        description: formData.description,
        createdBy: 'user-id', // Replace with actual user ID
        ...(itemType === 'link' && { url: formData.url }),
        ...(itemType === 'note' && { content: formData.content }),
        ...(itemType === 'file' && { fileData: { url: formData.fileUrl } })
      };

      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        setItems(prev => [...prev, data.item]);
        resetForm();
        setShowModal(false);
        setError(null);
        
        if (socket && isConnected) {
          socket.emit('add-item', {
            boardId,
            collectionId,
            item: data.item
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create item");
      }
    } catch (error) {
      setError("Network error creating item. Please try again.");
    }
  };

  const updateItem = async (itemId: string, fields: Partial<Item>): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      
      if (response.ok) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...fields } : item
        ));
        setEditingItem(null);
        
        if (socket && isConnected) {
          socket.emit('update-item', {
            boardId,
            collectionId,
            itemId,
            fields
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update item");
      }
    } catch (error) {
      setError("Network error updating item. Please try again.");
    }
  };

  const deleteItem = async (itemId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        
        if (socket && isConnected) {
          socket.emit('delete-item', {
            boardId,
            collectionId,
            itemId
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete item");
      }
    } catch (error) {
      setError("Network error deleting item. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      content: '',
      fileUrl: ''
    });
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'link': return <Link2 className="w-5 h-5" />;
      case 'note': return <StickyNote className="w-5 h-5" />;
      case 'file': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'link': return 'bg-blue-900/30';
      case 'note': return 'bg-yellow-900/30';
      case 'file': return 'bg-green-900/30';
      default: return 'bg-gray-900/30';
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push(`/boards/${boardId}/collections`)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {collection?.name || 'Items'}
              </h1>
              <p className="text-sm text-gray-400">
                {filteredItems.length} items
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <span className="text-sm text-gray-400">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg flex items-start gap-2 bg-red-900/20 border border-red-800">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:shadow-lg hover:bg-gray-800 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-2 rounded-xl ${getItemColor(item.type)}`}>
                    {getItemIcon(item.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.content && (
                        <p className="text-sm text-gray-300 mb-2 line-clamp-3">
                          {item.content}
                        </p>
                      )}
                      {item.url && (
                        <p className="text-sm text-blue-400 mb-2">
                          {new URL(item.url).hostname}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-4 capitalize">
                  {item.type}
                </div>
                
                {item.type === 'link' && item.url && (
                  <button
                    onClick={() => window.open(item.url, '_blank')}
                    className="w-full py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </button>
                )}
                
                {item.type === 'file' && item.fileUrl && (
                  <button
                    onClick={() => window.open(item.fileUrl, '_blank')}
                    className="w-full py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View File
                  </button>
                )}
              </div>
            ))}
            
            {filteredItems.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No items yet. Add your first item!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">Add New Item</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <div className="flex gap-2">
                {['link', 'note', 'file'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setItemType(type as any)}
                    className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                      itemType === type
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
                />
              </div>

              {itemType === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
                  />
                  {formData.url && !isValidUrl(formData.url) && (
                    <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
                  )}
                </div>
              )}

              {itemType === 'note' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Content *
                  </label>
                  <textarea
                    placeholder="Enter note content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-white placeholder-gray-400"
                    rows={4}
                  />
                </div>
              )}

              {itemType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    File URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-white placeholder-gray-400"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setError(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createItem}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Add {itemType}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}