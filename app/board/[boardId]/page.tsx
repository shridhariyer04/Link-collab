import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollectionCard from "../../components/CollectionCard";
import { PlusIcon } from "lucide-react";

export default function BoardPage() {
  const { id: boardId } = useParams();
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/boards/${boardId}/collections`)
      .then(res => res.json())
      .then(data => setCollections(data.collections ?? []))
      .finally(() => setLoading(false));
  }, [boardId]);

  async function createCollection() {
    const name = prompt("Enter collection name");
    if (!name) return;

    const res = await fetch(`/api/boards/${boardId}/collections`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setCollections(prev => [...prev, { id: data.collectionId, name }]);
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Collections</h1>
        <button
          onClick={createCollection}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : collections.length === 0 ? (
        <p className="text-gray-500">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              boardId={boardId as string}
              onDelete={() =>
                setCollections(prev => prev.filter(c => c.id !== collection.id))
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
