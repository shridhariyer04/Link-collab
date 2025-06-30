"use client";

import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CollectionCard({
  collection,
  boardId,
  onDelete,
}: {
  collection: any;
  boardId: string;
  onDelete: () => void;
}) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = confirm("Delete this collection?");
    if (!confirmed) return;

    await fetch(`/api/boards/${boardId}/collections/${collection.id}`, {
      method: "DELETE",
    });

    onDelete(); // remove from UI
  };

  return (
    <div
      onClick={() => router.push(`/board/${boardId}/collection/${collection.id}`)}
      className="bg-white p-4 rounded shadow hover:bg-gray-50 cursor-pointer relative"
    >
      <h2 className="font-semibold text-lg">{collection.name}</h2>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded"
      >
        <TrashIcon className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}
