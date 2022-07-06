"use strict"

function startup(isIndex = 0) {
    if (isIndex) {
        //Index with plant overview
        dateTime();
        refreshPlants();
    } else {
        //PlantView with more details to one specific node_ip
        dateTime();
        //plantChart();
        plantDetailView();
    }
};

function dateTime() {
    var today = new Date();
    var date = checkFormat(today.getDate()) + '.' + checkFormat((today.getMonth() + 1)) + '.' + today.getFullYear();
    var time = checkFormat(today.getHours()) + ":" + checkFormat(today.getMinutes()) + ":" + checkFormat(today.getSeconds());

    document.getElementById("displayDateTime").innerHTML = time + ', ' + date;
    var t = setTimeout(dateTime, 500);
};

function checkFormat(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
};

/* -------------------- index -------------------- */
async function refreshPlants() {
    let response = await (fetch('/plantRefresh'));
    let data = await response.json();

    var element = document.getElementById("scrollmenu");
    var div = document.createElement('div');
        div.classList.add('box');
    var br = document.createElement('br');
    var h3 = document.createElement('h3');
    var img = document.createElement('img');
        img.src = '/img/placeholder_plant.png';
        img.alt = 'Plant';
    var a = document.createElement('a');
        a.id = 'plantSetting';
        a.title = 'Configure desired humidity and show statistics';
        a.text = 'Settings ...';

    // while (element.hasChildNodes()) {
    //     element.removeChild(element.firstChild);
    // }

    //Add boxes for every distinct plant_ip in table in db
    for (var i = 0; i < data.length; i++) {
        while (div.hasChildNodes()) {
            div.removeChild(div.firstChild);
        }

        if (data[i].plant_name) {
            h3.textContent = data[i].plant_name + ' Plant';
        } else {
            h3.textContent = 'Plant ' + data[i].node_ip;
        }
        var text_hum = document.createTextNode('Humidity: ' + data[i].humidity + '%');
        a.href = 'plantView?node_ip=' + data[i].node_ip;

        div.appendChild(h3.cloneNode(true));
        div.appendChild(img.cloneNode(true));
        div.appendChild(br.cloneNode(true));
        div.appendChild(br.cloneNode(true));
        div.appendChild(text_hum);
        div.appendChild(br.cloneNode(true));
        div.appendChild(a.cloneNode(true));
        element.appendChild(div.cloneNode(true));
    }
    var t = setTimeout(refreshPlants, 2000);
};

/* ------------------ plantView ------------------ */
async function plantDetailView() {
    var myUrl = location.search;
    var myIP = myUrl.split('=')[1];
    let response = await (fetch('/plantDetailView' + '?nodeIP=' + myIP));
    let data = await response.json();

    //Creating the Box with plant and info
    var element = document.getElementById("scrollmenu");
    var div = document.createElement('div');
        div.classList.add('box');
    var br = document.createElement('br');
    var h3 = document.createElement('h3');
    if (data[0].plant_name) {
        h3.textContent = data[0].plant_name + ' Plant';
    } else {
        h3.textContent = 'Plant ' + data[0].node_ip;
    };
    var img = document.createElement('img');
        img.src = '/img/placeholder_plant.png';
        img.alt = 'Plant';
    var text_hum = document.createTextNode('Humidity: ' + data[0].humidity + '%');
    var form_pump = document.createElement('form');
    form.action = '/pump_toggle' + '?nodeIP=' + myIP;
        form.method = 'POST';
    var input1 = document.createElement('input');
        input1.type = 'submit';
        input1.name = 'pumpOn';
        input1.value = 'Turn Pump On';
    var input2 = document.createElement('input');
        input2.type= 'submit';
        input2.name = 'pumpOff';
        input2.value = 'Turn Pump Off';
    var a = document.createElement('a');
        a.id = 'plantSetting';
        a.title = 'Go back to all plants';
        a.text = 'Go back';
        a.href = '/';
    var form_config = document.createElement('form');
    form.action = '/calibrate_sensor' + '?nodeIP=' +myIP + '?wet_value='+wet_value+ '?dry_value='+dry_value;
        form.method = 'POST';
    var wet_value = document.createElement('input');
        wet_value.type= 'text';
        wet_value.name = 'wet_value';
        wet_value.value = 'WET VALUE';
        wet_value.size = "10";
    var dry_value = document.createElement('input');
        dry_value.type= 'text';
        dry_value.name = 'dry_value';
        dry_value.value = 'DRY VALUE';
        dry_value.size = "10";
    var set_value = document.createElement('input');
        set_value.type= 'submit';
        set_value.name = 'set_value';
        set_value.value = 'SET VALUE';
        set_value.size = "10";

    div.appendChild(h3);
    div.appendChild(img);
    div.appendChild(br.cloneNode(true));
    div.appendChild(br.cloneNode(true));
    div.appendChild(text_hum);
    div.appendChild(br.cloneNode(true));
    form_pump.appendChild(input1);
    form_pump.appendChild(input2);
    form_config.appendChild(dry_value);
    form_config.appendChild(wet_value);
    form_config.appendChild(set_value);
    div.appendChild(form_pump);
    div.appendChild(form_config);
    div.appendChild(a);
    element.appendChild(div);

    //var t = setTimeout(refreshPlants, 2000);
};

function plantChart() {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#plantChart")
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