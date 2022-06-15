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
    const coap_req = coap.request({ hostname: ip, confirmable: false });
    const payload = {
        title: 'pump' + pumpStateChange
    }
    coap_req.write(JSON.stringify(payload));
    coap_req.end();

    coap_req.on('response', (res) => {
        res.pipe(process.stdout)
        res.on('end', () => {
            process.exit(0);
        })
    })
    res.status(204).send();
});

app.listen(3000, () => {
    console.log('listening on port 3000 for frontend requests');
});

var server = coap.createServer();

server.on('request', (req, res) => {
    console.log('server received coap message from: ' + req.url.split('/')[0]);
    res.end();
});

server.on('response', (res) => {
    res.pipe(process.stdout);
    res.on('end', () => {
        process.exit(0);
    })
});

server.listen(null, null, "cert.key", "cert.crt", () => {
    console.log('listening on port 5683 for coap requests');
});