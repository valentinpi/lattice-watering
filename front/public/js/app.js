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

function pumpToggle(state) {
    var ip = document.getElementById('pumpIP').value;
    if (state) {
        console.log('Turning pump on at IP: ' + ip);
    } else {
        console.log('Turning pump off at IP: ' + ip);
    }


};

function startup() {
    dateTime();
};