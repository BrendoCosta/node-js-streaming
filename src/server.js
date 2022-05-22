const express = require("express");
const app  = express().use(express.static(__dirname + "/"));
const http = require("http").Server(app);
const io   = require("socket.io")(http);
const PORT = 3000;
const DEBUG_MODE = false;

app.get("/", (req, res) => {

    res.sendFile(__dirname + "/index.html");

});

io.on("connection", (socket) => {
    
    socket.on("videoInputToServer", data => {

        /* 
         * You can do anything with the input video here,
         * but we will simply send it back to the client.
        */

        DEBUG_MODE ? console.log("SERVER: Packet received from CLIENT at " + new Date()) : null ;

        io.emit("videoOutputFromServer", data);
        
        DEBUG_MODE ? console.log("SERVER: Packet sent to CLIENT at " + new Date()) : null ;

    });
});

http.listen(PORT, () => {

    console.log(`SERVER: HTTP server running at http://localhost:${PORT}/`);
    
});