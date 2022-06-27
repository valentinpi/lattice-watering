var coap = require('coap');

var server = coap.createServer({ type: 'udp6' });

server.on('request', (req, res) => {
    console.log('server received coap message from: ' + req.url + ' | ' + req.url.split('/')[0] + ' | ' + req.url.split('/')[1] + ' | ' + req.url.split('/')[2] + ' | ' + req.url.split('/')[3]);
    console.log('payload from coap message: ' + req.payload + ' | ' + req.payload[0] + ' | ' + req.ip + ' | ');
    console.log(parseCoapPayload(req.payload));
});

server.on('response', (res) => {
    res.pipe(process.stdout);
    res.on('end', () => {
        process.exit(0);
    })
});

function parseCoapPayload(data) {
    const char_array = [];
    data.forEach(data_char => {
        char_array.push(String.fromCharCode(data_char));
    });
    return char_array;
}

try {
    server.listen(5683, () => {
        console.log('listening on port 5683 for coap requests');
    });
} catch (err) {
    console.log("No dtls active: " + err);
    console.log("First you need to generate a private key and public certificate:\nopenssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cert.key -out cert.crt -subj '/CN=m4n3dw0lf/O=dtls/C=BR'");

    server.listen(5683, () => {
        console.log('listening on port 5683 for coap requests without dtls');
    });
};