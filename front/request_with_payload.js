dtls = { address: "localhost", port: 5684, udpPort: 5687 }
const coap = require('coap'); // or coap
    , req = coap.request('coap://localhost/m4n3dw0lf', dtls)

req.sender._port = dtls.udpPort

req.on('response', function (res) {
    res.pipe(process.stdout)
})

req.end()


/*
coap.createServer((req, res) => {
    res.end('Hello ' + req.url.split('/')[1] + '\nMessage payload:\n' + req.payload + '\n')
}).listen(() => {
    const req = coap.request('coap://localhost/pumpOn')

    const payload = {
        title: 'this is a test payload',
        body: 'containing nothing useful'
    }

    req.write(JSON.stringify(payload))

    req.on('response', (res) => {
        res.pipe(process.stdout)
        res.on('end', () => {
            process.exit(0)
        })
    })

    req.end()
})
*/
/*
io.on('connection', function (socket) {

    io.emit('info', 'connection to websocketserver succesfully established');
    console.log('info: a user connected to the websocket server');


    var req;
    mysocket = socket;
    socket.on('coap', function (msg) {

        console.log('Received a new coap request with options: ' + msg);

        var config = JSON.parse(msg);
        url = URL.parse(config.url);
        url.method = config.method;
        url.observe = config.observe;

        req = request(url).on('response', transmitResponse);
        req.end();
        process.stdin.pipe(req);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});
*/
/*
var transmitResponse = function (res) {

    res.on('data', function (data) {

        mysocket.on('cancel', function (msg) {
            console.log("Tried to cancel");
            res.close();
        });

        var strData = data.toString('utf-8');
        var payload = JSON.parse(strData);

        if (debug) {
            var sensorServerTime = new Date(payload.timestamps[0]);
            var webServerTime = new Date();

            var sensorServerTimeOutput = sensorServerTime.getHours() + ":" + sensorServerTime.getMinutes() + ":" + sensorServerTime.getSeconds() + "." + sensorServerTime.getMilliseconds();
            var webServerTimeOutput = webServerTime.getHours() + ":" + sensorServerTime.getMinutes() + ":" + sensorServerTime.getSeconds() + "." + sensorServerTime.getMilliseconds();
            var delay = webServerTime - sensorServerTime;
            console.log(sensorServerTimeOutput + ": Received a chunk from: " + webServerTimeOutput + " --> Delay: " + delay + " ms");
        }

        payload.timestamps.push(new Date().getTime());
        io.emit('coap', JSON.stringify(payload));

    });

    res.on('end', function () {
        console.log('Stream ended!');
    });

    if (!res.payload.length) process.exit(0);
};
*/