"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Search, ArrowLeft, Wifi, WifiOff, Link2 } from 'lucide-react';
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

interface Link {
  id: string;
  title: string;
  url: string;
  collectionId: string;
  createdBy: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

export default function LinksPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;
  const collectionId = params.collectionId as string;

  useEffect(() => {
    if (boardId && collectionId) {
      fetchBoard();
      fetchCollection();
      fetchLinks();
      
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

      // Listen for real-time link updates
      newSocket.on('link-added', (data: { collectionId: string; link: Link }) => {
        if (data.collectionId === collectionId) {
          setLinks(prev => [...prev, data.link]);
        }
      });

      newSocket.on('link-updated', (data: { collectionId: string; linkId: string; fields: Partial<Link> }) => {
        if (data.collectionId === collectionId) {
          setLinks(prev => prev.map(link => 
            link.id === data.linkId 
              ? { ...link, ...data.fields }
              : link
          ));
        }
      });

      newSocket.on('link-deleted', (data: { boardId: string; collectionId: string; linkId: string }) => {
        if (data.collectionId === collectionId) {
          setLinks(prev => prev.filter(link => link.id !== data.linkId));
        }
      });

      // Cleanup on unmount
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
      }
    } catch (error) {
      console.error('Error fetching board:', error);
    }
  };

  const fetchCollection = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data.collection);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
    }
  };

  const fetchLinks = async (): Promise<void> => {
  setIsLoading(true);
  try {
    const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links`);
    if (response.ok) {
      const data: ApiResponse<Link[]> = await response.json();
      console.log('API Response:', data); // Debug log
      console.log('Links array:', data.links); // Debug log
      setLinks(data.links || []);
    }
  } catch (error) {
    console.error('Error fetching links:', error);
  }
  setIsLoading(false);
};

  const createLink = async (): Promise<void> => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: linkTitle, url: linkUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newLink = data.link;
        
        // Update local state immediately for better UX
        setLinks(prev => [...prev, newLink]);
        setLinkTitle('');
        setLinkUrl('');
        setShowLinkModal(false);
        
        // Emit link creation event for real-time sync
        if (socket && isConnected) {
          socket.emit('add-link', {
            boardId,
            collectionId,
            link: newLink
          });
        }
      }
    } catch (error) {
      console.error('Error creating link:', error);
    }
  };

  const updateLink = async (linkId: string, fields: Partial<{ title: string; url: string }>): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      
      if (response.ok) {
        // Update local state immediately
        setLinks(prev => prev.map(link => 
          link.id === linkId ? { ...link, ...fields } : link
        ));
        setEditingItem(null);
        
        // Emit link update event for real-time sync
        if (socket && isConnected) {
          const updatedLink = links.find(link => link.id === linkId);
          if (updatedLink) {
            socket.emit('update-link', {
              boardId,
              collectionId,
              link: { ...updatedLink, ...fields },
              fields
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  const deleteLink = async (linkId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links/${linkId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Update local state immediately
        setLinks(prev => prev.filter(link => link.id !== linkId));
        
        // Emit link deletion event for real-time sync
        if (socket && isConnected) {
          socket.emit('delete-link', {
            boardId,
            collectionId,
            linkId
          });
        }
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

 const filteredLinks = Array.isArray(links) ? links.filter(link => 
  link && 
  typeof link === 'object' && 
  (
    (link.title && link.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (link.url && link.url.toLowerCase().includes(searchTerm.toLowerCase()))
  )
) : [];

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void): void => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>, linkId: string, field: 'title' | 'url'): void => {
    const value = e.target.value.trim();
    if (value) {
      updateLink(linkId, { [field]: value });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/boards/${boardId}/collections`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {collection?.name || 'Links'}
                </h1>
                <p className="text-sm text-gray-500">
                  {board?.name} • Collection Links
                </p>
              </div>
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowLinkModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Link</span>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLinks.map((link) => (
              <div key={link.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Link2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingItem === link.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={link.title}
                              onBlur={(e) => handleInputBlur(e, link.id, 'title')}
                              onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { title: (e.target as HTMLInputElement).value }))}
                              className="w-full text-lg font-semibold border rounded px-2 py-1"
                              placeholder="Link title"
                            />
                            <input
                              type="url"
                              defaultValue={link.url}
                              onBlur={(e) => handleInputBlur(e, link.id, 'url')}
                              onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { url: (e.target as HTMLInputElement).value }))}
                              className="w-full text-sm border rounded px-2 py-1"
                              placeholder="https://example.com"
                            />
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{link.title}</h3>
                            <p className="text-sm text-gray-500 truncate">{link.url}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => setEditingItem(editingItem === link.id ? null : link.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(link.url, '_blank')}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Link</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No links yet. Add your first link!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Link</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Link title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {linkUrl && !isValidUrl(linkUrl) && (
                <p className="text-red-500 text-sm">Please enter a valid URL</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkTitle('');
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createLink}
                disabled={!linkTitle.trim() || !linkUrl.trim() || !isValidUrl(linkUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}