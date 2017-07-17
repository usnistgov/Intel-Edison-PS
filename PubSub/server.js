var fs = require('fs');
const hostname = require('os').hostname();
const nanotime = require('nano-time');
/**
* Creates a server instance. The server is used to accept multiple incoming connections and to send data to those connections
* @param {string} - ip ip address of server
* @param {int} port - port to connect to
* @param {int} timeout - The number of milliseconds of inactivity before a socket is presumed to have timed out. 0 will disable the timeout behavior
* @constructor
* @class
* @example
* var server = new Server('127.0.0.1', 1337, 0);
*/
function Server(ip, port, timeout) {
  this.ip = ip;
  this.port = port;
  this.server;
  this.seqnum = 0;
  this.log = [];
  this.timeout = timeout;
  this.connections = [];

  fs.stat('logs/', function (err, stats) {
    if(err){
      return fs.mkdirSync('logs/')
    }
  });
  this.log.push('start time: '+ nanotime.micro())
  this.log.push('txnode id, txnode ip,rxnode ip,seqnum,time');
}

/**
* Starts a server at the specified ip and port and listen for  connections
* @memberOf Server
* @example
* var server = new Server('127.0.0.1', 1337, 0);
* server.start();
*/
Server.prototype.start = function () {
  var net = require('net');
  var that = this;

  this.server = net.createServer(function (socket) {

    //ignore random errors
    socket.on('error', function () {});

    //get data if any is recieved from the client
    socket.on('data', function (data) {
      var stringData = new Buffer(data).toString();

      if (stringData == 'hn') {
        socket.write('hn-' + hostname);
      }
    });

    //keep every socket to each client
    that.connections.push(socket);
    console.log('node connected')
  });

  //
  this.server.timeout = this.timeout;

  //listen for incoming connections
  this.server.listen(this.port, this.ip);
  console.log('listening on: ' + this.ip + ':' + this.port)
};


/**

* Sends the data to all of the connected clients
* @param {Object} data  - data to send to all the devices
* @memberOf Server
* @example
* var server = new Server('127.0.0.1', 1337, 0);
* server.start();
*
* //sends random data to connected clients every 5 seconds
* setInterval(function(){
*      server.sendUpdate(Math.random());
* },5000);
*/
Server.prototype.sendUpdate = function (data) {
  var that = this;

  //start the tx timer
  const start = process.hrtime();

  //write data to each saved socket
  for (var i = 0; i < this.connections.length; i++) {
    var value = this.connections[i];

    //check if the socket is still alive
    if (value.address().address !== undefined) {

      //store that data in an array NOTE uncomment if you want datalogging
      //that.log.push(hostname + ','+ that.ip + ',' + value.address().address + ',' + this.seqnum + ',' + nanotime.micro());

      //write data to end device
      value.write(that.seqnum  +':' + data + '');

    }
    //if its dead then remove it so we dont keep transmitting to a closed connection
    else {
      const x = that.connections.indexOf(value);
      if (x != -1)
      that.connections.splice(x, 1);

    }
  }

  //calculate tx time
  const timetaken = process.hrtime(start);


  this.seqnum++;
};

/**
* Returns the sent data log from the server
* @returns {Array} - Array of all the log data
* @memberOf Server
* @example
* var server = new Server('127.0.0.1', 1337,0);
* server.start();
* ...
* //gets the data logged by the server
* var log = server.getTXLog();
* console.log(log);
*/
Server.prototype.getTXLog = function () {
  return this.log;
};

/**
* Writes the server log data to a file
* @param {string} filename - name of the file to write to
* @memberOf  Server
* @example
* var server = new Server('127.0.0.1', 1337,0);
* server.start();
*
* setInterval(function () {
*      server.sendUpdate(Math.random());
*}, 1000);
*
* //will write data to a file called 'tx.log' every 5 seconds
* setInterval(function () {
*      server.writeLogToFile('tx.log');
*}, 5000);
*/
Server.prototype.writeLogToFile = function (filename) {

  var that = this;

  //make sure the array isnt empty
  if(this.log.length > 2){
    this.log.forEach(function (data) {
      fs.appendFileSync(__dirname + '/logs/'+filename, data + '\r\n');
    });
  }
};

module.exports = Server;
