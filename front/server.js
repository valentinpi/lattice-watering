"use strict";

//Webserver
var express = require('express');
var app = require("express")();
var http = require('http').Server(app);
var morgan = require('morgan');
var engines = require('consolidate');
var bodyParser = require('body-parser');

//Websocket
var io = require('socket.io')(http);

//COAP
var coap = require('coap');
var URL = require('url');
var request = require('coap').request;
var Agent = require('coap').Agent;
var url;

var debug = false;

url = URL.parse('coap://localhost:5683/sensor');
url.method = 'GET';
url.observe = true;

app.use(morgan('dev'));
app.set('views', __dirname + '/views');
app.engine('html', engines.mustache);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/plantView', function (req, res) {
    //res.sendFile('public/plantView.html')
    res.render('./plantView.html')
});

app.get('/', function (req, res) {
    res.render('./index.html');
});

app.post('/pumpToggle', function (req, res) {
    var ip = req.body.pumpIP;
    var pumpStateChange = 'On';
    if (req.body.pumpOn) {
        console.log('Turning pump on at ip: ' + ip);
        pumpStateChange = 'On';
    } else {
        console.log('Turning pump off at ip: ' + ip);
        pumpStateChange = 'Off';
    }
    //Send info to input IP with payload pumpOn/pumpOff
    const _req = coap.request('coap://[' + ip + ']/');
    const payload = {
        title: 'pump' + pumpStateChange
    }
    _req.write(JSON.stringify(payload));
    _req.end()

    res.status(204).send();
});

var mysocket;

http.listen(3000, function () {
    console.log('listening on port 3000 for frontend requests');
});

var server = coap.createServer();

server.on('request', (req, res) => {
    res.end('Hello ' + req.url.split('/')[1] + '\n')
});

server.listen(() => {
    console.log('listening on port 5683 for coap requests');
});

/*//Momentan unn�tig aber vlt brauch mans ja noch
io.on('connection', function (socket) {

    io.emit('info', 'connection to websocketserver succesfully established');
    console.log('info: a user connected to the websocket server');


    var req;
    mysocket = socket;
    socket.on('coap', function (msg) {

        console.log('Received a new coap request with options: ' + msg);

        var config = JSON.parse(msg);
        url = URL.parse(config.url);
        url.method = config.method;
        url.observe = config.observe;

        req = request(url).on('response', transmitResponse);
        req.end();
        process.stdin.pipe(req);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

var transmitResponse = function (res) {

    res.on('data', function (data) {

        mysocket.on('cancel', function (msg) {
            console.log("Tried to cancel");
            res.close();
        });

        var strData = data.toString('utf-8');
        var payload = JSON.parse(strData);

        if (debug) {
            var sensorServerTime = new Date(payload.timestamps[0]);
            var webServerTime = new Date();

            var sensorServerTimeOutput = sensorServerTime.getHours() + ":" + sensorServerTime.getMinutes() + ":" + sensorServerTime.getSeconds() + "." + sensorServerTime.getMilliseconds();
            var webServerTimeOutput = webServerTime.getHours() + ":" + sensorServerTime.getMinutes() + ":" + sensorServerTime.getSeconds() + "." + sensorServerTime.getMilliseconds();
            var delay = webServerTime - sensorServerTime;
            console.log(sensorServerTimeOutput + ": Received a chunk from: " + webServerTimeOutput + " --> Delay: " + delay + " ms");
        }

        payload.timestamps.push(new Date().getTime());
        io.emit('coap', JSON.stringify(payload));

    });

    res.on('end', function () {
        console.log('Stream ended!');
    });

    if (!res.payload.length) process.exit(0);
};
*/