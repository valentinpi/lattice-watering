"use strict"

//Webserver
var express = require('express');
var app = require("express")();
var http = require('http').Server(app);
var morgan = require('morgan');
var engines = require('consolidate');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3');
var dtls = require('dtls');
var db = require('./public/js/db');
var ejs = require('ejs');
var cbor = require('cbor');

//Websocket
var io = require('socket.io')(http);

//COAP
var coap = require('coap');
var URL = require('url');
var request = require('coap').request;
var Agent = require('coap').Agent;
const cons = require('consolidate');
const { createBrotliCompress } = require('zlib');
var url;
var debug = false;

/* ---------------- Express Setup ---------------- */
url = URL.parse('coap://localhost:5683/sensor');
url.method = 'GET';
url.observe = true;

app.use(morgan('dev'));
app.set('views', __dirname + '/views');
app.engine('html', engines.mustache);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({
    extended: true
}));

/* ------------------- Frontend ------------------ */
app.get('/plantView', function (req, res) {
    var myUrl = url.parse(req.url, true);
    var nodeIP = myUrl.query.node_ip;
    res.render('./plantView.html', { node_ip: nodeIP });
});

app.get('/', function (req, res) {
    res.render('./index.html');
});

app.get('/plantRefresh', async function (req, res) {
    let plant_refresh = await db.selectPlantInfos();
    res.json(plant_refresh);
});

app.get('/plantDetailView', async function (req, res) {
    var plantIP = req.query.nodeIP;
    let plantDetailView = await db.selectSinglePlant(plantIP);
    res.json(plantDetailView);
});

app.post('/pump_toggle', function (req, res) {
    var plantIP = req.query.nodeIP;

    //var pumpStateChange = 'Off';
    //if (req.body.pumpOn) {
    //    console.log('Turning pump on at ip: ' + plantIP);
    //    pumpStateChange = 'On';
    //} else {
    //    console.log('Turning pump off at ip: ' + plantIP);
    //    pumpStateChange = 'Off';
    //}
    //Send info to input IP with payload pumpOn/pumpOff
    const coap_req = coap.request({ hostname: plantIP, confirmable: false, method: 'POST' });

    coap_req.end();
    res.status(204).send();
});

app.post('/calibrate_sensor', function (req, res) {
    var plantIP = req.query.nodeIP;
    var wet_value = req.query.wet_value;
    var dry_value = req.query.dry_value;

    //Send payload
    var payload = {
        dry_value: dry_value,
        wet_value: wet_value
    }
    const payloadBytes = cbor.encode(JSON.stringify(payload));
    const coap_req = coap.request({ hostname: plantIP, confirmable: false, method: 'POST' });
    coap_req.write(payloadBytes)

    coap_req.end();

    //db.databaseAccess();
    res.status(204).send();
});

app.listen(3000, () => {
    console.log('listening on port 3000 for frontend requests');
});

/* -------------------- Chart -------------------- */


/* --------------------- COAP -------------------- */
var server = coap.createServer({ type: 'udp6' });

server.on('request', (req, res) => {
    //console.log('server received coap message from: ' + req.url + ' | ' + req.url.split('/')[0]);
    //console.log('payload from coap message: ' + req.payload + ' | ' + req.payload[0]);
    //parsePayloadIntoDB(req.payload);
    console.log(cbor.decodeAllSync(req.payload));
    console.log(req.rsinfo.address);
    db.insertQuery(req.rsinfo.address,'NULL',req.payload[0])
});

server.on('response', (res) => {
    res.pipe(process.stdout);
    res.on('end', () => {
        process.exit(0);
    })
});

function parsePayloadIntoDB(data) {
    data = JSON.parse(data);
    var title = data.title;
    var node_ip = data.node_ip;
    var humidity = data.humidity;

    console.log('title:\t\t' + title + '\nnode_ip:\t' + node_ip + '\nhumidity:\t' + humidity);
    //db.insertQuery(node_ip,'NULL',humidity);
}

server.listen(5683, () => {
    console.log('listening on port 5683 for coap requests without dtls');
});

/*
try {
    server.listen(("localhost", 5684, "cert.key", "cert.crt"), () => {
        console.log('listening on port 5683 for coap requests with dtls');
    });
} catch (err) {
    console.log("No dtls active: " + err);
    console.log("First you need to generate a private key and public certificate");

    server.listen(5683, () => {
        console.log('listening on port 5683 for coap requests without dtls');
    });
};
*/