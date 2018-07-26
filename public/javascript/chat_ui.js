//function to sanitize text entered by the user(untrusted text)
function divEscapedContentElement(message) {
    return $("<div></div>").text(message);
}

//function to display trustem text(sended by the system)
function divsystemContentElement(message) {
    return $("<div></div>").html("<i>" + message + "</i>");
}

// Function to process the raw user input
function processUserInput(chatApp, socket) {
    var message = $("#send-message").val();
    var systemMessage;

    if (message.charAt(0) == "/") {                                                // If user input begins with slash, treat it as command
        systemMessage = chatApp.processCommand(message);
        if(systemMessage) {
            $("#messages").append(divsystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($("#room").text(), message);                          // Broadcast noncommand input to other users
        $("#messages").append(divEscapedContentElement(message));
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
    }
    $("#send-message").val("");
}

var socket = io.connect();

$(document).ready(function() {
    var chatApp = new Chat(socket);

    socket.on("nameResult", function(result) {                                   // Display the result of a name change attemp
        var message;

        if(result.success) {
            message = "You are now known as " + result.name + ".";
        } else {
            message = result.message;
        }
        $("#messages").append(divsystemContentElement(message));
    });

    socket.on("joinResult", function(result) {                                  // Display result of a room change
        $("#room").text(result.room);
        $("#messages").append(divsystemContentElement("Room changed."));
    });

    socket.on("message", function(message) {                                   // Display received messages
        var newElement = $("<div></div>").text(message.text);
        $("#messages").append(newElement);
    });

    socket.on("rooms", function(rooms) {                                      // Display list of rooms avaible
        $("#room-list").empty();

        for(var room in rooms) {
            room = room.substring(1, room.length);
            if(room != "") {
                $("#room-list").append(divEscapedContentElement(room));
            }
        }

        $("#room-list div").click(function() {                               // Allow click of a room name to chage to that room
            chatApp.processCommand("/join " + $(this).text());
            $("#send-message").focus();
        });
    });

    setInterval(function() {                                                // request list of rooms avaible intermittently
        socket.emit("rooms");
    }, 1000);

    $("#send-message").focus();

    $("#send-form").submit(function() {                                    // alloow submitting the form to send a chat message
        processUserInput(chatApp, socket);
        return false;
    });
});