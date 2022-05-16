
function displayDate() {
    var today = new Date();
    var date = checkFormat(today.getDate()) + '.' + checkFormat((today.getMonth() + 1)) + '.' + today.getFullYear();
    var time = checkFormat(today.getHours()) + ":" + checkFormat(today.getMinutes()) + ":" + checkFormat(today.getSeconds());

    document.getElementById("displayDateTime").innerHTML = time + ', ' + date;
    var t = setTimeout(displayDate, 500);
}

function checkFormat(i) {
    if (i < 10) {
        i = "0" + i
    };
    return i;
}

function showPlant(i) {
    /* TODO - Show current temperatur, humidity and water settings for plant i */
}

function databaseAccess() {
    /* TODO - Setup small local database with plants and when they should be watered */
    const mysql = require("mysql");

    const db = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "test"
    });

    db.connect((err) => {
        if (err) { throw err; }
        console.log("DB connection OK");
    });

    // (C) QUERY
    db.query("SELECT * FROM `plants`", (err, results) => {
        if (err) { throw err; }
        console.log(results);
    });

}