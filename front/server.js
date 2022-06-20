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
        node_ip TEXT,
        plant_name TEXT,
        date_time TEXT,
        humidity INTEGER
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
    var humidity = '42';
    //date_time creation is asynchonous with nodes, data is not perfect (crashes ...)
    db.run(`
    INSERT INTO plant_nodes (id, node_ip, plant_name, date_time, humidity)
        VALUES (NULL, ?, ?, datetime('now','localtime'), ?);
    `, node_ip, plant_name, humidity, (err) => {
        if (err) {
            console.log('Insert query error: ' + err);
            return;
        }
        console.log('Inserted row with data into table "plant_nodes"');
    });
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
/* ------------------- Frontend ------------------ */

app.get('/plantView', function (req, res) {
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


/* --------------------- COAP -------------------- */
var server = coap.createServer();

server.on('request', (req, res) => {
    console.log('server received coap message from: ' + req.url + ' | ' + req.url.split('/')[0] + ' | ' + req.url.split('/')[1] + ' | ' + req.url.split('/')[2] + ' | ' + req.url.split('/')[3]);
    console.log('payload from coap message: ' + req.payload + ' ' + req.payload[0] + ' ' + req.payload[1] + ' ' + req.payload[2]);
    console.log(parseCoapPayload(req.payload));
});

server.on('response', (res) => {
    res.pipe(process.stdout);
    res.on('end', () => {
        process.exit(0);
    })
});

server.listen(5683, () => {
    console.log('listening on port 5683 for coap requests without dtls');
});

function parseCoapPayload(data) {
    const char_array = [];
    data.forEach(data_char => {
        char_array.push(String.fromCharCode(data_char));
    });
    return char_array;
}

//null, null, "cert.key", "cert.crt"
/*
try {
    server.listen(null, null, "cert.key", "cert.crt", () => {
        console.log('listening on port 5683 for coap requests with dtls');
    });
} catch (err) {
    console.log("No dtls active: " + err);
    console.log("First you need to generate a private key and public certificate:\nopenssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cert.key -out cert.crt -subj '/CN=m4n3dw0lf/O=dtls/C=BR'");

    server.listen(5683, () => {
        console.log('listening on port 5683 for coap requests without dtls');
    });
};
*/
//databaseAccess();