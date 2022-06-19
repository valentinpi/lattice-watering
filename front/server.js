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

function checkFormat(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
};

/* -------------------- SQLite ------------------- */
function databaseAccess() {
    let db = new sqlite3.Database('./lattice_watering.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err && err.code == "SQLITE_CANTOPEN") {
            console.log('No database: "lattice_watering.db" found');
            createDatabase();
        } else if (err) {
            console.log("Database Access error " + err);
            exit(1);
        } else {
            console.log('Database: "lattice_watering.db" found and connected')
        }

        insertQuery(db);
        selectQuery(db);
    });
};

function createDatabase() {
    var newdb = new sqlite3.Database('./lattice_watering.db', (err) => {
        if (err) {
            console.log("Database creation error " + err);
            exit(1);
        }
        console.log('Database: "lattice_watering.db" created')
        createQuery(newdb);
    });
};

function createQuery(db) {
    db.run(`
    CREATE TABLE plant_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NULL,
        node_ip TEXT NOT NULL,
        plant_name TEXT NULL,
        date_time TEXT NOT NULL,
        humidity INTEGER NULL
    );
    `, (err) => {
        if (err) {
            console.log("Create query error " + err);
            return;
        }
        console.log('Table: "plant_nodes" in database: "lattice_watering.db" created');
    });
};

function insertQuery(db) {
    //placedholder-mania
    var node_ip = '::1';
    var plant_name = 'Tomato';
    var date_time = '2022-06-16 00:11:31';
    var humidity = '42';
    //date_time creation for test purposes will be replaced by send info from nodes
    var today = new Date();
    var date = today.getFullYear() + '-' + checkFormat((today.getMonth() + 1)) + '-' + checkFormat(today.getDate());
    var time = checkFormat(today.getHours()) + ":" + checkFormat(today.getMinutes()) + ":" + checkFormat(today.getSeconds());
    //var date_time = (date + ' ' + time).toString();
    db.run(`
    INSERT INTO plant_nodes (id, node_ip, plant_name, date_time, humidity)
        VALUES (NULL, ?, ?, '2022-06-16 00:11:31', ?);
    `, (node_ip, plant_name, humidity), (err) => {
        if (err) {
            console.log('Insert query error: ' + err);
            return;
        }
        console.log('Inserted row with data into table "plant_nodes"');
    });
    /*
    db.run(`INSERT INTO plant_nodes (id, node_ip, plant_name, date_time, humidity)
        VALUES (NULL, "::1", "Pumpkin", "2022-06-16 00:11:31", 42);
    `, () => {
        console.log('Inserted row with data into table "plant_nodes"');
    });
    */
};

function selectQuery(db) {
    db.all(`SELECT * FROM plant_nodes`, (err, rows) => {
        if (err) {
            console.log("Select query error " + err);
            return;
        }
        //console.log(rows);
        
        rows.forEach(row => {
            console.log(row.id + "\t" + row.node_ip + "\t" + row.plant_name + "\t" + row.date_time + "\t" + row.humidity)
        });
        
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

databaseAccess();