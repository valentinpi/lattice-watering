"use strict"

// NOTE: The delay in the local communication is assumed to be barely existing, of course.
// So the frontend-website communication should be very close in practical, so that currently running
// asynchronous events are not interrupted.

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
const schedule = require("node-schedule");
const url = require("url");

// We draw the charts on the server and pass them to the frontend
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
// Should suffice for most screens
const CHART_WIDTH = 2000;
const CHART_HEIGHT = 800;
const canvas_render_service = new ChartJSNodeCanvas({ type: "png", width: CHART_WIDTH, height: CHART_HEIGHT });

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
    let plant_detail_view = await db.select_plant_info(plant_ip);
    plant_detail_view.configuration.humidity = plant_detail_view.humidities[0].humidity;
    res.json(plant_detail_view.configuration);
});

async function pump_toggle(node_ip) {
    // Change values in database
    let current_config = (await db.select_plant_info(node_ip)).configuration;
    await db.change_plant_node(node_ip, !current_config.pump_activated, current_config.dry_value, current_config.wet_value, current_config.watering_threshold_bottom, current_config.watering_threshold_target, current_config.watering_threshold_timeout);

    // Send payload
    let payload = cbor.encode(ip.toBuffer(node_ip));
    const coap_req = coap.request({ hostname: "::", pathname: "/pump_toggle", confirmable: false, method: "POST", port: 5685 });
    coap_req.setOption("Content-Format", "application/cbor");
    coap_req.write(payload);
    coap_req.end();
}

async function calibrate_sensor(node_ip, dry_value, wet_value) {
    let current_config = (await db.select_plant_info(node_ip)).configuration;
    db.change_plant_node(node_ip, current_config.pump_activated, dry_value, wet_value, current_config.watering_threshold_bottom, current_config.watering_threshold_target, current_config.watering_threshold_timeout);

    const payload = cbor.encode(ip.toBuffer(node_ip), dry_value, wet_value);
    const coap_req = coap.request({ hostname: "::", pathname: "/calibrate_sensor", confirmable: false, method: "POST", port: 5685 });
    coap_req.setOption("Content-Format", "application/cbor");
    coap_req.write(payload);
    coap_req.end();
}

async function configure_thresholding(node_ip, watering_threshold_bottom, watering_threshold_target, watering_threshold_timeout) {
    let current_config = (await db.select_plant_info(node_ip)).configuration;
    await db.change_plant_node(node_ip, current_config.pump_activated, current_config.dry_value, current_config.wet_value, watering_threshold_bottom, watering_threshold_target, watering_threshold_timeout);
}

app.post("/pump_toggle", async function (req, res) {
    var plant_ip = req.body.node_ip;
    await pump_toggle(plant_ip);
    res.status(204).send();
});

app.post("/calibrate_sensor", async function (req, res) {
    var plant_ip = req.body.node_ip;
    var dry_value = parseInt(req.body.dry_value, 10);
    var wet_value = parseInt(req.body.wet_value, 10);
    if (isNaN(dry_value) || isNaN(wet_value)) {
        console.error("Sensor calibration parameters are invalid");
        return;
    }
    await calibrate_sensor(plant_ip, dry_value, wet_value);
    res.status(204).send();
});

app.post("/configure_thresholding", async (req, res) => {
    let plant_ip = req.body.node_ip;
    let watering_threshold_bottom = parseInt(req.body.watering_threshold_bottom, 10);
    let watering_threshold_target = parseInt(req.body.watering_threshold_target, 10);
    let watering_threshold_timeout = parseInt(req.body.watering_threshold_timeout, 10);
    if (isNaN(watering_threshold_bottom) || isNaN(watering_threshold_target) || isNaN(watering_threshold_timeout)) {
        console.error("Threshold calibration parameters are invalid");
        return;
    }
    configure_thresholding(plant_ip, watering_threshold_bottom, watering_threshold_target, watering_threshold_timeout);
    res.status(204).send();
});

// NOTE: We assume the dates are well formatted. (syntactially and a bit semantically well at least, see `app.js`)
let watering_schedules_create_time_object = (timestamp) => {
    let hour = Math.floor(timestamp / (60*60));
    timestamp = timestamp - hour * (60 * 60);
    let minute = Math.floor(timestamp / 60);
    timestamp = timestamp - minute * 60;
    let second = timestamp;
    return {
        hour: hour,
        minute: minute,
        second: second
    }
};

let watering_schedules = [];
// Load existing schedules
// 16ms should suffice to load the DB and then request existing schedules. -> It could not suffice in case of a db that is too large...
// NOTE: Perhaps make this a bit more reliable.
setTimeout(async () => {
    let stored_schedules = await db.select_plant_watering_schedules();
    stored_schedules.forEach(watering_schedule => {
        let watering_begin_time = watering_schedules_create_time_object(watering_schedule.watering_begin);
        let watering_end_time = watering_schedules_create_time_object(watering_schedule.watering_end);
        watering_schedules.push({
            watering_start_job: schedule.scheduleJob(`${watering_begin_time.second} ${watering_begin_time.minute} ${watering_begin_time.hour} * * *`, () => {
                pump_toggle(watering_schedule.node_ip);
            }),
            watering_end_job: schedule.scheduleJob(`${watering_end_time.second} ${watering_end_time.minute} ${watering_end_time.hour} * * *`, () => {
                pump_toggle(watering_schedule.node_ip);
            }),
            node_ip: watering_schedule.node_ip,
            watering_begin: watering_schedule.watering_begin,
            watering_end: watering_schedule.watering_end
        });
    })
}, 16);

