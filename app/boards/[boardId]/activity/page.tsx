"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Activity = {
  id: string;
  boardId: string;
  collectionId: string | null;
  itemId: string | null;
  userId: string;
  action: string;
  message: string;
  createdAt: string;
};

export default function ActivityLogPage() {
  const params = useParams();
  const boardId = params.boardId as string;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      if (!boardId) {
        setError("Board ID not found");
        setLoading(false);
        return;
      }

      // Validate boardId format (should be UUID)
      if (typeof boardId !== 'string' || boardId.length < 10) {
        setError("Invalid board ID format");
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching activities for board:', boardId);
        const url = `/api/boards/${boardId}/activities`;
        console.log('Fetching from URL:', url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Fetch error:', res.status, errorText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Received data:', data);
        
        setActivities(data.activities || data.logs || []); // Handle different response formats
        setError(null);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch activities");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [boardId]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">📜 Activity Log</h1>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">Loading activity...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">📜 Activity Log</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <p className="text-red-600 text-sm mt-1">Board ID: {boardId}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📜 Activity Log</h1>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No activity found yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Activities will appear here as you and others interact with the board.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-800">{log.message}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  Action: {log.action}
                </span>
                <span className="text-xs text-gray-500">
                  🕓 {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {log.collectionId && (
                <div className="text-xs text-gray-400 mt-1">
                  Collection: {log.collectionId}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}