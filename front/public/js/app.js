"use strict";

const PLANT_REFRESH_DELAY = 1000;
const DATE_REFRESH_DELAY = 500;

function startup(isIndex = 0) {
    if (isIndex) {
        // index with plant overview
        date_time();
        refresh_plants();
    } else {
        // plant_view with more details to one specific node_ip
        date_time();
        plant_detail_view();
    }
};

function date_time() {
    var today = new Date();
    var date = check_format(today.getDate()) + "." + check_format((today.getMonth() + 1)) + "." + today.getFullYear();
    var time = check_format(today.getHours()) + ":" + check_format(today.getMinutes()) + ":" + check_format(today.getSeconds());

    document.getElementById("display_date_time").innerHTML = time + ", " + date;
    setTimeout(date_time, DATE_REFRESH_DELAY);
};

function check_format(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
};

/* -------------------- index -------------------- */
async function refresh_plants() {
    let response = await (fetch("/plant_refresh"));
    let data = await response.json();

    var element = document.getElementById("scrollmenu");
    var div = document.createElement("div");
        div.classList.add("box");
    var div2 = document.createElement("div");
        div2.classList.add("boxnonodes");
    var br = document.createElement("br");
    var h1 = document.createElement("h1");
        h1.textContent = "No nodes in reach";
    var h3_top = document.createElement("h3");
    var h3_bottom = document.createElement("h3");
    var img = document.createElement("img");
        img.src = "/img/placeholder_plant.png";
        img.alt = "Plant";
    var a = document.createElement("a");
        a.id = "plant_setting";
        a.title = "Configure desired humidity and show statistics";
        a.text = "Settings ...";

    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }

    // Add boxes for every distinct plant_ip in table in db
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            while (div.hasChildNodes()) {
                div.removeChild(div.firstChild);
            }

            h3_top.textContent = "Plant";
            h3_bottom.textContent = data[i].node_ip;
            var text_hum = document.createTextNode("Humidity: " + data[i].humidity + "%");
            a.href = "plant_view?node_ip=" + data[i].node_ip;
        
            div.appendChild(h3_top.cloneNode(true));
            div.appendChild(h3_bottom.cloneNode(true));
            div.appendChild(img.cloneNode(true));
            div.appendChild(br.cloneNode(true));
            div.appendChild(br.cloneNode(true));
            div.appendChild(text_hum);
            div.appendChild(br.cloneNode(true));
            div.appendChild(a.cloneNode(true));
            element.appendChild(div.cloneNode(true));
        }
    } else {
        div2.appendChild(h1);
        element.appendChild(div2);
    }

    setTimeout(refresh_plants, PLANT_REFRESH_DELAY);
};

