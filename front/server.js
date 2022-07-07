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
    let plantRefresh = await db.selectPlantInfos();
    db.selectAll();
    res.json(plantRefresh);
});

app.get('/plantDetailView', async function (req, res) {
    var plantIP = req.query.nodeIP;
    let plantDetailView = await db.selectSinglePlant(plantIP);
    res.json(plantDetailView);
});

app.post('/pump_toggle', function (req, res) {
    var plantIP = req.query.nodeIP;
    const coap_req = coap.request({ hostname: plantIP, confirmable: false, method: 'POST' });
    coap_req.end();
    res.status(204).send();
});

app.post('/calibrate_sensor', function (req, res) {
    var plantIP = req.query.nodeIP;
    var dry_value = req.query.dry_value;
    var wet_value = req.query.wet_value;

    //Send payload
    var payload = {
        dry_value: dry_value,
        wet_value: wet_value
    }
    const payloadBytes = cbor.encode(JSON.stringify(payload));
    const coap_req = coap.request({ hostname: plantIP, confirmable: false, method: 'POST' });
    coap_req.write(payloadBytes)

    coap_req.end();
    res.status(204).send();
});

app.listen(3000, () => {
    console.log('listening on port 3000 for frontend requests');
});

/* -------------------- Chart -------------------- */


/* --------------------- COAP -------------------- */
var server = coap.createServer({ type: 'udp6' });

server.on('request', (req, res) => {
    console.log('Received COAP-CBOR request');

    //TODO - If server receives a CBOR packet, insert new entry in plant_nodes and change the status of the
    //corresponding node_ip in plant_status if present, otherwise add it
    var decodedData = cbor.decodeAllSync(req.payload);
    var ip_addr = decodedData.slice(4,20);
    var humidity = decodedData[0];
    var pump_activated = decodedData[1];
    var dry_value = decodedData[2];
    var wet_value = decodedData[3];

    var hex_ip_addr = '';
    for (var i = 0; i < 8; i++) {
        hex_ip_addr += ip_addr[i*2].toString(16);
        hex_ip_addr += ip_addr[i*2+1].toString(16);
        if(!(i==7)) {hex_ip_addr += ':';}
    }

    console.log(`ip_addr: ${ip_addr}\nhumidity: ${humidity}\npump_activated: ${pump_activated}\ndry_value: ${dry_value}\nwet_value: ${wet_value}\nhex_ip_addr: ${hex_ip_addr}`);

    db.insertPlantNode(ip_addr, humidity);
    
    if (db.changePlantStatus(ip_addr, pump_activated, dry_value, wet_value) == 0) {
        db.insertPlantStatus(ip_addr, pump_activated, dry_value, wet_value)
    }
});

server.on('response', (res) => {
    res.pipe(process.stdout);
    res.on('end', () => {
        process.exit(0);
    })
});

server.listen(5683, () => {
    console.log('listening on port 5683 for coap requests');
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