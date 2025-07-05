"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Search, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
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
  description?: string;
  favicon?: string;
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
  const [linkDescription, setLinkDescription] = useState<string>('');
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
        console.log('API Response:', data);
        console.log('Links array:', data.links);
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
        body: JSON.stringify({ 
          title: linkTitle, 
          url: linkUrl, 
          description: linkDescription 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newLink = data.link;
        
        // Update local state immediately for better UX
        setLinks(prev => [...prev, newLink]);
        setLinkTitle('');
        setLinkUrl('');
        setLinkDescription('');
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

  const updateLink = async (linkId: string, fields: Partial<{ title: string; url: string; description: string }>): Promise<void> => {
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
      (link.url && link.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ) : [];

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, action: () => void): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, linkId: string, field: 'title' | 'url' | 'description'): void => {
    const value = e.target.value.trim();
    if (value || field === 'description') {
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

  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://${domain}/favicon.ico`;
    } catch {
      return '';
    }
  };

  const getDisplayUrl = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/boards/${boardId}/collections`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {collection?.name || 'My Collection'}
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredLinks.length} curated links
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
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredLinks.map((link) => (
              <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    {link.favicon ? (
                      <img 
                        src={link.favicon} 
                        alt="Site icon" 
                        className="w-5 h-5"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getFaviconUrl(link.url);
                        }}
                      />
                    ) : (
                      <img 
                        src={getFaviconUrl(link.url)} 
                        alt="Site icon" 
                        className="w-5 h-5"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {editingItem === link.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          defaultValue={link.title}
                          onBlur={(e) => handleInputBlur(e, link.id, 'title')}
                          onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { title: (e.target as HTMLInputElement).value }))}
                          className="w-full text-base font-semibold border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Link title"
                        />
                        <input
                          type="url"
                          defaultValue={link.url}
                          onBlur={(e) => handleInputBlur(e, link.id, 'url')}
                          onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { url: (e.target as HTMLInputElement).value }))}
                          className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com"
                        />
                        <textarea
                          defaultValue={link.description || ''}
                          onBlur={(e) => handleInputBlur(e, link.id, 'description')}
                          onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { description: (e.target as HTMLTextAreaElement).value }))}
                          className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          placeholder="Description (optional)"
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {link.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                          {getDisplayUrl(link.url)}
                        </p>
                        {link.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {link.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => setEditingItem(editingItem === link.id ? null : link.id)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => window.open(link.url, '_blank')}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </button>
                </div>
              </div>
            ))}
            
            {filteredLinks.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No links yet</p>
                <p className="text-gray-400">Add your first link to get started!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Add New Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Link title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {linkUrl && !isValidUrl(linkUrl) && (
                  <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the link (optional)"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkTitle('');
                  setLinkUrl('');
                  setLinkDescription('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createLink}
                disabled={!linkTitle.trim() || !linkUrl.trim() || !isValidUrl(linkUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
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