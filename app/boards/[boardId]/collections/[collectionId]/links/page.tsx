"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Link as LinkIcon, Search, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

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
  url: string;
  collectionId: string;
  createdBy: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  [key: string]: T;
}

const LinksPage: React.FC = () => {
  const [board, setBoard] = useState<Board | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;
  const collectionId = params.collectionId as string;

  useEffect(() => {
    if (boardId && collectionId) {
      fetchBoard();
      fetchCollection();
      fetchLinks();
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
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    }
    setIsLoading(false);
  };

  const createLink = async (): Promise<void> => {
    if (!linkUrl.trim()) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl })
      });
      
      if (response.ok) {
        await fetchLinks();
        setLinkUrl('');
        setShowLinkModal(false);
      }
    } catch (error) {
      console.error('Error creating link:', error);
    }
  };

  const deleteLink = async (linkId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links/${linkId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchLinks();
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const filteredLinks = links.filter(link => 
    link.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void): void => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
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
              <div key={link.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        {getDomainFromUrl(link.url)}
                      </span>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all text-sm leading-relaxed"
                      title={link.url}
                    >
                      {link.url.length > 60 ? `${link.url.substring(0, 60)}...` : link.url}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => window.open(link.url, '_blank')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No links yet. Add your first link!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Link</h2>
            <input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => handleKeyPress(e, createLink)}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksPage;