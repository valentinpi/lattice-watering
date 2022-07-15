"use strict";

var sqlite3 = require("sqlite3");

const DB_FILE_NAME = "lattice_watering.db";
const HUMIDITY_QUERY_LIMIT = 100; // Limit the number of humidities one can request.

var db = undefined;

function _create_table(table_name, query) {
    db.run(query, (err) => {
        if (err) {
            console.error(`Create table ${table_name} query error ${err}`);
            return;
        }
        console.log(`Table: "${table_name}" in database: "${DB_FILE_NAME}" created`);
    });
};

module.exports = {
    /* DB CREATION */
    init: function() {
        db = new sqlite3.Database(DB_FILE_NAME, sqlite3.OPEN_READWRITE, (err) => {
            if (err && err.code == "SQLITE_CANTOPEN") {
                console.log(`No database ${DB_FILE_NAME} found`);
                db = this.create_db();
                this.create_tables();
            } else if (err) {
                console.error(`Database Access error ${err}`);
                exit(1);
            }
        });
    },
    create_db: function () {
        var new_db = new sqlite3.Database(DB_FILE_NAME, (err) => {
            if (err) {
                console.error("Database creation error " + err);
                exit(1);
            }
            console.log("Database: " + DB_FILE_NAME + " created")
        });
        return new_db;
    },
    /* TABLE CREATION */
    create_tables: function(db) {
        // NOTE: We must assert that the `node_ip` column is unique.
        // The watering thresholds allow us to implement the following functionality: If the humidity is below 
        // `watering_threshold_bottom`, the plant will be watered for five seconds, then we will wait for the
        // `watering_threshold_timeout` to run out and check again until `watering_threshold_target` is reached.
        _create_table("plant_nodes", `
            CREATE TABLE IF NOT EXISTS plant_nodes (
                id INTEGER PRIMARY KEY NOT NULL,
                node_ip TEXT UNIQUE NOT NULL,
                pump_activated INTEGER,
                dry_value INTEGER,
                wet_value INTEGER,
                watering_threshold_bottom INTEGER,
                watering_threshold_target INTEGER,
                watering_threshold_timeout INTEGER
            );
        `);
        _create_table("plant_humidities", `
            CREATE TABLE IF NOT EXISTS plant_humidities (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                node INTEGER NOT NULL,
                date_time INTEGER,
                humidity INTEGER,
                FOREIGN KEY (node) REFERENCES plant_nodes(id)
            );
        `);
        // The watering times are in seconds.
        _create_table("plant_watering_schedules", `
            CREATE TABLE IF NOT EXISTS plant_watering_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                node INTEGER NOT NULL,
                watering_begin INTEGER,
                watering_end INTEGER,
                FOREIGN KEY (node) REFERENCES plant_nodes(id)
            );
        `);
    },
    /* INSERTION */
    // 20%-60% is a good threshold according to Kaan. See:
    // https://www.greenwaybiotech.com/blogs/gardening-articles/how-soil-moisture-affects-your-plants-growth
    // Note that -50000 can never be reached as the nodes send int16_t values. So the pump should never be activated due to poor or missin calibration.
    change_plant_node: async function(node_ip, pump_activated, dry_value, wet_value, watering_threshold_bottom = -50000, watering_threshold_target = 60, watering_threshold_timeout = 5) {
        return await new Promise(function (resolve) {
            db.run(`
                INSERT INTO plant_nodes (node_ip, pump_activated, dry_value, wet_value, watering_threshold_bottom, watering_threshold_target, watering_threshold_timeout)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(node_ip) DO UPDATE SET
                    pump_activated = ?,
                    dry_value = ?,
                    wet_value = ?,
                    watering_threshold_bottom = ?,
                    watering_threshold_target = ?,
                    watering_threshold_timeout = ?
                WHERE node_ip = ?;
            `, node_ip, pump_activated, dry_value, wet_value, watering_threshold_bottom, watering_threshold_target, watering_threshold_timeout, pump_activated, dry_value, wet_value, watering_threshold_bottom, watering_threshold_target, watering_threshold_timeout, node_ip, (err) => {
                if (err) {
                    console.error(`Insert query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
    insert_plant_humidity: async function (node_ip, humidity) {
        // Store the UNIX epoch to reduce storage space
        return await new Promise(function (resolve) {
            db.run(`
                INSERT INTO plant_humidities (node, date_time, humidity)
                    VALUES ((SELECT id FROM plant_nodes WHERE node_ip = ?), unixepoch(CURRENT_TIMESTAMP), ?);
            `, node_ip, humidity, (err) => {
                if (err) {
                    console.error(`Insert query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
    /* SELECTION */
    select_all: async function () {
        var data = 0;
        await new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_nodes;`, (err, rows) => {
                if (err) {
                    console.error(`Select query error ${err}`);
                } else {
                    console.log("Table plant_nodes: ");
                    console.table(rows);
                }
                resolve(data);
            });
        });
        await new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_humidities;`, (err, rows) => {
                if (err) {
                    console.error(`Select query error ${err}`);
                } else {
                    console.log("Table plant_humidities: ");
                    console.table(rows);
                }
                resolve(data);
            });
        });
        await new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_watering_schedules;`, (err, rows) => {
                if (err) {
                    console.error(`Select query error ${err}`);
                } else {
                    console.log("Table plant_watering_schedules: ");
                    console.table(rows);
                }
                resolve(data);
            });
        });
        return data;
    },
    select_plant_infos: async function () {
        var data = 0;
        // Returns all distinct plant information which sent info in the past 2 minutes
        // WHERE date_time >= DATETIME("now", "localtime", "-2 minutes")
        let return_data = await new Promise(function (resolve) {
            db.all(`
            SELECT
                pn.node_ip,
                MAX(ph.date_time) as date_time,
                ph.humidity
            FROM plant_nodes pn
            JOIN plant_humidities ph ON pn.id = ph.node
            GROUP BY ph.node;
            `, (err, rows) => {
                if (err) {
                    console.error(`Select query error: ${err}`);
                    resolve(data);
                } else {
                    data = rows;
                    resolve(data);
                }
            });
        });
        return return_data;
    },
    select_plant_info: async function (node_ip) {
        let data = 0;
        // Return infos of a single plant identified by its node_ip
        // AND ph.date_time >= DATETIME("now", "localtime", "-10 days").
        // We return the current configuration, as well as humidity values.
        let configuration = await new Promise(resolve => {
            db.all(`
            SELECT
                node_ip,
                pump_activated,
                dry_value,
                wet_value,
                watering_threshold_bottom,
                watering_threshold_target,
                watering_threshold_timeout
            FROM plant_nodes
            WHERE node_ip = ?;
            `, node_ip, (err, row) => {
                if (err) {
                    console.error(`Select query error: ${err}`);
                    resolve(data);
                } else {
                    data = row;
                    resolve(data);
                }
            });
        });
        let humidities = await new Promise(resolve => {
            db.all(`
            SELECT
                ph.date_time,
                ph.humidity
            FROM plant_nodes pn
            JOIN plant_humidities ph ON pn.id = ph.node
            WHERE pn.node_ip = ?
            ORDER BY ph.date_time DESC
            LIMIT ?;
            `, node_ip, HUMIDITY_QUERY_LIMIT, (err, rows) => {
                if (err) {
                    console.error(`Select query error: ${err}`);
                    resolve(data);
                } else {
                    data = rows;
                    resolve(data);
                }
            });
        });
        return {configuration: configuration[0], humidities: humidities};
    },
    /* PLANT WATERING SCHEDULES */
    select_plant_watering_schedules: async function () {
        let data = 0;
        let result = await new Promise(function (resolve) {
            db.run(`SELECT * FROM plant_watering_schedules;`, (err, rows) => {
                if (err) {
                    console.error(`Select query error: ${err}`);
                    resolve(data);
                } else {
                    data = rows;
                    resolve(data);
                }
            });
        });
        return result;
    },
    insert_plant_watering_schedule: async function (node_ip, watering_begin, watering_end) {
        return await new Promise(function (resolve) {
            db.run(`
                INSERT INTO plant_watering_schedules (node, watering_begin, watering_end)
                    VALUES ((SELECT id FROM plant_nodes WHERE node_ip = ?), ?, ?);
            `, node_ip, watering_begin, watering_end, (err) => {
                if (err) {
                    console.error(`Insert query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
    delete_plant_watering_schedule: async function (node_ip, watering_begin, watering_end) {
        return await new Promise(function (resolve) {
            db.run(`
                DELETE FROM plant_watering_schedules
                WHERE node = (SELECT id FROM plant_nodes WHERE node_ip = ?) AND watering_begin = ? AND watering_end = ?;
            `, node_ip, watering_begin, watering_end, (err) => {
                if (err) {
                    console.error(`Insert query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
};
