"use client"

import { TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export  default function BoardCard({board}:{board:any}){
    const router = useRouter();

    const handleDelete = async(e:React.MouseEvent) =>{
     e.stopPropagation();

     const confirmed = confirm("Delete this board");

     if(!confirmed) return;

     await fetch(`/api/boards/${board.id}`,{method:"DELETE"});
      
     router.refresh();
    }

    return(
        <div
        className="bg-white p-4 shadow rouned-lg hover:bg-gray-50 cursor-pointer relative"
        onClick={() =>router.push(`/board/${board.id}`)}
        >
            <h2 className="text-lg font-semibold">{board.name}</h2>
            <button onClick={handleDelete} className="absolute top-2 right-2 p-1 rounded hover:bg-red-100">
                <TrashIcon className="s-4 h-4 text-red-500"/>
            </button>
        </div>
    );
}