var socketio = require("socket.io");
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
    io = socketio.listen(server);                                                   //Start SocketIO server, allowing it to piggyback on existing HTTP server

    io.set("log level", 1);

    io.sockets.on("connection", function(socket) {                                  // Define how each user connection will be handled
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);   // Asign user a guest name when they connect

        joinRoom(socket, "Lobby");

        handleMessageBroadcasting(socket, nickNames);                               // Handle user messages, name change attemps, and room creation/changes
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on("rooms", function() {                                              // Provide user with list of occupied rooms on request
            socket.emit("rooms", io.sockets.manager.rooms);
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

// Function to handle name changing attempts
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on("nameAttempt", function(name) {                                      // Add listenet for nameAttempt events
        if(name.indexOf("Guest") == 0) {                                           // Dont't allow nicknames to begin with Guest
            socket.emit("nameResult", {
                success: false,
                message: "Names cannot begin with 'Guest'."
            });
        } else {
            if (namesUsed.indexOf(name) == -1) {                                   // If name isn't already registered, register it
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];                               // Remove previous name to make available to other clients

                socket.emit("nameResult", {
                    success: true, 
                    name: name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit("message", {
                    text: previousName + " is now known as " + name + "."
                });
            } else {
                socket.emit("nameResult", {                                      // send error to client if name is already registered
                    success: false,
                    message: "That name is already in use."
                });
            }
        }
    });
}

// Function to relay the message
function handleMessageBroadcasting(socket) {
    socket.on("message", function(message) {
        socket.broadcast.to(message.room).emit("message", {
            text: nickNames[socket.id] + ": " + message.text
        });
    });
}

// Function to enable room changing / create a new one
function handleRoomJoining(socket) {
    socket.on("join", function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

// Function to remove the user from userNames and usedNames when user leaves the app
function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

