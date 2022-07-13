"use strict"

// Webserver
const app = require("express")();
const body_parser = require("body-parser");
const cbor = require("cbor");
const coap = require("coap");
const db = require("./db");
const engines = require("consolidate");
const express = require("express");
const fs = require("fs");
const ip = require("ip");
const morgan = require("morgan");
const url = require("url");

// We draw the charts on the server and pass them to the frontend
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const CHART_WIDTH = 1000;
const CHART_HEIGHT = 300;
const canvas_render_service = new ChartJSNodeCanvas({ type: "svg", width: CHART_WIDTH, height: CHART_HEIGHT });

/* ---------------- Express Setup ---------------- */
app.use(morgan("dev"));
app.set("views", __dirname + "/views");
app.engine("html", engines.mustache);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(body_parser.json()); // Get information from html forms
app.use(body_parser.urlencoded({
    extended: true
}));

/* ------------------- Frontend ------------------ */
app.get("/plant_view", function (req, res) {
    var node_url = new url.URL(`localhost:3000/${req.url}`);
    var node_ip = node_url.node_ip;
    res.render("./plant_view.html", { node_ip: node_ip });
});

app.get("/", function (_, res) {
    res.render("./index.html");
});

app.get("/plant_refresh", async function (_, res) {
    let plantRefresh = await db.select_plant_infos();
    res.json(plantRefresh);
});

app.get("/plant_detail_view", async function (req, res) {
    let plant_ip = req.query.node_ip;
    let plant_detail_view = (await db.select_plant_info(plant_ip));
    plant_detail_view.configuration.humidity = plant_detail_view.humidities[0].humidity;
    console.log(plant_detail_view.configuration);
    res.json(plant_detail_view.configuration);
});

app.post("/pump_toggle", function (req, res) {
    var plant_ip = req.body.node_ip;
    let payload = cbor.encode(ip.toBuffer(plant_ip));
    // Send to proxy
    const coap_req = coap.request({ hostname: "::", pathname: "/pump_toggle", confirmable: false, method: "POST", port: 5685 });
    coap_req.setOption("Content-Format", "application/cbor");
    coap_req.write(payload);
    coap_req.end();
    res.status(204).send();
});

app.post("/calibrate_sensor", function (req, res) {
    var plant_ip = req.body.node_ip;
    var dry_value = parseInt(req.body.dry_value, 10);
    var wet_value = parseInt(req.body.wet_value, 10);
    if (isNaN(dry_value) || isNaN(wet_value)) {
        console.log("Calibration parameters are invalid");
        return;
    }

    // change values in database
    db.change_plant_node(plant_ip, false, dry_value, wet_value);

    // Send payload
    const payload = cbor.encode(ip.toBuffer(plant_ip), dry_value, wet_value);
    const coap_req = coap.request({ hostname: "::", pathname: "/calibrate_sensor", confirmable: false, method: "POST", port: 5685 });
    coap_req.setOption("Content-Format", "application/cbor");
    coap_req.write(payload);
    coap_req.end();
    res.status(204).send();
});

app.listen(3000, () => {
    console.log("listening on port 3000 for frontend requests");
});

/* -------------------- Chart -------------------- */
app.get("/plant_chart", async function (req, res) {
    let plant_ip = req.query.node_ip;
    let result = (await db.select_plant_info(plant_ip)).humidities;
    let chart_data = [];
    let chart_time = [];
    console.log("HERE");
    result.forEach(row => {
        chart_data.push(row.humidity);
        chart_time.push(row.date_time);
        //console.log(row.node_ip + "\t" + row.pump_activated + "\t" + row.dry_value + "\t" + row.wet_value + "\t" + row.date_time + "\t" + row.humidity);
    });
    fs.writeFileSync("public/img/mychart.svg", await create_image(chart_data, chart_time));
    res.send();
});

