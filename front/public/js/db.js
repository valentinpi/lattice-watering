//"use strict"

const { response } = require('express');
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
        CREATE TABLE plant_nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT NULL,
            node_ip TEXT,
            plant_name TEXT,
            date_time TEXT,
            humidity INTEGER
        );
        `, (err) => {
            if (err) {
                console.log("Create query error " + err);
                return;
            }
            console.log('Table: "plant_nodes" in database: "lattice_watering.db" created');
        });
    },

    insertQuery: function(node_ip = '::1', plant_name = 'NULL', humidity = '42') {
        var db = this.databaseAccess();
        db.run(`
        INSERT INTO plant_nodes (id, node_ip, plant_name, date_time, humidity)
            VALUES (NULL, ?, ?, datetime('now','localtime'), ?);
        `, node_ip, plant_name, humidity, (err) => {
            if (err) {
                console.log('Insert query error: ' + err);
                return;
            }
            console.log('Inserted row with data into table "plant_nodes"');
        });
    },

    selectAll: async function () {
        var db = this.databaseAccess();
        var data = 0;
        //Returns all rows from table
        let myPromise = new Promise(function (resolve) {
            db.all(`SELECT * FROM plant_nodes`, (err, rows) => {
                if (err) {
                    console.log('Select query error ' + err);
                    resolve(data);
                } else {
                    rows.forEach(row => {
                        console.log(row.id + "\t" + row.node_ip + "\t" + row.plant_name + "\t" + row.date_time + "\t" + row.humidity);
                    });
                    resolve(data);
                }
            });
        })
        var return_data = await myPromise;
        return return_data;
    },

    selectCountIps: async function () {
        var db = this.databaseAccess();
        var data = 0;
        //Returns amount of distinct ips in table
        let myPromise = new Promise(function (resolve) {
            db.all(`SELECT COUNT(DISTINCT node_ip) AS plant_num FROM plant_nodes`, (err, rows) => {
                if (err) {
                    console.log('Select query error: ' + err);
                    resolve(data);
                } else {
                    data = rows[0].plant_num;
                    resolve(data);
                }
            });

        })
        var return_data = await myPromise;
        return return_data;
    },

    selectPlantInfos: async function () {
        var db = this.databaseAccess();
        var data = 0;
        //Returns amount of distinct ips in table
        let myPromise = new Promise(function (resolve) {
            db.all(`
            SELECT
                id as id,
                node_ip,
                plant_name as plant_name,
                MAX(date_time) as date_time,
                humidity as humidity
            FROM plant_nodes
            GROUP BY node_ip
            `, (err, rows) => {
                if (err) {
                    console.log('Select query error: ' + err);
                    resolve(data);
                } else {
                    //rows.forEach(row => {
                    //    console.log(row.id + "\t" + row.node_ip + "\t" + row.plant_name + "\t" + row.date_time + "\t" + row.humidity);
                    //});
                    //data = rows[0].plant_num;
                    data = rows;
                    resolve(data);
                }
            });

        })
        var return_data = await myPromise;
        return return_data;
    },

    selectSinglePlant: async function (plantIP) {
        var db = this.databaseAccess();
        var data = 0;
        //Return infos of a single plant identified by its node_ip
        let myPromise = new Promise(function (resolve) {
            db.all(`
            SELECT
                id as id,
                node_ip,
                plant_name as plant_name,
                MAX(date_time) as date_time,
                humidity as humidity
            FROM plant_nodes
            WHERE node_ip = ?
            GROUP BY node_ip
            `,plantIP, (err, row) => {
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
    }
};