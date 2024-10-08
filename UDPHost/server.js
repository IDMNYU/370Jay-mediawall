const dgram = require('dgram');
const udpServer = dgram.createSocket('udp4');

udpServer.on('listening', () => {
  console.log('UDP server is listing...');
});

const init = (port) => {
  udpServer.bind(port);

  udpServer.on('message', (msgStream, rinfo) => {
    console.log('msg is', msgStream.toString());
    console.log('rinfo', rinfo);
  });
};

const send = (target) => {
  const data = 'HELLO WORLD.. !';
  udpServer.send(data, 0, data.length, target, '127.0.0.1', (err, len) => {
    console.log('error', err);
    console.log('sent length', len);
  });
};

// when you run this file make sure these parameter to be passed
// myPort, <s, c>, target (if c)
init(parseInt(process.argv[2]));
if (process.argv[3] === 'c') {
  console.log('send message');
  send(parseInt(process.argv[4]));
}