/* ------------------ plant_view ------------------ */
async function plant_detail_view() {
    let my_url = location.search;
    let my_ip = my_url.split("=")[1];
    let response = await fetch(`/plant_detail_view?node_ip=${my_ip}`);
    let config = await response.json();

    // Get dry and wet value from database
    let dry_value = config.dry_value;
    let wet_value = config.wet_value;
    let watering_threshold_bottom = config.watering_threshold_bottom;
    let watering_threshold_target = config.watering_threshold_target;
    let watering_threshold_timeout = config.watering_threshold_timeout;

    // Creating the Box with plant and info
    let element = document.getElementById("plant_chart");

    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }

    // TODO: Replace these `<br/>` tags with CSS formatting.
    element.innerHTML = `\
        <div class="box" style="display: block; width: 100%;">
            <h3>Plant</h3>
            <h3>${config.node_ip}</h3>
            <div id="plant_detail_configuration" style="display: flex; flex-direction: row;">
                <div>
                    <img style="width: 250px;" src="/img/placeholder_plant.png" alt="Plant">
                    <div id="humidity">Humidity: ${config.humidity}%</div>
                </div>
                <div>
                    <form class="plant_detail_configuration_form" action="/pump_toggle" method="POST">
                        <input type="hidden" name="node_ip" value="${my_ip}">
                        <span class="plant_detail_configuration_heading">Explicit Pump Control</span>
                        <input class="plant_detail_configuration_button" type="submit" name="TOGGLE" value="Toggle Pump">
                    </form>
                    <form class="plant_detail_configuration_form" action="/calibrate_sensor" method="POST">
                        <input type="hidden" name="node_ip" value="${my_ip}">
                        <span class="plant_detail_configuration_heading">Sensor Calibration</span>
                        <table>
                            <tr>
                                <td>
                                    <span class="plant_detail_configuration_label">Dry Value: </span>
                                </td>
                                <td>
                                    <input class="plant_detail_configuration_textbox" type="text" name="dry_value" value="${dry_value}" size="10">
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="plant_detail_configuration_label">Wet Value: </span>
                                </td>
                                <td>
                                    <input class="plant_detail_configuration_textbox" type="text" name="wet_value" value="${wet_value}" size="10">
                                </td>
                            </tr>
                        </table>
                        <input class="plant_detail_configuration_button" name="plant_detail_calibration_button" type="submit" value="Calibrate Sensor" size="10">
                    </form>
                    <form class="plant_detail_configuration_form" action="/configure_thresholding" style="justify-content: right;" method="POST">
                        <input type="hidden" name="node_ip" value="${my_ip}">
                        <span class="plant_detail_configuration_heading">Thresholding Configuration</span>
                        <table style="text-align: left;">
                            <tr>
                                <td>
                                    <span class="plant_detail_configuration_label">Bottom: </span>
                                </td>
                                <td>
                                    <input class="plant_detail_configuration_textbox" type="text" name="watering_threshold_bottom" value="${watering_threshold_bottom}" size="10">
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="plant_detail_configuration_label">Target: </span>
                                </td>
                                <td>
                                    <input class="plant_detail_configuration_textbox" type="text" name="watering_threshold_target" value="${watering_threshold_target}" size="10">
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="plant_detail_configuration_label">Timeout: </span>
                                </td>
                                <td>
                                    <input class="plant_detail_configuration_textbox" type="text" name="watering_threshold_timeout" value="${watering_threshold_timeout}" size="10">
                                </td>
                            </tr>
                        </table>
                        <input class="plant_detail_configuration_button" name="plant_detail_thresholding_button" type="submit" value="Configure Thresholding" size="10">
                    </form>
                </div>
                <!-- No form here since we do not want to post anything just yet. -->
                <div class="plant_detail_configuration_form" style="justify-content: right;">
                    <input type="hidden" name="node_ip" value="${my_ip}">
                    <span class="plant_detail_configuration_label">Watering Schedules Overview</span>
                    <select id="watering_schedules_list" multiple size="5">
                    </select>
                    <input class="plant_detail_configuration_button" name="plant_detail_delete_schedule_button" type="submit" value="Delete Schedule" size="10">
                    <table style="text-align: left;">
                        <tr>
                            <td>
                                <span class="plant_detail_configuration_label">Schedule Begin: </span>
                            </td>
                            <td>
                                <input class="plant_detail_configuration_textbox" type="text" name="watering_begin" value="0" size="10">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span class="plant_detail_configuration_label">Schedule End: </span>
                            </td>
                            <td>
                                <input class="plant_detail_configuration_textbox" type="text"  name="watering_end" value="10" size="10">
                            </td>
                        </tr>
                    </table>
                    <input class="plant_detail_configuration_button" name="plant_detail_add_schedule_button" type="submit" value="Add Schedule" size="10">
                </div>
                <div id="plant_detail_configuration_explanations">
                    <div>Some explanations</div>
                    <br/>
                    <div>Congratulations! Your Lattice-Watering system was successfully set up. Before you get started, you may want to calibrate the sensor first. You do that by first taking the current humidity, while the sensor is dry, as the dry value. For the wet value, you may stick the moisture sensor into water and measure. You can then explicitly control the pump, setup a threshold, which, if the bottom value is crossed, will start watering the plant in short bursts of five seconds and then wait for the selected timeout to run out and check again, until the target humidity is reached. You can also setup fixed time schedules, notice that these are in seconds and run daily.</div>
                </div>
            </div>
            <a href="/" text="Go back" title="Go back to plants overview" id="plant_setting">Go back</a>
        </div>
        <div class="box_chart">
            <img id="img_plant_chart" src="/img/mychart.png" alt="Plant Chart">
        </div>`;

    // ATTENTION: This functionality is NOT well tested.
    document.getElementsByName("plant_detail_add_schedule_button")[0].addEventListener("click", async (_) => {
        let watering_begin = parseInt(document.getElementsByName("watering_begin")[0].value);
        let watering_end = parseInt(document.getElementsByName("watering_end")[0].value);
        // TODO: Some cases have been checked, still: The watering times can overlap! Fix this. There
        // are efficient datastructures for such point queries, maybe range trees? Not implementing due to time constraints, but see
        // e.g. https://www.npmjs.com/package/tree-range-set.
        if (isNaN(watering_begin) || isNaN(watering_end) || watering_begin < 0 || watering_begin >= 24*60*60 || watering_end < 0 || watering_end >= 24*60*60 || watering_begin > watering_end) {
            return;
        }
        let watering_schedule_string = `${watering_begin} - ${watering_end}`;
        let watering_schedules_list = document.getElementById("watering_schedules_list");
        let children = watering_schedules_list.childNodes;
        for (let i = 1; i < children.length; i++) {
            let child = children[i];
            if (child.innerText == watering_schedule_string) {
                return;
            }
        }
        // TODO: Sort the list after adding the option.
        watering_schedules_list.appendChild(new Option(watering_schedule_string));
        console.log(my_ip, watering_begin, watering_end)
        await fetch(`/add_watering_schedule`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                node_ip: my_ip,
                watering_begin: watering_begin,
                watering_end: watering_end,
            })
        });
    });
    document.getElementsByName("plant_detail_delete_schedule_button")[0].addEventListener("click", async (_) => {
        let watering_schedules_list = document.getElementById("watering_schedules_list");
        // To keep it simple
        let selectedIndex = watering_schedules_list.selectedIndex;
        if (selectedIndex == -1) {
            return;
        }
        // For some odd reason
        let child = watering_schedules_list.childNodes[selectedIndex+1];
        let watering_schedule = child.innerText.split(" - ");
        watering_schedules_list.removeChild(child);
        await fetch(`/delete_watering_schedule`, {
            method: "POST",
            body: {
                "node_ip": my_ip,
                "watering_begin": watering_schedule[0],
                "watering_end": watering_schedule[1]
            }
        });
    });

    refresh_plant_detail_view();
};

