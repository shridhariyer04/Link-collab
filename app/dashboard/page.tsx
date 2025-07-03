"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, FolderOpen, Link as LinkIcon, Search, ArrowLeft } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

// Type definitions
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

const BoardsApp: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states
  const [showBoardModal, setShowBoardModal] = useState<boolean>(false);
  const [showCollectionModal, setShowCollectionModal] = useState<boolean>(false);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Form states
  const [boardName, setBoardName] = useState<string>('');
  const [collectionName, setCollectionName] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

 
  // Fetch boards on component mount
  useEffect(() => {
    fetchBoards();
  }, []);

  // Fetch collections when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetchCollections(selectedBoard.id);
    }
  }, [selectedBoard]);

  // Fetch links when collection is selected
  useEffect(() => {
    if (selectedCollection) {
      fetchLinks(selectedCollection.boardId, selectedCollection.id);
    }
  }, [selectedCollection]);

  // API Functions
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
        if (selectedBoard?.id === boardId) {
          setSelectedBoard(null);
          setCollections([]);
        }
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const fetchCollections = async (boardId: string): Promise<void> => {
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
    if (!collectionName.trim() || !selectedBoard) return;
    
    try {
      const response = await fetch(`/api/boards/${selectedBoard.id}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: collectionName })
      });
      
      if (response.ok) {
        await fetchCollections(selectedBoard.id);
        setCollectionName('');
        setShowCollectionModal(false);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const updateCollection = async (boardId: string, collectionId: string, name: string): Promise<void> => {
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (response.ok) {
        await fetchCollections(boardId);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  };

  const deleteCollection = async (boardId: string, collectionId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}/collections/${collectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchCollections(boardId);
        if (selectedCollection?.id === collectionId) {
          setSelectedCollection(null);
          setLinks([]);
        }
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const fetchLinks = async (boardId: string, collectionId: string): Promise<void> => {
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
    if (!linkUrl.trim() || !selectedCollection) return;
    
    try {
      const response = await fetch(`/api/boards/${selectedCollection.boardId}/collections/${selectedCollection.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl })
      });
      
      if (response.ok) {
        await fetchLinks(selectedCollection.boardId, selectedCollection.id);
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
      const response = await fetch(`/api/boards/${selectedCollection!.boardId}/collections/${selectedCollection!.id}/links/${linkId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchLinks(selectedCollection!.boardId, selectedCollection!.id);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const filteredItems = <T extends { name?: string; url?: string }>(items: T[]): T[] => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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
              {selectedCollection && (
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              {selectedBoard && !selectedCollection && (
                <button
                  onClick={() => setSelectedBoard(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedCollection ? selectedCollection.name : 
                 selectedBoard ? selectedBoard.name : 'My Boards'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {selectedCollection ? (
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Link</span>
                </button>
              ) : selectedBoard ? (
                <button
                  onClick={() => setShowCollectionModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Collection</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowBoardModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Board</span>
                </button>
              )}
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
        ) : selectedCollection ? (
          // Links View
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems(links).map((link) => (
              <div key={link.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-500">Link</span>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {link.url}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => window.open(link.url, '_blank')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredItems(links).length === 0 && (
              <div className="col-span-full text-center py-12">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No links yet. Add your first link!</p>
              </div>
            )}
          </div>
        ) : selectedBoard ? (
          // Collections View
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems(collections).map((collection) => (
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
                            onBlur={(e) => handleInputBlur(e, (value) => updateCollection(selectedBoard.id, collection.id, value))}
                            onKeyPress={(e) => handleKeyPress(e, () => updateCollection(selectedBoard.id, collection.id, (e.target as HTMLInputElement).value))}
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
                        onClick={() => deleteCollection(selectedBoard.id, collection.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCollection(collection)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Open Collection
                  </button>
                </div>
              </div>
            ))}
            
            {filteredItems(collections).length === 0 && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No collections yet. Create your first collection!</p>
              </div>
            )}
          </div>
        ) : (
          // Boards View
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems(boards).map((board) => (
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
                    onClick={() => setSelectedBoard(board)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Open Board
                  </button>
                </div>
              </div>
            ))}
            
            {filteredItems(boards).length === 0 && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No boards yet. Create your first board!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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

export default BoardsApp;