"use strict"

function startup(isIndex = 0) {
    if (isIndex) {
        dateTime();
        refreshPlants();
    } else {
        dateTime();
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

    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }

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
    var form = document.createElement('form');
    form.action = '/pumpToggle' + '?nodeIP=' + myIP;
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

    div.appendChild(h3);
    div.appendChild(img);
    div.appendChild(br.cloneNode(true));
    div.appendChild(br.cloneNode(true));
    div.appendChild(text_hum);
    div.appendChild(br.cloneNode(true));
    form.appendChild(input1);
    form.appendChild(input2);
    div.appendChild(form);
    div.appendChild(a);
    element.appendChild(div);

    //var t = setTimeout(refreshPlants, 2000);
};