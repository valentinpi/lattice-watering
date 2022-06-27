//var db = require('./public/js/db');
//var dateTime = require('./dateTime');
//var pump = require('./pump');
//var url = require('url');
//var http = require('http');

function startup() {
    dateTime();
    refreshPlants();
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

var box_id = 0;

async function refreshPlants() {
    //var data = await getServerRes();
    let response = await (fetch('/plant_count'));
    let data = await response.json();
    console.log(data);

    var element = document.getElementById("scrollmenu");

    //for (var j = 0; j < box_id; j++) {
    //    element.removeChild();
    //}

    //Add boxes for every distinct plant_ip in table in db
    for (var i = 0; i < data; i++) {
        box_id = box_id + 1;

        var div = document.createElement("div");
        div.classList.add('box');
        var br = document.createElement("br");
        var h3 = document.createElement("h3");
        h3.textContent = "Plant " + box_id;
        var img = document.createElement("img");
        img.src = "/img/placeholder_plant.png";
        img.alt = "Plant";
        var text_hum = document.createTextNode("Humidity: n/a %");
        var a = document.createElement("a");
        a.id = "plantSetting";
        a.title = "Configure desired humidity and show statistics";
        a.href = "plantView";
        a.onclick = "showPlant(1)";
        a.text = "Settings ...";

        div.appendChild(h3);
        div.appendChild(img);
        div.appendChild(br.cloneNode(true));
        div.appendChild(br.cloneNode(true));
        div.appendChild(text_hum);
        div.appendChild(br.cloneNode(true));
        div.appendChild(a);
        //var element = document.getElementById("scrollmenu");
        element.appendChild(div);
    }
    //var t = setTimeout(refreshPlants, 2000);
};