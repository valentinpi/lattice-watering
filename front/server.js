"use strict"

// Webserver
var express = require('express');
var app = require("express")();
var http = require('http').Server(app);
var morgan = require('morgan');
var engines = require('consolidate');
var bodyParser = require('body-parser');
var db = require('./db');
var cbor = require('cbor');
var ip = require('ip');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 1000;
const height = 300;
const chartCallback = (ChartJS) => {
    console.log('chart built')
};
const canvasRenderService = new ChartJSNodeCanvas({ width, height, chartCallback });

// Websocket
var io = require('socket.io')(http);

// CoAP
var coap = require('coap');
var url = require('url');
var request = require('coap').request;
var Agent = require('coap').Agent;
const cons = require('consolidate');
const { createBrotliCompress } = require('zlib');
const { change_plant_node } = require('./db');
var url;

/* ---------------- Express Setup ---------------- */
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
    // NOTE: A bit of a small workaround.
    var node_url = new url.URL(`localhost:3000/${req.url}`);
    console.log(node_url);
    var node_ip = node_url.node_ip;
    res.render('./plantView.html', { node_ip: node_ip });
});

app.get('/', function (req, res) {
    res.render('./index.html');
});

app.get('/plantRefresh', async function (req, res) {
    let plantRefresh = await db.select_plant_infos();
    res.json(plantRefresh);
});

app.get('/plantDetailView', async function (req, res) {
    var plant_ip = req.query.node_ip;
    let plantDetailView = await db.select_plant_info(plant_ip);
    res.json(plantDetailView);
});

app.post('/pump_toggle', function (req, res) {
    var plant_ip = req.query.node_ip;
    let payload = cbor.encode(ip.toBuffer(plant_ip));
    // Send to proxy
    const coap_req = coap.request({ hostname: "::", pathname: "/pump_toggle", confirmable: false, method: 'POST', port: 5685 });
    coap_req.setOption('Content-Format', "application/cbor");
    coap_req.write(payload);
    coap_req.end();
    res.status(204).send();
});

app.post('/calibrate_sensor', function (req, res) {
    var plantIP = req.query.nodeIP;
    var wet_value = req.query.wet_value;
    var dry_value = req.query.dry_value;

    // change values in database
    db.change_plant_node(plantIP,false,dry_value,wet_value);

    //Send payload
    // TODO: Proxy is missing
    const payload = cbor.encode(ip.toBuffer(plant_ip), dry_value, wet_value);
    const coap_req = coap.request({ hostname: "::", pathname: "/calibrate_sensor", confirmable: false, method: 'POST', port: 5685 });
    coap_req.setOption('Content-Format', "application/cbor");
    coap_req.write(payload);
    coap_req.end();
    res.status(204).send();
});

app.listen(3000, () => {
    console.log('listening on port 3000 for frontend requests');
});

/* -------------------- Chart -------------------- */
app.get('/plantChart', async function (req, res) {
    var plantIP = req.query.nodeIP;
    let result = await db.select_plant_info(plantIP);
    var chartData = [];
    var chartTime = [];
    result.forEach(row => {
        chartData.push(row.humidity);
        chartTime.push(row.date_time);
        console.log(row.node_ip + "\t" + row.pump_activated + "\t" + row.dry_value + "\t" + row.wet_value + "\t" + row.date_time + "\t" + row.humidity);
    });

    console.log('making image')
    fs.writeFileSync('./public/img/mychart.png', await createImage(chartData, chartTime));
    res.send('done');
});

const createImage = async (chartData, chartTime) => {
    const configuration = {
        type: 'line',
        data: {
            labels: chartTime,
            datasets: [{
                label: 'lmao',
                data: chartData,
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                axis: 'x'
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    display: true,
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Date and time of measurement'
                    },
                    ticks: {
                        stepSize: 1
                        //callback: function (value, index, values) {
                        //    return xLabels[index];  // gives points of top x axis
                        //}
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Humidity in %'
                    },
                    ticks: {
                        max: 100,
                        stepSize: 10 //defines y axis step scale
                    }
                }
            }
        }
    }
    const dataUrl = await canvasRenderService.renderToBuffer(configuration); // converts chart to image
    return dataUrl;
};

/* --------------------- COAP -------------------- */
var server = coap.createServer({ type: 'udp6' });

(async () => {
    await db.init();
})();

server.on('request', (req, _) => {
    if (req.url != '/data') {
        return;
    }

    let decodedData = cbor.decodeAllSync(req.payload);
    let humidity = decodedData[0];
    let pump_activated = decodedData[1];
    let dry_value = decodedData[2];
    let wet_value = decodedData[3];
    let rx_bytes = decodedData[4];
    let rx_count = decodedData[5];
    let tx_bytes = decodedData[6];
    let tx_unicast_count = decodedData[7];
    let tx_mcast_count = decodedData[8];
    let tx_success = decodedData[9];
    let tx_failed = decodedData[10];
    let ip_addr = new Uint8Array(decodedData.slice(11, 27));
    let ip_addr_str = ip.toString(Buffer.from(ip_addr), 0, 16);

    console.log(`Received CoAP-CBOR /data POST from ${ip_addr_str}`);

    //console.log(
    //    `ip_addr: ${ip_addr}\n`,
    //    `\bip_addr_str: ${ip_addr_str}\n`,
    //    `\bhumidity: ${humidity}\n`,
    //    `\bpump_activated: ${pump_activated}\n`,
    //    `\bdry_value: ${dry_value}\n`,
    //    `\bwet_value: ${wet_value}\n`,
    //    `\brx_bytes: ${rx_bytes}\n`,
    //    `\brx_count: ${rx_count}\n`,
    //    `\btx_bytes: ${tx_bytes}\n`,
    //    `\btx_unicast_count: ${tx_unicast_count}\n`,
    //    `\btx_mcast_count: ${tx_mcast_count}\n`,
    //    `\btx_success: ${tx_success}\n`,
    //    `\btx_failed: ${tx_failed}`);
    
    db.change_plant_node(ip_addr_str, pump_activated, dry_value, wet_value);
    db.insert_plant_humidity(ip_addr_str, humidity);
    //db.select_all();
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

/* --------------------- TEST -------------------- */
async function testAll(){
    //Testdata because no boards ...
    var ip_addr = [254,128,0,0,0,0,0,0,2,4,37,25,24,1,11,0];
    var humidity = 0;
    var pump_activated = false;
    var dry_value = 2920;
    var wet_value = 50;
    var dec_ip_addr = '';
    for (var i = 0; i < 8; i++) {
        dec_ip_addr += ip_addr[i*2];
        dec_ip_addr += ip_addr[i*2+1];
        if(!(i==7)) {dec_ip_addr += ':';}
    }
    var hex_ip_addr = '';
    for (var i = 0; i < 8; i++) {
        hex_ip_addr += ip_addr[i*2].toString(16);
        hex_ip_addr += ip_addr[i*2+1].toString(16);
        if(!(i==7)) {hex_ip_addr += ':';}
    }
    var pump_state = 0;
    if (pump_activated) {pump_state = 1;}

    db.change_plant_node(hex_ip_addr, pump_state, dry_value, wet_value);
    db.insert_plant_humidity(hex_ip_addr, humidity);

    setTimeout(() => { db.select_all(); }, 1000);
};

db.select_all();
db.change_plant_node("::", 0, 0, 0);
db.insert_plant_humidity("::", 50);

//testAll();
