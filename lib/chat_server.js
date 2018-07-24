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

//Function to assign a guest name
function assignGuestName(socket, guestNumber, nickNames, namesUsed) { 
    var name = "Guest" + guestNumber;                                               // Generate new guest name
    nickNames[socket.id] = name;                                                    // Associate guest name with client connection ID
    socket.emit("nameResult", {                                                     // Let user know their guest name
        success: true,
        name: name
    });
    namesUsed.push(name);                                                           // Note that guest name is now used
    return guestNumber + 1;                                                         // Increment counter used to generate guest names
}

// function to join a room
function joinRoom(socket, room) {
    socket.join(room);                                                              // Make user join room
    currentRoom[socket.id] = room;                                                  // User is now in the room
    socket.emit("joinResult", {room: room});                                        // Let user know that they are now in new room
    socket.broadcast.to(room).emit("message", {                                     // Let other users know that user has joined
        text: nickNames[socket.id] + " has joined " + room + "."
    });

    var usersInRoom = io.sockets.clients(room);                                     // Determine what other users are in same room as user
    if(usersInRoom.length > 1) {                                                    // If other users exist, summarize who they are
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});                        // Send summary of other users in the room to the user
    }
}