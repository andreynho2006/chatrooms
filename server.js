var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var cache = {};

// error responses
function send404(response) {
    response.writeHead(404, {'Content-type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

//sending files
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200, {'content-type': mime.lookup(path.basename(filePath)) } 
    );
    response.end(fileContents);
}

//serve static files from cache  memory
function serveStatic(response, cache, absPath) {
    if(cache[absPath]) {                                              //check if file is cached in memory
        sendFile(response, absPath, cache[absPath]);                  //serve file from memory
    } else {
        fs.exists(absPath, function(exists) {                         //check if file exists
            if(exists) {
                fs.readFile(absPath, function(err, data) {            //read file from disk
                    if(err) {
                        send404(response);
                    } else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);            //serve file read from disk
                    }
                });
            } else {
                send404(response);                                    //send 404 HTTP response
            }
        });
    }
}

//create the HTTP server
var server = http.createServer(function(request, response) {           //create HTTP server, using anonymous function to define per-request behaviour
    var filePath = false;

    if(request.url == "/") {
        filePath = "public/index.html";                                //determine HTML file to be served by default
    } else {
        filePath = "public" + request.url;                             //translate URL path to reltive file path
    }

    var absPath = "./" + filePath;
    serveStatic(response, cache, absPath);                            // serve static file
});


server.listen(3000, function() {
    console.log("Server listening on port 3000.");
});

var chatServer = require('./lib/chat_server');                       //loads functionality from a custom node module
chatServer.listen(server);