app.post("/add_watering_schedule", async (req, res) => {
    let node_ip = req.body.node_ip;
    // TODO: Use more standardized libraries for this.
    // TODO: Make this function much more robust.
    let watering_begin = req.body.watering_begin;
    let watering_end = req.body.watering_end;
    let watering_begin_time = watering_schedules_create_time_object(watering_begin);
    let watering_end_time = watering_schedules_create_time_object(watering_end);
    watering_schedules.push({
        watering_start_job: schedule.scheduleJob(`${watering_begin_time.second} ${watering_begin_time.minute} ${watering_begin_time.hour} * * *`, () => {
            pump_toggle(node_ip);
        }),
        watering_end_job: schedule.scheduleJob(`${watering_end_time.second} ${watering_end_time.minute} ${watering_end_time.hour} * * *`, () => {
            pump_toggle(node_ip);
        }),
        node_ip: node_ip,
        watering_begin: watering_begin,
        watering_end: watering_end
    });
    await db.insert_plant_watering_schedule(node_ip, watering_begin, watering_end);
    res.status(204).send();
});

app.post("/delete_watering_schedule", async (req, res) => {
    let node_ip = req.body.node_ip;
    let watering_begin = req.body.watering_begin;
    let watering_end = req.body.watering_end;
    for (let i = 0; i < watering_schedules.length; i++) {
        let schedule = watering_schedules[i];
        if (schedule.node_ip == node_ip && schedule.watering_begin == watering_begin && schedule.watering_end == watering_end) {
            schedule.watering_start_job.cancel();
            schedule.watering_end_job.cancel();
            watering_schedules.splice(i, 1);
            break;
        }
    }
    await db.delete_plant_watering_schedule(node_ip, watering_begin, watering_end);
    res.status(204).send();
});

app.listen(3000, () => {
    console.log("listening on port 3000 for frontend requests");
});

/* -------------------- Chart -------------------- */
app.get("/select_watering_schedules", async (req, res) => {
    let schedules = await db.select_plant_watering_schedule(req.query.node_ip);
    res.json(schedules);
});

app.get("/plant_chart", async (req, res) => {
    let plant_ip = req.query.node_ip;
    let result = (await db.select_plant_info(plant_ip)).humidities;
    let chart_data = [];
    let chart_time = [];
    result.forEach(row => {
        chart_data.push(row.humidity);
        // TODO: Figure out why mult. with 1000 yields a correct result.
        chart_time.push(new Date(row.date_time * 1000).toDateString());
    });
    fs.writeFileSync("public/img/mychart.png", await create_image(chart_data, chart_time));
    res.status(204).send();
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
    return data_url;
};

/* --------------------- COAP -------------------- */
var server = coap.createServer({ type: "udp6" });
db.init();

server.on("request", async (req, _) => {
    if (req.url != "/data") {
        return;
    }

    let decoded_data = cbor.decodeAllSync(req.payload);
    let humidity = decoded_data[0];
    let pump_activated = decoded_data[1];
    let dry_value = decoded_data[2];
    let wet_value = decoded_data[3];
    let ip_addr = new Uint8Array(decoded_data.slice(11, 27));
    let ip_addr_str = ip.toString(Buffer.from(ip_addr), 0, 16);

    /*
    let network_stats = {
        rx_bytes: decoded_data[4],
        rx_count: decoded_data[5],
        tx_bytes: decoded_data[6],
        tx_unicast_count: decoded_data[7],
        tx_mcast_count: decoded_data[8],
        tx_success: decoded_data[9],
        tx_failed: decoded_data[10]
    };
    console.log(`${ip_addr_str} network stats:`);
    console.table(network_stats);
    */

    console.log(`Received CoAP-CBOR /data POST from ${ip_addr_str}`);

    let current_config = (await db.select_plant_info(ip_addr_str)).configuration;
    // Probe for new registration
    if (current_config == undefined) {
        db.change_plant_node(ip_addr_str, pump_activated, dry_value, wet_value);
        db.insert_plant_humidity(ip_addr_str, humidity);
    }
    else {
        db.insert_plant_humidity(ip_addr_str, humidity);
        if (pump_activated != current_config.pump_activated) {
            pump_toggle(ip_addr_str);
        }
        if (dry_value != current_config.dry_value || wet_value != current_config.wet_value) {
            calibrate_sensor(ip_addr_str, current_config.dry_value, current_config.wet_value);
        }
    }
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

/* Test code for `request` listener for (CoAP) `server`
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

db.select_all();
*/

/*
function test() {
    db.change_plant_node("[::]", 0, 0, 0, 20, 60, 5);
    db.insert_plant_humidity("[::]", 50);
    setTimeout(test, 5000);
};
test();
*/
