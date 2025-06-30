import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import BoardCard from "../components/BoardCard";
import { PlusIcon } from "lucide-react";

export default function DashboardPage(){
    const {user} = useUser();
    const [board, setBoards] = useState<any[]>([]);
    const [loading,setLoading] = useState(true);

    useEffect(() =>{
        fetch('/api/boards')
        .then(res =>res.json())
        .then(data =>setBoards(data.boards ??{}))
        .finally(() =>setLoading(false));
    },[])


    async function createBoard(){
        const name = prompt("Enter your name");
        if(!name) return;

        const res = await fetch("/api/boards",{
            method:"POST",
            body:JSON.stringify({name}),
        })
          const data = await res.json();
          setBoards(prev =>[...[prev],{id:data.boardId,name}]);
    }

    return(
        <main className="p-6">
            <div>
                <h1></h1>
                <button onClick={createBoard}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                    <PlusIcon className="w-4 h-4"/>
                    NewBoard
                </button>
            </div>
            {loading ?(
                <p>Loading...</p>
            ):board.length ===0 ?(
                <p className="text-gray-500">No boards yet</p>
            ):(
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {board.map(board =>(
                        <BoardCard key={board.id} board={board}/>
                    ))}
                </div>
            )}
        </main>
    )
  


}
