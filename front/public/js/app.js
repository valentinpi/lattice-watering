//var database = require('./database');
//var dateTime = require('./dateTime');
//var pump = require('./pump');
//var url = require('url');
//var http = require('http');

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

function startup() {
    dateTime();
};

var reqs_id = 0;
function refreshPlants() {
    reqs_id++; // increment reqs_id to get a unique ID for the new element

    //create textbox
    var input = document.createElement('box');
    input.type = "div";
    input.setAttribute('id', 'box' + reqs_id);
    input.setAttribute('value', reqs_id);
    var reqs = document.getElementById("box");

    //append elements
    reqs.appendChild(input);
};