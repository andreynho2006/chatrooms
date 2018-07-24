var socketio = require("socket.io");
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
    io = socketio.listen(server);                                                   //Start SocketIO server, allowing it to piggyback on existing HTTP server

    io.serveClient("log level", 1);

    io.sockets.on("connection", function(socket) {                                  // Define how each user connection will be handled
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);   // Asign user a guest name when they connect

        joinRoom(socket, "Lobby");

        handleMessageBroadcasting(socket, nickNames);                               // Handle user messages, name change attemps, and room creation/changes
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on("rooms", function() {                                              // Provide user with list of occupied rooms on request
            socket.emit("rooms", io.socket.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);                     // Define cleanup logic for when user disconects
    });
};