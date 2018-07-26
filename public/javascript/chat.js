var Chat = function(socket) {
    this.socket = socket;
};


//function to send chat messages
Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room: room,
        text: text
    };
    this.socket.emit("message", message);
}

//function to chage the rooms
Chat.prototype.changeRoom = function(room) {
    this.socket.emit("join", {
        newRoom: room
    });
};

// function for joining or creating a room and for changing nickname
Chat.prototype.processCommand = function(command) {
    var words = command.split(" ");
    var command = words[0].substring(1, words[0].length).toLowerCase();                     // Parse command from first word
    var message = false;

    switch(command) {
        case "join":
            words.shift();
            var room = words.join(" ");
            this.changeRoom(room);                                                        // Handling room changing
            break;
        case "nick":
            words.shift();
            var name = words.join(" ");
            this.socket.emit("nameAttemp", name);                                         // Handle name change attemps
            break;
        default:
            message = "Unreconized command.";                                            // Return error message if command isn't reconized
            break;
    }
    return message;
};