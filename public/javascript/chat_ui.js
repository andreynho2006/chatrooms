//function to sanitize text entered by the user(untrusted text)
function divEscapedContentElement(message) {
    return $("<div></div>").text(message);
}

//function to display trustem text(sended by the system)
function divsystemContentElement(message) {
    return $("<div></div>").html("<i>" + message + "</i>");
}