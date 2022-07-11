"use strict";

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
        i = "0" + i;
    }
    return i;
};

/* -------------------- index -------------------- */
async function refreshPlants() {
    let response = await (fetch('/plantRefresh'));
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
    var img = document.createElement('img');
        img.src = '/img/placeholder_plant.png';
        img.alt = 'Plant';
    var a = document.createElement('a');
        a.id = 'plantSetting';
        a.title = 'Configure desired humidity and show statistics';
        a.text = 'Settings ...';

    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }

    //Add boxes for every distinct plant_ip in table in db
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            while (div.hasChildNodes()) {
                div.removeChild(div.firstChild);
            }
            h3.textContent = 'Plant ' + data[i].node_ip;
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
    } else {
        div2.appendChild(h1);
        element.appendChild(div2);
    }
    var t = setTimeout(refreshPlants, 5000);
};

/* ------------------ plantView ------------------ */
async function plantDetailView() {
    var myUrl = location.search;
    var myIP = myUrl.split('=')[1];
    let chartResponse = await (fetch('/plantChart' + '?nodeIP=' + myIP));
    let response = await (fetch('/plantDetailView' + '?nodeIP=' + myIP));
    let data = await response.json();

    //Creating the Box with plant and info
    var element = document.getElementById("scrollmenu");
    var div = document.createElement('div');
        div.classList.add('box');
    var br = document.createElement('br');
    var h3 = document.createElement('h3');
        h3.textContent = 'Plant ' + data[0].node_ip;
    var img = document.createElement('img');
        img.src = '/img/placeholder_plant.png';
        img.alt = 'Plant';
    var text_hum = document.createTextNode('Humidity: ' + data[0].humidity + '%');
    var form = document.createElement('form');
        form.action = '/pump_toggle' + '?nodeIP=' + myIP;
        form.method = 'POST';
    var input1 = document.createElement('input');
        input1.type = 'submit';
        input1.name = 'TRUE';
        input1.value = 'Turn Pump On';
    var input2 = document.createElement('input');
        input2.type= 'submit';
        input2.name = 'FALSE';
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
        wet_value.placeholder = 'Wet value';
        wet_value.size = "10";
    var dry_value = document.createElement('input');
        dry_value.type= 'text';
        dry_value.name = 'dry_value';
        dry_value.placeholder = 'Dry Value';
        dry_value.size = "10";
    var set_value = document.createElement('input');
        set_value.type= 'submit';
        set_value.name = 'set_value';
        set_value.value = 'SET VALUE';
        set_value.size = "10";

    var div2 = document.createElement('div');
        div2.classList.add('boxChart');
    var chart = document.createElement('img');
        chart.src = '/img/mychart.png';
        chart.alt = 'Plant Chart';

    div.appendChild(h3);
    div.appendChild(img);
    div.appendChild(br.cloneNode(true));
    div.appendChild(br.cloneNode(true));
    div.appendChild(text_hum);
    div.appendChild(br.cloneNode(true));
    form.appendChild(input1);
    form.appendChild(input2);
    form_config.appendChild(dry_value);
    form_config.appendChild(wet_value);
    //form.config.appendChild(br.cloneNode(true));
    form_config.appendChild(set_value);
    div.appendChild(form);
    div.appendChild(br.cloneNode(true));
    div.appendChild(form_config);
    div.appendChild(a);
    div2.append(chart);
    element.appendChild(div);
    element.appendChild(div2);

    //var t = setTimeout(refreshPlants, 2000);
};

function plantChart() {
    
};