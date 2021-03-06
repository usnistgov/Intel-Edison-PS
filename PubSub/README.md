Intel Edison Pub/Sub Network 
===================

This repo contains all the information necessary to setup and create a publish/subscribe network for Intel Edison boards, and monitor them. 

## Installation

```bash
$ npm install 
```

## Basic Usage

```JavaScript 
const MasterNodeConnection = require('./MasterNodeConnection.js')

//handles the data from topics it is subbed to
//data format: seqnum:data
var dh = function(data){
	console.log(data)
}

const master = new MasterNodeConnection('ip', port, 'light:temp', 'button:light', dh)

master.startAutomaticDiscovery()
```
Each user will be provisioned with what sensors they have and what they want delimited by a colon. The above snippet initializes a node with the sensors light & temp, while it wants to subscribe to any node with button or light. It will print any incoming data to the console.

## Communication


Nodes use the  [Master Node](https://github.com/rush2sk8/Intel-Edison-PS/tree/master/Master%20Node) to broker connections to each others. In order to have any communications between nodes you need to run the [Master Node](https://github.com/rush2sk8/Intel-Edison-PS/tree/master/Master%20Node).

In this example the node "Edison02" want to join the current network.

![Before](https://github.com/rush2sk8/Intel-Edison-PS/blob/master/Documentation/images/beforejoining.PNG?raw=true )
 
 Edison02 will send its information (hostname, ip, has, wants) to the master node. The master node will see if any other nodes in the network has anything that Edison02 wants. In this example it sees that Edison03 has something that Edison02 so it will send Edison02 the information of Edison03 so that it can make a connection. After that it will see if the new node to the network has anything that the other nodes want. In this example every node wants the light sensor of Edison02 so the master node will update every other node with the information of this new node so that they all can subscribe to Edison02's topic.
This is what it looks like after Edison02 has successfully joined the network.


![After](https://github.com/rush2sk8/Intel-Edison-PS/blob/master/Documentation/images/afterjoining.PNG?raw=true )


## **MasterNodeConnection.js**

The main file that will broker and negotiate with the master node.

Usage:
```JavaScript 
const MasterNodeConnection = require('./MasterNodeConnection.js')

//handles the data from topics it is subbed to
//data format: seqnum:data
var dh = function(data){
	console.log(data)
}

const master = new MasterNodeConnection('ip', port, 'light:temp', 'button:light', dh)

master.startAutomaticDiscovery()
```

### Methods

#### new MasterNodeConnection(ip, port, has, want, datahandler)

```JavaScript
const master = new MasterNodeConnection('127.0.0.1', 1337, 'light:temp', 'button:light', ()=>{})
```

Connects to the master node running at ```ip``` and ```port```

#### master.startAutomaticDiscovery()

```JavaScript
master.startAutomaticDiscovery()
```

Starts the connection to the master node and if it cannot be established it will retry until it makes the connection.



#### master.publishDataToSubscribers(data)
 
```JavaScript 
master.publishDataToSubscribers (data)
```
 
Publishes <b>data</b> to every subscriber 

#### master.setLogging(data)
 
```JavaScript 
master.setLogging(true)
```
 
Enables/disables whether the devices will log data and write them to a file. Set to true as default

## **client.js**
 

Used by ```MasterNodeConnection``` to create clients to subscribe to topics. **Not necessary to use unless making custom connections**

**Usage:**
```JavaScript 
//handles the data that the client receives from the server
var dh = function(data){

     //prints received data to the screen
     console.log(data);
};

//creates a client that will connect to a server running on the localhost
var client = new Client('127.0.0.1', 1337, dh);
```

### Methods

#### new Client(ip, port, dataHandler)

```JavaScript
var client = new Client('127.0.0.1', 1337, ()=>{});
```

#### client.run()
```JavaScript
var client = new Client('127.0.0.1', 1337, ()=>{});
client.run();
```
This function will start a connection to the endpoint given the ip and port that the client object was initialized with. It also logs all received data before sending it to the data handler if it was set by the user. If the connection fails it will retry the connection every second

#### client.getRxLog() &rarr; {Array}
```JavaScript
client.getRxLog()
```
Returns an array of all the data that has been received from subscribed publishers.

#### client.deleteFromLog(toRemove) 
```JavaScript
client.deleteFromLog(client.getRxLog()[0])
```
Deletes an entry from the internal log.

#### client.writeLogToFile(filename) 
```JavaScript
client.writeLogToFile('data.log')
```
Writes the log to a file defined by ``` filename ``` and then deletes the log that is in memory.


#### client.getIP() &rarr; {String} 
```JavaScript
console.log(client.getIP())
```
Gets the IP address of what the node is connected to. 


## **server.js**

Used by ```MasterNodeConnection``` to create a server on each device that subscribers can connect to so that it can publish to them. **Not necessary to use unless creating a custom server**


### Methods

#### new Server(ip, port, timeout)

```JavaScript 
var server = new Server('127.0.0.1', 1337, 0);
```
Creates a server instance. The server is used to accept multiple incoming connections and to send data to those connections. The ```timeout``` is the number of milliseconds of inactivity before a socket is presumed to have timed out. 0 will disable the timeout behavior.

### server.start()
```JavaScript 
var server = new Server('127.0.0.1', 1337, 0);
server.start()
```
Starts a server at the specified ip and port and listen for connections

### server.sendUpdate(data)
```JavaScript 
//sends a random number to every subscriber
server.sendUpdate(Math.random())
```
Starts a server at the specified ip and port and listen for connections

#### server.getTXLog() &rarr; {Array}
```JavaScript
server.getRxLog()
```
Returns an array of all the data that has been sent to all subscribers

#### server.deleteFromLog(toRemove) 
```JavaScript
server.deleteFromLog(server.getTXLog()[0])
```
Deletes an entry from the internal log.

#### server.writeLogToFile(filename) 
```JavaScript
server.writeLogToFile('data.log')
```
Writes the log to a file defined by ``` filename ``` and then deletes the log that is in memory.


# Example Usage

```JavaScript
const MasterNodeConnection = require('./MasterNodeConnection.js')

var dh = function (data) {
   const x = data.split(':')
   if(x[1] === 'hello')
	   console.log('hello world')
};

var master = new MasterNodeConnection('10.20.0.128', 9999, 'numbers', 'words', dh)

master.startAutomaticDiscovery();

setInterval(()=>{
	master.sendUpdate(Math.random())
}, 1000);
```

This is a generic example where the user sends numbers to whoever is subscribed at a one second interval. When the user receives a word from the publisher it checks to see if  the word is ```hello``` if it is then it will print ```hello world ``` to the console.
