"use strict";

var sqlite3 = require('sqlite3');

const DB_FILE_NAME = 'lattice_watering.db';

var db = undefined;

function _create_table(table_name, query) {
    db.run(query, (err) => {
        if (err) {
            console.log(`Create table ${table_name} query error ${err}`);
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
                console.log(`Database Access error ${err}`);
                exit(1);
            }
        });
    },
    create_db: function () {
        var new_db = new sqlite3.Database(DB_FILE_NAME, (err) => {
            if (err) {
                console.log("Database creation error " + err);
                exit(1);
            }
            console.log('Database: ' + DB_FILE_NAME + ' created')
        });
        return new_db;
    },
    /* TABLE CREATION */
    create_tables: function(db) {
        // NOTE: We must assert that the `node_ip` column is unique.
        _create_table('plant_nodes', `
            CREATE TABLE IF NOT EXISTS plant_nodes (
                id INTEGER PRIMARY KEY NOT NULL,
                node_ip TEXT UNIQUE NOT NULL,
                pump_activated INTEGER,
                dry_value INTEGER,
                wet_value INTEGER
            );
        `);
        _create_table('plant_humidities', `
            CREATE TABLE IF NOT EXISTS plant_humidities (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                node INTEGER NOT NULL,
                date_time TEXT,
                humidity INTEGER,
                FOREIGN KEY (node) REFERENCES plant_nodes(id)
            );
        `);
    },
    /* INSERTION */
    change_plant_node: async function(node_ip, pump_activated, dry_value, wet_value) {
        return await new Promise(function (resolve) {
            db.run(`
                INSERT INTO plant_nodes (node_ip, pump_activated, dry_value, wet_value)
                    VALUES (?, ?, ?, ?)
                ON CONFLICT(node_ip) DO UPDATE SET
                    pump_activated = ?,
                    dry_value = ?,
                    wet_value = ?
                WHERE node_ip = ?;
            `, node_ip, pump_activated, dry_value, wet_value, pump_activated, dry_value, wet_value, node_ip, (err) => {
                if (err) {
                    console.log(`Insert query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
    insert_plant_humidity: async function (node_ip, humidity) {
        return await new Promise(function (resolve) {
            db.run(`
                INSERT INTO plant_humidities (node, date_time, humidity)
                    VALUES ((SELECT id FROM plant_nodes WHERE node_ip = ?), datetime('now','localtime'), ?);
            `, node_ip, humidity, (err) => {
                if (err) {
                    console.log(`Insert query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
    select_all: async function () {
        var data = 0;
        let myPromise = new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_nodes;`, (err, rows) => {
                if (err) {
                    console.log(`Select query error ${err}`);
                } else {
                    console.log('Table plant_nodes: ');
                    console.table(rows);
                }
                resolve(data);
            });
        });
        await myPromise;
        myPromise = new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_humidities;`, (err, rows) => {
                if (err) {
                    console.log(`Select query error ${err}`);
                } else {
                    console.log('Table plant_humidities: ');
                    console.table(rows);
                }
                resolve(data);
            });
        });
        await myPromise;
        return data;
    },
    select_plant_infos: async function () {
        var data = 0;
        // Returns all distinct plant information which sent info in the past 2 minutes
        // WHERE date_time >= DATETIME('now', 'localtime', '-2 minutes')
        let return_data = await new Promise(function (resolve) {
            db.all(`
            SELECT
                pn.node_ip,
                MAX(ph.date_time) as date_time,
                ph.humidity
            FROM plant_nodes pn
            JOIN plant_humidities ph ON pn.id = ph.node
            GROUP BY ph.node
            `, (err, rows) => {
                if (err) {
                    console.log(`Select query error: ${err}`);
                    resolve(data);
                } else {
                    data = rows;
                    resolve(data);
                }
            });
        })
        return return_data;
    },
    select_plant_info: async function (node_ip) {
        var data = 0;
        // Return infos of a single plant identified by its node_ip
        // AND ph.date_time >= DATETIME('now', 'localtime', '-10 days')
        let return_data = await new Promise(function (resolve) {
            db.all(`
            SELECT
                pn.node_ip,
                pn.pump_activated,
                pn.dry_value,
                pn.wet_value,
                ph.date_time,
                ph.humidity
            FROM plant_nodes pn
            JOIN plant_humidities ph ON pn.id = ph.node
            WHERE pn.node_ip = ?
            `, node_ip, (err, row) => {
                if (err) {
                    console.log(`Select query error: ${err}`);
                    resolve(data);
                } else {
                    data = row;
                    resolve(data);
                }
            });
        })
        return return_data;
    }
};