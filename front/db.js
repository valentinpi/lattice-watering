"use strict";

const sqlite3 = require("sqlite3");

const DB_FILE_NAME = "lattice_watering.db";
const HUMIDITY_QUERY_LIMIT = 100; // Limit the number of humidities one can request.

let db = undefined;

async function _create_table(table_name, query) {
    await new Promise(resolve => {
            db.run(query, (err) => {
                if (err) {
                    console.error(`Create table ${table_name} query error ${err}`);
                    return;
                }
                console.log(`Table: "${table_name}" in database: "${DB_FILE_NAME}" created`);
                resolve(0);
            });
        }
    );
};

function _create_db() {
    let new_db = new sqlite3.Database(DB_FILE_NAME, (err) => {
        if (err) {
            console.error(`Database creation error: ${err}`);
            exit(1);
        }
        console.log(`Database ${DB_FILE_NAME} created`);
    });
    return new_db;
}

async function _create_tables() {
    await _create_table("plant_nodes", `
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
    await _create_table("plant_humidities", `
        CREATE TABLE IF NOT EXISTS plant_humidities (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            node INTEGER NOT NULL,
            date_time INTEGER,
            humidity INTEGER,
            FOREIGN KEY (node) REFERENCES plant_nodes(id)
        );
    `);
    // The watering times are in seconds.
    await _create_table("plant_watering_schedules", `
        CREATE TABLE IF NOT EXISTS plant_watering_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            node INTEGER NOT NULL,
            watering_begin INTEGER,
            watering_end INTEGER,
            FOREIGN KEY (node) REFERENCES plant_nodes(id)
        );
    `);
}

module.exports = {
    /* DB CREATION */
    init: async () => {
        await new Promise(resolve => {
            db = new sqlite3.Database(DB_FILE_NAME, sqlite3.OPEN_READWRITE, async (err) => {
                console.log("HERE");
                if (err && err.code == "SQLITE_CANTOPEN") {
                    db = _create_db();
                    await _create_tables();
                    resolve(0);
                } else if (err) {
                    console.error(`Database Access error ${err}`);
                    exit(1);
                }
            });
        });
    },
    /* INSERTION */
    change_plant_node: async (node_ip, pump_activated, dry_value, wet_value, watering_threshold_bottom = -50000, watering_threshold_target = 60, watering_threshold_timeout = 5) => {
        return await new Promise((resolve) => {
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
    insert_plant_humidity: async (node_ip, humidity) => {
        // Store the UNIX epoch to reduce storage space
        return await new Promise(resolve => {
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
    select_all: async () => {
        let data = 0;
        await new Promise(resolve => {
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
        await new Promise(resolve => {
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
        await new Promise(resolve => {
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
    select_plant_infos: async () => {
        let data = 0;
        // Returns all distinct plant information which sent info in the past 2 minutes
        // WHERE date_time >= DATETIME("now", "localtime", "-2 minutes")
        let return_data = await new Promise(resolve => {
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
    select_plant_info: async node_ip => {
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
    select_plant_watering_schedule: async (node_ip) => {
        let data = 0;
        let result = await new Promise(resolve => {
            db.all(`SELECT watering_begin, watering_end FROM plant_watering_schedules WHERE node = (SELECT id FROM plant_nodes WHERE node_ip = ?);`, node_ip, (err, rows) => {
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
    select_plant_watering_schedules: async () => {
        let data = 0;
        let result = await new Promise(resolve => {
            db.all(`SELECT
                        node_ip,
                        watering_begin,
                        watering_end
                    FROM plant_watering_schedules pws
                    JOIN plant_nodes pn ON pn.id=pws.node;`, (err, rows) => {
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
    insert_plant_watering_schedule: async (node_ip, watering_begin, watering_end) => {
        return await new Promise(resolve => {
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
    delete_plant_watering_schedule: async (node_ip, watering_begin, watering_end) => {
        return await new Promise(resolve => {
            db.run(`
                DELETE FROM plant_watering_schedules
                WHERE node = (SELECT id FROM plant_nodes WHERE node_ip = ?) AND watering_begin = ? AND watering_end = ?;
            `, node_ip, watering_begin, watering_end, (err) => {
                if (err) {
                    console.error(`Delete query error: ${err}`);
                    resolve(0);
                } else {
                    resolve(1);
                }
            });
        });
    },
};
