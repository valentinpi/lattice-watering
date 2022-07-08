//"use strict"

//const { response } = require('express');
var sqlite3 = require('sqlite3');

module.exports = {
    databaseAccess: function () {
        var db_file = './lattice_watering.db';
        let db = new sqlite3.Database(db_file, sqlite3.OPEN_READWRITE, (err) => {
            if (err && err.code == "SQLITE_CANTOPEN") {
                console.log('No database: ' + db_file + ' found');
                this.createDatabase(db_file);
            } else if (err) {
                console.log("Database Access error " + err);
                exit(1);
            } else {
                console.log('Database: ' + db_file + ' found and connected')
            }
        });
        return db;
    },

    createDatabase: function (db_file) {
        var newdb = new sqlite3.Database(db_file, (err) => {
            if (err) {
                console.log("Database creation error " + err);
                exit(1);
            }
            console.log('Database: ' + db_file + ' created')
            this.createTable(newdb);
        });
    },

    createTable: function(db) {
        db.run(`
        CREATE TABLE IF NOT EXISTS plant_nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT NULL,
            node_ip TEXT,
            date_time TEXT,
            humidity INTEGER
        );
        `, (err) => {
            if (err) {
                console.log("Create table plant_nodes query error " + err);
                return;
            }
            console.log('Table: "plant_nodes" in database: "lattice_watering.db" created');
        });
        db.run(`
        CREATE TABLE IF NOT EXISTS plant_status (
            node_ip TEXT PRIMARY KEY,
            pump_state INTEGER,
            dry_value INTEGER,
            wet_value INTEGER
        );
        `, (err) => {
            if (err) {
                console.log("Create table plant_status query error " + err);
                return;
            }
            console.log('Table: "plant_status" in database: "lattice_watering.db" created');
        });
    },

    insertPlantNode: function (node_ip = '::1', humidity = 0) {
        var db = this.databaseAccess();
        db.run(`
        INSERT INTO plant_nodes (id, node_ip, date_time, humidity)
            VALUES (NULL, ?, datetime('now','localtime'), ?);
        `, node_ip, humidity, (err) => {
            if (err) {
                console.log('Insert plant_node query error: ' + err);
                return;
            }
            console.log('Inserted row with data into table "plant_nodes"');
        });
    },

    insertPlantStatus: function (node_ip = '::1', pump_state = 0, dry_value = 0, wet_value = 99999) {
        var db = this.databaseAccess();
        db.run(`
        INSERT INTO plant_status (node_ip, pump_state, dry_value, wet_value)
            VALUES (?, ?, ?, ?);
        `, node_ip, pump_state, dry_value, wet_value, (err) => {
            if (err) {
                console.log('Insert plant_status query error: ' + err);
                return;
            }
            console.log('Inserted row with data into table "plant_status"');
        });
    },

    selectAll: async function () {
        var db = this.databaseAccess();
        var data = 0;
        let myPromise = new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_nodes`, (err, rows) => {
                if (err) {
                    console.log('Select query error ' + err);
                    // resolve(data);
                } else {
                    console.log('Table plant_nodes: ');
                    rows.forEach(row => {
                        console.log(row.id + "\t" + row.node_ip + "\t" + row.date_time + "\t" + row.humidity);
                    });
                    // resolve(data);
                }
            });
            db.all(`SELECT * FROM plant_status`, (err, rows) => {
                if (err) {
                    console.log('Select query error ' + err);
                    // resolve(data);
                } else {
                    console.log('Table plant_status: ');
                    rows.forEach(row => {
                        console.log(row.node_ip + "\t" + row.pump_state + "\t" + row.dry_value + "\t" + row.wet_value);
                    });
                    // resolve(data);
                }
            });
            resolve(data);
        });
        var return_data = await myPromise;
        return return_data;
    },

    selectPlantInfos: async function () {
        var db = this.databaseAccess();
        var data = 0;
        //Returns all distinct plant information which sent info in the past 2 minutes
        //WHERE date_time >= DATETIME('now', 'localtime', '-2 minutes')
        let myPromise = new Promise(function (resolve) {
            db.all(`
            SELECT
                ps.node_ip,
                ps.pump_state,
                MAX(pn.date_time) as date_time,
                pn.humidity
            FROM plant_status ps
            JOIN plant_nodes pn ON pn.node_ip = ps.node_ip
            GROUP BY ps.node_ip
            `, (err, rows) => {
                if (err) {
                    console.log('Select query error: ' + err);
                    resolve(data);
                } else {
                    data = rows;
                    resolve(data);
                }
            });

        })
        var return_data = await myPromise;
        return return_data;
    },

    selectSinglePlant: async function (nodeIP) {
        var db = this.databaseAccess();
        var data = 0;
        //Return infos of a single plant identified by its node_ip
        let myPromise = new Promise(function (resolve) {
            db.all(`
            SELECT
                ps.node_ip,
                ps.pump_state,
                ps.dry_value,
                ps.wet_value,
                MAX(pn.date_time) as date_time,
                pn.humidity
            FROM plant_status ps
            JOIN plant_nodes pn ON pn.node_ip = ps.node_ip
            WHERE ps.node_ip = ?
            GROUP BY ps.node_ip
            `, nodeIP, (err, row) => {
                if (err) {
                    console.log('Select query error: ' + err);
                    resolve(data);
                } else {
                    data = row;
                    resolve(data);
                }
            });
        })
        var return_data = await myPromise;
        return return_data;
    },

    changePlantStatus: async function (nodeIP = '::1', pumpState = 0, dry_value = 0, wet_value = 99999) {
        var db = this.databaseAccess();
        var data = 0;
        let myPromise = new Promise(function (resolve) {
            db.all(`
            UPDATE plant_status
            SET
                pump_state = ?,
                dry_value = ?,
                wet_value = ?
            WHERE node_ip = ?
            `, pumpState, dry_value, wet_value, nodeIP, (err) => {
                if (err) {
                    console.log('Update query error: ' + err);
                    data = 0;
                    resolve(data);
                } else {
                    data = 1;
                    resolve(data);
                }
            });
        })
        var return_data = await myPromise;
        return return_data;
    }
};