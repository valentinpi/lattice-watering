"use strict";

//Webserver
var express = require('express');
var app = require("express")();
var http = require('http').Server(app);
var morgan = require('morgan');
var engines = require('consolidate');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3');

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

/* -------------------- SQLite ------------------- */
function runQueries(db) {
    console.log('TODO queries')
};

function createTables(newdb) {
    newdb.exec(`
    create table plant_nodes (
        node_id int primary key not null,
        plant_name text null,
        date_time text not null,
        humidity int not null
    );
        `, () => {
        console.log('Table: "plant_nodes" in database: "lattice_watering.db" created');
        //runQueries(newdb);
    });
};

function createDatabase() {
    var newdb = new sqlite3.Database('lattice_watering.db', (err) => {
        if (err) {
            console.log("Getting error " + err);
            exit(1);
        }
        createTables(newdb);
    });
};

function databaseAccess() {
    let db = new sqlite3.Database('./lattice_watering.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err && err.code == "SQLITE_CANTOPEN") {
            console.log('No database: "lattice_watering.db" found, creating new one');
            createDatabase();
            return;
        } else if (err) {
            console.log("Getting error " + err);
            exit(1);
        }
        console.log('Database: "lattice_watering.db" found and connected')
        //runQueries(db);
    });
};
/* ----------------------------------------------- */

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

    databaseAccess();

    res.status(204).send();
});

app.listen(3000, () => {
    console.log('listening on port 3000 for frontend requests');
});

var server = coap.createServer();

server.on('request', (req, res) => {
    console.log('server received coap message from: ' + req.url.split('/')[0] + req.url.split('/')[1] + req.url.split('/')[2]);
});

server.on('response', (res) => {
    res.pipe(process.stdout);
    res.on('end', () => {
        process.exit(0);
    })
});

//null, null, "cert.key", "cert.crt"
server.listen(5683, () => {
    console.log('listening on port 5683 for coap requests');
});