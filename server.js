var express = require('express')
        , http = require('http')
        , fs = require('fs')
        , path = require('path')
        , winston = require('winston')
        , io = require('socket.io')
        , nodeDrpc = require('node-drpc')
        , nodeDrpcClient =  new  nodeDrpc( "localhost", 3772, 10000)
        , redis = require("redis")
        , redisClient = redis.createClient(6379, "localhost");
;

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'local';
}

// Logging
var logger = new (winston.Logger)({transports: [new (winston.transports.Console)({colorize: true})]});

// Load configurations
var env = process.env.NODE_ENV
        , nconf = require('nconf');

// merge nconf overrides with the configuration file.
nconf.argv().env().file({file: env + '.json'});
nconf.set('approot', __dirname); // set approot root

var app = express();
app.use(express.static(__dirname + '/public/app'))
//set up routes
app.get("/", function(req, res) {
    console.log("returning index.html");
    res.sendfile("public/app/index.html");
});

app.get("/tallyQuery", function(req, res) {
    console.log("tallyQuery: "+JSON.stringify(req.query));
//    res.sendfile("public/app/index.html");
    nodeDrpcClient.execute( "tallyQuery", req.query.tallyName+" "+req.query.startTime, function(err, response) {
        console.log("response: "+response);
        var responseJson = eval(response);
        res.send(responseJson[0][4]);
    });
    
    
//    res.send("tallyQuery")
});

// Bootstrap models
var modelsPath = path.normalize(path.join(__dirname, '/app/models'));
fs.readdirSync(modelsPath).forEach(function(file) {
    require(path.join(modelsPath, file));
});

// load express settings
require('./configs/express')(app, nconf, express, logger);

// Bootstrap routes
require('./configs/routes')(app);


// start server
var server = http.createServer(app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
server.listen(80);
var sio = io.listen(server);
sio.sockets.on('connection', function(socket) {
    console.log("socket id: " + socket.id);
    socket.on('join', function(data) { // receiving alerts
// console.log("User join: " + JSON.stringify(data));

        console.log("New socket.io connection: " + socket.id);
//        var sessionCtrl = new sessionController(socket.id, redisClient);
//        socket.set('sessionController', sessionCtrl);
//        sessionCtrl.subscribe(socket);

    });

    socket.on('disconnect', function(data) {
        console.log("Some one left ");

        socket.get('sessionController', function(err, sessionController) {
            if (sessionController !== null) {
                sessionController.unsubscribe();
            }
        });

    });
});

redisClient.subscribe("TRACKS");

redisClient.on("message", function(channel, message) {
    console.log("Received message on channel: " + channel);
    if (sio.sockets) {
        sio.sockets.emit('TRACKS', JSON.parse(message));
    } else {
        console.log("io.sockets is null")
    }
});
