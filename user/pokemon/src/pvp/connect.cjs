var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let connections = [];

function originIsAllowed(origin) {
    return true;
}

wsServer.on('request', function(request) {
    if (request.requestedProtocols.indexOf('echo-protocol') === -1) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected due to incorrect protocol.');
        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connections.push(connection);

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            
            connections.forEach(function(conn) {
                if (conn != connection) {
                    conn.sendUTF(message.utf8Data);                  }
            });
        } else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            
            connections.forEach(function(conn) {
                if (conn !== connection) {
                    conn.sendBytes(message.binaryData);                }
            });
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        
        connections = connections.filter(conn => conn !== connection);
    });
});
