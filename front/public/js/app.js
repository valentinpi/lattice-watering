"use strict";


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
    var date = check_format(today.getDate()) + '.' + check_format((today.getMonth() + 1)) + '.' + today.getFullYear();
    var time = check_format(today.getHours()) + ":" + check_format(today.getMinutes()) + ":" + check_format(today.getSeconds());

    document.getElementById("display_date_time").innerHTML = time + ', ' + date;
    var t = setTimeout(date_time, 500);
};

function check_format(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
};

/* -------------------- index -------------------- */
async function refresh_plants() {
    let response = await (fetch('/plant_refresh'));
    let data = await response.json();

    var element = document.getElementById("scrollmenu");
    var div = document.createElement('div');
        div.classList.add('box');
    var div2 = document.createElement('div');
        div2.classList.add('boxnonodes');
    var br = document.createElement('br');
    var h3 = document.createElement('h3');
    var h1 = document.createElement('h1');
        h1.textContent = 'No nodes in reach';
    var h3_top = document.createElement('h3');
    var h3_bottom = document.createElement('h3');
    var img = document.createElement('img');
        img.src = '/img/placeholder_plant.png';
        img.alt = 'Plant';
    var a = document.createElement('a');
        a.id = 'plant_setting';
        a.title = 'Configure desired humidity and show statistics';
        a.text = 'Settings ...';

    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }

    // Add boxes for every distinct plant_ip in table in db
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            while (div.hasChildNodes()) {
                div.removeChild(div.firstChild);
            }

            h3_top.textContent = 'Plant';
            h3_bottom.textContent = data[i].node_ip;
            var text_hum = document.createTextNode('Humidity: ' + data[i].humidity + '%');
 
            var humidity = data[i].humidity;
            var low = 20;
            var high = 60;
            // toggle pump if moisture level is under 20% till it is 60%
            // https://www.greenwaybiotech.com/blogs/gardening-articles/how-soil-moisture-affects-your-plants-growth

            //if (humidity < low){
            //    await (fetch('/pump_toggle' + '?node_ip=' + data[i].node_ip));
            //    while (humidity<= high){
            //        // sleep
            //        response = await (fetch('/plantRefresh'));
            //        await new Promise(r => setTimeout(r, 2000));
            //        data = await response.json();
            //        humidity = data[i].humidity;
            //    }
            //    await (fetch('/pump_toggle' + '?node_ip=' + data[i].node_ip));
            //}
            a.href = 'plant_view?node_ip=' + data[i].node_ip;
        
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
    var t = setTimeout(refresh_plants, 5000);
};

/* ------------------ plant_view ------------------ */
async function plant_detail_view() {
    var myUrl = location.search;
    var myIP = myUrl.split('=')[1];
    let chart_response = await (fetch('/plant_chart' + '?node_ip=' + myIP));
    let response = await (fetch('/plant_detail_view' + '?node_ip=' + myIP));
    let data = await response.json();

    // get dry and wet value from database
    var dry_value = data[0].dry_value;
    var wet_value = data[0].wet_value;;

    // Creating the Box with plant and info
    var element = document.getElementById("plant_chart");
    element.insertAdjacentHTML('afterend', `\
<div class="box">
    <h3>
        Plant
        <br/>
        <br/>
        ${data[0].node_ip}
    </h3>
    <img src="/img/placeholder_plant.png" alt="Plant">
    <br/>
    <br/>
    Humidity: ${data[0].humidity}%
    <br/>
    <form action="/pump_toggle?node_ip=${myIP}" method="POST">
        <br/>
        <input type="submit" name="TOGGLE" value="Toggle Pump">
    </form>
    <br/>
    <form action="/calibrate_sensor" method="POST">
        <input type="hidden" name="node_ip" value="${myIP}">
        <input type="text" name="dry_value" value="${dry_value}" size="10">
        <input type="text" name="wet_value" value="${wet_value}" size="10">
        <br/>
        <br/>
        <input type="submit" value="Calibrate sensor" size="10">
    </form>
    <br/>
    <a href="/" text="Go back", title="Go back to plants overview" id="plantSetting"></a>
</div>
<div class="boxChart">
    <img src="/img/mychart.png" alt="Plant Chart">
</div>`);

    //var t = setTimeout(refreshPlants, 2000);
};

function plant_chart() {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#plant_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
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