async function refresh_plant_detail_view() {
    let my_url = location.search;
    let my_ip = my_url.split("=")[1];
    let hum = document.getElementById("humidity");
    await fetch(`/plant_chart?node_ip=${my_ip}`);
    let res = await fetch(`/plant_detail_view?node_ip=${my_ip}`);
    // Small browser trick: This makes the browser reload the image.
    let img_plant_chart = document.getElementById("img_plant_chart");
    img_plant_chart.src = `/img/mychart.png?t=${Date.now()}`;
    let config = await res.json();
    hum.innerHTML = `Humidity: ${config.humidity}%`;
    setTimeout(refresh_plant_detail_view, PLANT_REFRESH_DELAY);
}

function plant_chart() {
    // Set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    var svg = d3.select("#plant_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Read the data
    d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv",

        // When reading the csv, I must format variables:
        function (d) {
            return { date: d3.timeParse("%Y-%m-%d")(d.date), value: d.value }
        },

        // Now I can use this dataset:
        function (data) {

            // Add X axis --> it is a date format
            var x = d3.scaleTime()
                .domain(d3.extent(data, function (d) { return d.date; }))
                .range([0, width]);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Add Y axis
            var y = d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return +d.value; })])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Add the line
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function (d) { return x(d.date) })
                    .y(function (d) { return y(d.value) })
                )
        })
};
