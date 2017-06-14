/********************************************Website Code***************************************************
 const express = require('express');
 const app = express();
 const path = require('path');
 const fs = require('fs');

 app.use(express.static(__dirname + '/'));

 app.get('/', function (req, res) {

    fs.readFile(__dirname + '/template.html','utf8', function(err, data){
        console.log(data)
    });

 res.sendFile(path.join(__dirname + '/index.html'));

});

 app.get('/reboot', function (req, res) {
    res.sendFile(path.join(__dirname + '/reboot.html'));

});

 app.get('/back', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
})
 //app.listen(3000);
 //console.log('website at localhost:3000')
 */
/*********************************************Node Code*****************************************************/
var sensors = [];
const net = require('net');
const dgram = require('dgram')

/**
 * Creates the server that brokers the connections
 */

var server = dgram.createSocket('udp4');
server.bind(9999, '10.20.0.128');

server.on('listening', function () {
    console.log('Server running at: 10.20.128:9999')
});

server.on('message', function (msg, info) {
    //reads all incoming data
    const stringData = msg.toString();

    console.log(stringData)

    //split it by the delimiter
    const command = stringData.split('-');

    //if the command new node is requested
    if (command[0] == 'nn') {

        //create a new sensor node object
        var sn = new SensorNode(command[1], command[2], command[3], command[4]);

        //check to see if the node is already in the list
        if (hasNode(sn) === false) {
            sensors.push(sn);
        }

        console.log('asuh dude')

        sn.getSensorsToSubTo().forEach(function (s) {
            console.log('sub: '+ s.getString())
            var buf = new Buffer('ct-' + s.getString() + '*');
            server.send(buf, 0, buf.length, 9999, command[2], function (err, bytes) {

            });


        });

        sn.getSensorsToPubTo();

    }
});

/**
 * Returns true if we have the node already in out table
 * @param tosee
 * @returns {boolean}
 */
function hasNode(tosee) {

    for (var i = 0; i < sensors.length; i++) {

        if (sensors[i].isequal(tosee))
            return true;
    }
    return false;
}


/**
 * Sensor node data type
 * @param hostname
 * @param ip
 * @param sensors
 * @constructor
 */
function SensorNode(hostname, ip, sensors, want) {
    this.hostname = hostname;
    this.ip = ip;
    this.sensors = want !== undefined ? sensors.split(':') : [];
    this.want = want !== undefined ? want.split(':') : [];

}

/**
 * ToString for sensor node
 * @memberof SensorNode
 * @returns {string}
 */
SensorNode.prototype.getString = function () {
    return this.hostname + '-' + this.ip + '-' + this.sensors + '-' + this.want;
};

/**
 * Returns array of sensors that have something it wants
 * @param node
 * @returns {Array}
 */
SensorNode.prototype.getSensorsToSubTo = function () {
    var toReturn = [];
    const that = this;

    sensors.forEach(function (s) {

        for (var w = 0; w < that.want.length; w++) {

            if (s.sensors.indexOf(that.want[w]) >= 0 && (s.sensors.length !== 0) && (s.isequal(that) == false)) {
                toReturn.push(s);
                break;
            }
        }
    });

    return toReturn;
};

/**
 * When a node joins the network it sees which other nodes want what the new one has and will send an update if it satisfies that condition
 */
SensorNode.prototype.getSensorsToPubTo = function () {
    const that = this;

    sensors.forEach(function (s) {

        for (var i = 0; i < s.want.length; i++) {


            if (that.sensors.indexOf(s.want[i]) >= 0 && (s.sensors.length !== 0) && (s.isequal(that) == false)) {
                var client = dgram.createSocket('udp4');
                var buf = new Buffer('ct-' + that.getString() + '*');

                client.send(buf, 0, buf.length, 9999, s.ip, function (err, bytes) {
                    client.close();
                });
                console.log(buf.toString())

                break;
            }
        }
    });
};

/**
 * Equality between sensor nodes
 * @param node
 * @returns {boolean}
 */
SensorNode.prototype.isequal = function (node) {

    return (this.ip == node.ip) && (this.hostname == node.hostname);
}
