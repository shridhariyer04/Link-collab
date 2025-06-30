// FILE: app/board/[boardId]/collection/[id]/page.tsx

"use client";
import { useEffect, useState } from "react";

export default function CollectionPage({ params }: { params: { boardId: string; id: string } }) {
  const { boardId, id: collectionId } = params;

  const [url, setUrl] = useState("");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchLinks() {
    const res = await fetch(`/api/boards/${boardId}/collections/${collectionId}/links`);
    const data = await res.json();
    setLinks(data.links || []);
  }

  useEffect(() => {
    fetchLinks();
  }, [collectionId]);

  async function handleAdd() {
    if (!url.trim()) return;
    setLoading(true);
    await fetch(`/api/boards/${boardId}/collections/${collectionId}/links`, {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
    });
    setUrl("");
    await fetchLinks();
    setLoading(false);
  }

  async function handleDelete(linkId: string) {
    await fetch(`/api/boards/${boardId}/collections/${collectionId}/links/${linkId}`, {
      method: "DELETE",
    });
    await fetchLinks();
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Links in Collection</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border px-4 py-2 w-full rounded"
          type="text"
          placeholder="Paste link URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      <ul className="space-y-4">
        {links.map((link: any) => (
          <li key={link.id} className="border p-4 rounded flex justify-between items-start">
            <div>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                {link.title || link.url}
              </a>
              {link.description && (
                <p className="text-sm text-gray-600 mt-1">{link.description}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(link.id)}
              className="text-red-500 hover:underline text-sm"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
