# lattice-watering frontend

## How to start
1. Search the front folder in your terminal:
		```cd .../lattice-watering/front```
1. Install used dependencies:
		```npm install```
2. Start the application:
		```npm start```

### Folder Hierarchy
- `cred`: Not decided if it or "cred.conf" will be used, maybe remove for final product
- `public`: Storage for all .css, .img and secondary .js files
- `src`: Not in use, remove for final product
- `view`: Stores all html files to be send and displayed at the client

### File Overview
- `justfile`: Automation of terminal commands
- `package.json`: Will be called when `npm start` is used, start "main" and stores "dependencies" names
- `package-lock.json`: Holds information about all "dependencies" and used modules which will be installed with `npm install`
- `server.js`: Heart of the machine, will be called as "main" and starts the server to which the clients connect

### What's used
- `coap`: Communication to IoT devices
- `express`: Chosen web framework
- `http`
- `morgan`: Logs HTTP request and errors
- `sqlite3`: Chosen database, offline, in-place, one file which can easily be transfered
- `dtls`: Security protocol
- `url`