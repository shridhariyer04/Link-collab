"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Search, ArrowLeft, Wifi, WifiOff, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  
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
     const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
       transports: ["websocket"],
     });
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
      } else {
        setError(`Failed to fetch board: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching board:', error);
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
      console.error('Error fetching collection:', error);
      setError('Network error fetching collection. Please try again.');
    }
  };

  const fetchLinks = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links`);
      if (response.ok) {
        const data: ApiResponse<Link[]> = await response.json();
        console.log('API Response:', data);
        console.log('Links array:', data.links);
        setLinks(data.links || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to fetch links: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
      setError('Network error fetching links. Please try again.');
    }
    setIsLoading(false);
  };

  const createLink = async (): Promise<void> => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setError("Link title and URL are required");
      return;
    }
    
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
        setError(null);
        
        // Emit link creation event for real-time sync
        if (socket && isConnected) {
          socket.emit('add-link', {
            boardId,
            collectionId,
            link: newLink
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create link");
      }
    } catch (error) {
      console.error('Error creating link:', error);
      setError("Network error creating link. Please try again.");
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update link");
      }
    } catch (error) {
      console.error('Error updating link:', error);
      setError("Network error updating link. Please try again.");
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete link");
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      setError("Network error deleting link. Please try again.");
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Page Header */}
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
                {collection?.name || 'Links'}
              </h1>
              <p className="text-sm text-gray-400">
                {filteredLinks.length} curated links
              </p>
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
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Link
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

        {/* Links Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link) => (
              <div key={link.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:shadow-lg hover:bg-gray-800 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-blue-900/30 rounded-xl">
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
                          className="w-full text-base font-semibold bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                          placeholder="Link title"
                        />
                        <input
                          type="url"
                          defaultValue={link.url}
                          onBlur={(e) => handleInputBlur(e, link.id, 'url')}
                          onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { url: (e.target as HTMLInputElement).value }))}
                          className="w-full text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                          placeholder="https://example.com"
                        />
                        <textarea
                          defaultValue={link.description || ''}
                          onBlur={(e) => handleInputBlur(e, link.id, 'description')}
                          onKeyPress={(e) => handleKeyPress(e, () => updateLink(link.id, { description: (e.target as HTMLTextAreaElement).value }))}
                          className="w-full text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-white"
                          rows={3}
                          placeholder="Description (optional)"
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
                          {link.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {getDisplayUrl(link.url)}
                        </p>
                        {link.description && (
                          <p className="text-sm text-gray-300 line-clamp-3">
                            {link.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem(editingItem === link.id ? null : link.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-4">
                  Link
                </div>
                
                <button
                  onClick={() => window.open(link.url, '_blank')}
                  className="w-full py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link
                </button>
              </div>
            ))}
            
            {filteredLinks.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <ExternalLink className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No links yet. Add your first link!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Add New Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Link title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
                />
                {linkUrl && !isValidUrl(linkUrl) && (
                  <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the link (optional)"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-white placeholder-gray-400"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkTitle('');
                  setLinkUrl('');
                  setLinkDescription('');
                  setError(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createLink}
                disabled={!linkTitle.trim() || !linkUrl.trim() || !isValidUrl(linkUrl)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Link
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