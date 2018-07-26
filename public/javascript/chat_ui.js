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
        chatapp.sendMessages($("#room").text(), message);                          // Broadcast noncommand input to other users
        $("#messages").append(divEscapedContentElement(message));
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
    }
    $("#send-message").val("");
}