const create_image = async (chart_data, chart_time) => {
    const configuration = {
        type: "line",
        data: {
            labels: chart_time,
            datasets: [{
                label: "Humidity",
                data: chart_data,
                fill: true,
                borderColor: "rgb(75, 192, 192)",
                axis: "x"
            }]
        },
        options: {
            scales: {
                x: {
                    type: "category",
                    display: true,
                    position: "bottom",
                    title: {
                        display: true,
                        text: "Date and time of measurement"
                    },
                    ticks: {
                        max: 10,
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
                        text: "Humidity in %"
                    },
                    ticks: {
                        max: 100,
                        stepSize: 10 //defines y axis step scale
                    }
                }
            }
        }
    };
    const data_url = await canvas_render_service.renderToBuffer(configuration); // converts chart to image
    console.log(data_url);
    return data_url;
};

/* --------------------- COAP -------------------- */
var server = coap.createServer({ type: "udp6" });
db.init();

server.on("request", (req, _) => {
    if (req.url != "/data") {
        return;
    }

    let decoded_data = cbor.decodeAllSync(req.payload);
    let humidity = decoded_data[0];
    let pump_activated = decoded_data[1];
    let dry_value = decoded_data[2];
    let wet_value = decoded_data[3];
    /*
    let rx_bytes = decoded_data[4];
    let rx_count = decoded_data[5];
    let tx_bytes = decoded_data[6];
    let tx_unicast_count = decoded_data[7];
    let tx_mcast_count = decoded_data[8];
    let tx_success = decoded_data[9];
    let tx_failed = decoded_data[10];
    */
    let ip_addr = new Uint8Array(decoded_data.slice(11, 27));
    let ip_addr_str = ip.toString(Buffer.from(ip_addr), 0, 16);

    console.log(`Received CoAP-CBOR /data POST from ${ip_addr_str}`);

    /*
    console.log(
        `ip_addr: ${ip_addr}\n`,
        `\bip_addr_str: ${ip_addr_str}\n`,
        `\bhumidity: ${humidity}\n`,
        `\bpump_activated: ${pump_activated}\n`,
        `\bdry_value: ${dry_value}\n`,
        `\bwet_value: ${wet_value}\n`,
        `\brx_bytes: ${rx_bytes}\n`,
        `\brx_count: ${rx_count}\n`,
        `\btx_bytes: ${tx_bytes}\n`,
        `\btx_unicast_count: ${tx_unicast_count}\n`,
        `\btx_mcast_count: ${tx_mcast_count}\n`,
        `\btx_success: ${tx_success}\n`,
        `\btx_failed: ${tx_failed}`);
    */
    
    db.change_plant_node(ip_addr_str, pump_activated, dry_value, wet_value, 20, 60, 5);
    db.insert_plant_humidity(ip_addr_str, humidity);
    //db.select_all();
});

server.on("response", (res) => {
    res.pipe(process.stdout);
    res.on("end", () => {
        process.exit(0);
    })
});

server.listen(5683, () => {
    console.log("listening on port 5683 for coap requests");
});

/* --------------------- TEST -------------------- */
/*
async function test_all(){
    //Testdata because no boards ...
    var ip_addr = [254,128,0,0,0,0,0,0,2,4,37,25,24,1,11,0];
    var humidity = 0;
    var pump_activated = false;
    var dry_value = 2920;
    var wet_value = 50;
    var dec_ip_addr = "";
    for (var i = 0; i < 8; i++) {
        dec_ip_addr += ip_addr[i*2];
        dec_ip_addr += ip_addr[i*2+1];
        if(!(i==7)) {dec_ip_addr += ":";}
    }
    var hex_ip_addr = "";
    for (var i = 0; i < 8; i++) {
        hex_ip_addr += ip_addr[i*2].toString(16);
        hex_ip_addr += ip_addr[i*2+1].toString(16);
        if(!(i==7)) {hex_ip_addr += ":";}
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

testAll();
*/

function test() {
    db.change_plant_node("[::]", 0, 0, 0, 20, 60, 5);
    db.insert_plant_humidity("[::]", 50);
    setTimeout(test, 5000);
};
test();
