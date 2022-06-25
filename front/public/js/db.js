"use strict"

var sqlite3 = require('sqlite3');

module.exports = {
    databaseAccess: function() {
        let db = new sqlite3.Database('./lattice_watering.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err && err.code == "SQLITE_CANTOPEN") {
                console.log('No database: "lattice_watering.db" found');
                this.createDatabase();
            } else if (err) {
                console.log("Database Access error " + err);
                exit(1);
            } else {
                console.log('Database: "lattice_watering.db" found and connected')
            }

            this.insertQuery(db);
            this.selectQuery(db, 0);
            this.selectQuery(db, 1);
        });
    },

    createDatabase: function() {
        var newdb = new sqlite3.Database('./lattice_watering.db', (err) => {
            if (err) {
                console.log("Database creation error " + err);
                exit(1);
            }
            console.log('Database: "lattice_watering.db" created')
            this.createQuery(newdb);
        });
    },

    createQuery: function(db) {
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

    insertQuery: function(db) {
        //placedholder-mania
        var node_ip = '::1';
        var plant_name = 'Tomato';
        var humidity = '42';
        //date_time creation is asynchonous with nodes, data is not perfect (crashes ...)
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

    selectQuery: function(db, query = 0) {
        if (query == 0) {
            db.all(`SELECT * FROM plant_nodes`, (err, rows) => {
                if (err) {
                    console.log('Select query error ' + err);
                    return;
                };
                //console.log(rows);

                rows.forEach(row => {
                    console.log(row.id + "\t" + row.node_ip + "\t" + row.plant_name + "\t" + row.date_time + "\t" + row.humidity);
                });
            });
        } else if (query == 1) {
            var data = 0;
            db.all(`SELECT COUNT(DISTINCT node_ip) AS plant_num FROM plant_nodes`, (err, rows) => {
                if (err) {
                    console.log('Select query error: ' + err); return;
                };
                rows.forEach(row => {
                    data = row.plant_num;
                    //console.log(row.plant_num);
                });
                console.log('Current Number of plants is: ' + data);
            });
        };
    }
};