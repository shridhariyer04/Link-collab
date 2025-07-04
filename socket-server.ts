import express from "express"
import http from "http"
import {Server} from "socket.io"

const app = express();
const server = http.createServer(app)

const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"],
    },
});

//Types

interface LinkPayload {
    boardId:string,
    collectionId:string,
    link:{
        id:string;
        title:string,
        url:string,
       createdAt?: string;
    };
}

interface UpdateLinkPayload extends LinkPayload {
    fields:Partial<{title:string, url:string}>
}


io.on("connection",(socket) =>{
    console.log("Connected",socket.id);

   
    //Join board-level room
    socket.on("join-board",(boardId:string) =>{
    socket.join(boardId);
    console.log(`${socket.id} joined board ${boardId}`)

    socket.on("add-link",(data:LinkPayload) =>{
       const {boardId,collectionId,link} = data;
      console.log(`New link in collection ${collectionId} of board${boardId}`)
     
      //Broadcast to board romm
      io.to(boardId).emit("link-added",{collectionId,link});
    })
     socket.on("update-link", (data: UpdateLinkPayload) => {
    const { boardId, collectionId, link, fields } = data;
    io.to(boardId).emit("link-updated", { collectionId, linkId: link.id, fields });
  });

  // Link Delete
  socket.on("delete-link", (data: { boardId: string; collectionId: string; linkId: string }) => {
    io.to(data.boardId).emit("link-deleted", data);
  });

  // Cleanup
  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});
})

server.listen(4000, () => {
  console.log("🚀 Socket.IO server running on http://localhost:4000");
});