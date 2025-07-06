// hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import  { io,  Socket } from 'socket.io-client';

interface UseSocketOptions {
  boardId?: string;
  onLinkAdded?: (data: { collectionId: string; link: any }) => void;
  onLinkUpdated?: (data: { collectionId: string; linkId: string; fields: any }) => void;
  onLinkDeleted?: (data: { boardId: string; collectionId: string; linkId: string }) => void;
  onCollectionAdded?: (data: { boardId: string; collection: any }) => void;
  onCollectionUpdated?: (data: { boardId: string; collectionId: string; fields: any }) => void;
  onCollectionDeleted?: (data: { boardId: string; collectionId: string }) => void;
  onBoardAdded?: (data: { board: any }) => void;
  onBoardUpdated?: (data: { boardId: string; fields: any }) => void;
  onBoardDeleted?: (data: { boardId: string }) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Initialize socket connection
   const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"],
});
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🟢 Connected to socket server');
      setIsConnected(true);
      
      // Auto-join board room if boardId is provided
      if (optionsRef.current.boardId) {
        newSocket.emit('join-board', optionsRef.current.boardId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Disconnected from socket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    // Link event handlers
    newSocket.on('link-added', (data) => {
      optionsRef.current.onLinkAdded?.(data);
    });

    newSocket.on('link-updated', (data) => {
      optionsRef.current.onLinkUpdated?.(data);
    });

    newSocket.on('link-deleted', (data:any) => {
      optionsRef.current.onLinkDeleted?.(data);
    });

    // Collection event handlers
    newSocket.on('collection-added', (data) => {
      optionsRef.current.onCollectionAdded?.(data);
    });

    newSocket.on('collection-updated', (data) => {
      optionsRef.current.onCollectionUpdated?.(data);
    });

    newSocket.on('collection-deleted', (data) => {
      optionsRef.current.onCollectionDeleted?.(data);
    });

    // Board event handlers
    newSocket.on('board-added', (data) => {
      optionsRef.current.onBoardAdded?.(data);
    });

    newSocket.on('board-updated', (data) => {
      optionsRef.current.onBoardUpdated?.(data);
    });

    newSocket.on('board-deleted', (data) => {
      optionsRef.current.onBoardDeleted?.(data);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join board room
  const joinBoard = (boardId: string) => {
    if (socket && isConnected) {
      socket.emit('join-board', boardId);
    }
  };

  // Emit link events
  const emitLinkAdded = (data: { boardId: string; collectionId: string; link: any }) => {
    if (socket && isConnected) {
      socket.emit('add-link', data);
    }
  };

  const emitLinkUpdated = (data: { boardId: string; collectionId: string; link: any; fields: any }) => {
    if (socket && isConnected) {
      socket.emit('update-link', data);
    }
  };

  const emitLinkDeleted = (data: { boardId: string; collectionId: string; linkId: string }) => {
    if (socket && isConnected) {
      socket.emit('delete-link', data);
    }
  };

  // Emit collection events
  const emitCollectionAdded = (data: { boardId: string; collection: any }) => {
    if (socket && isConnected) {
      socket.emit('collection-created', data);
    }
  };

  const emitCollectionUpdated = (data: { boardId: string; collectionId: string; fields: any }) => {
    if (socket && isConnected) {
      socket.emit('collection-updated', data);
    }
  };

  const emitCollectionDeleted = (data: { boardId: string; collectionId: string }) => {
    if (socket && isConnected) {
      socket.emit('collection-deleted', data);
    }
  };

  // Emit board events
  const emitBoardAdded = (data: { board: any }) => {
    if (socket && isConnected) {
      socket.emit('board-created', data);
    }
  };

  const emitBoardUpdated = (data: { boardId: string; fields: any }) => {
    if (socket && isConnected) {
      socket.emit('board-updated', data);
    }
  };

  const emitBoardDeleted = (data: { boardId: string }) => {
    if (socket && isConnected) {
      socket.emit('board-deleted', data);
    }
  };

  return {
    socket,
    isConnected,
    joinBoard,
    emitLinkAdded,
    emitLinkUpdated,
    emitLinkDeleted,
    emitCollectionAdded,
    emitCollectionUpdated,
    emitCollectionDeleted,
    emitBoardAdded,
    emitBoardUpdated,
    emitBoardDeleted,
  };
};