#!/usr/bin/env node

// app.js for SSNG
// 2019.04.17
// access http://localhost:3000/ssng

const version = "2019.04.17";

let dgram = require('dgram');     // for UDP send and receive
let express = require('express');
let app = express();
let server = require('http').Server(app);
const os = require('os');
const fs = require('fs');
const WebSocket = require("ws").Server;
// const wss = new WebSocket({ port: 5001 });
const wss = new WebSocket({ server });

const port = process.env.PORT || 3000;
const isIPv6 = false;
const EL_port = 3610;
const EL_multiAdr4 = '224.0.23.0';
const EL_multiAdr6 = 'FF02::1';

const epcNode = {
    0x80: [0x30],
    0x82: [0x01, 0x0C, 0x01, 0x00],
    0x83: [0xFE, 0x00, 0x00, 0x77, 
                0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C],
    0x8A: [0x00, 0x00, 0x77],
    0x9D: [0x02, 0x80, 0xD5],
    0x9E: [0x00],
    0x9F: [0x0C, 0x80, 0x82, 0x83, 0x8A, 0x9D, 0x9E, 0x9F, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7],
    0xD3: [0x01],
    0xD4: [0x02],
    0xD5: [0x01, 0x05, 0xFF, 0x01],
    0xD6: [0x01, 0x05, 0xFF, 0x01],
    0xD7: [0x01, 0x05, 0xFF]
};

const epcDevice = {
    0x80: [0x30],
    0x81: [0x08],
    0x82: [0x00, 0x00, 0x49, 0x00],
    0x88: [0x42],
    0x8A: [0x00, 0x00, 0x77],
    0x9D: [0x03, 0x80, 0x81, 0x88],
    0x9E: [0x00],
    0x9F: [0x08, 0x80, 0x81, 0x82, 0x88, 0x8A, 0x9D, 0x9E, 0x9F],
};

// get local IP address(ipv4)
const localAddress = getLocalAddress();
const ipv4 = localAddress.ipv4[0].address

// create a folder "log" to save log files
fs.readdir('.', function(err, files){
    if (err) throw err;
    if (files.includes('log') == false) {
        fs.mkdir('log', (err) => {
          if (err) console.log("Error: mkdir");
        });
    }
});

server.listen(port, function(){
  console.log("*** SSNG " + version + ", http://localhost:" + port + " ***");
});

// location of static files
// app.use(express.static('html'))
app.use(express.static(__dirname + '/html'))

// middleware for express
app.use(express.json());

// routing for express
app.get('/', function(req, res){
  console.log("REST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

app.get('/index', function(req, res){
  console.log("REST: GET /index.html");
  res.sendFile(__dirname + '/html/index.html');
});

app.get('/ssng/ipv4', function(req, res){
  console.log("REST: GET /ssng/ipv4");
  res.send(ipv4);
});

app.put('/ssng/send', function(req, res){
  console.log("REST: PUT /ssng/send");
  sendUdp(req.body.ip, req.body.uint8Array);
  res.send("Got a PUT request at /ssng/send");
});

app.post('/ssng/saveLog', function(req, res){
  console.log("REST: POST /ssng/saveLog");
  saveLog(req.body.log);
  res.send("Got a POST request at /ssng/saveLog");
});

// websocket: A process when WebSocket server gets a connection from a client
wss.on("connection", ws => {
    console.log("WebSocket: connection");
    ws.on("message", message => {
        console.log("Received: " + message);
        if (message === "hello") {
            ws.send("hello from server");
        }
    });
});

// UDP: receive
var sock = dgram.createSocket(isIPv6 ? "udp6" : "udp4", function (msg, rinfo) {
    console.log("UDP receive: \n\trinfo= ", rinfo, "\n\tmsg= ", msg, );
    const ip = rinfo.address;
    let uint8Array =[];
    for (let i = 0; i < msg.length; i++) {
      uint8Array.push(msg.readUInt8(i));
    }
    // websocket: push to client(web browser)
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({"ip":ip, "uint8Array":uint8Array}), (error) => {
            if(error) {
                console.log('Failed to send a message on the WebSocket channel.', error);
            }
        });
    });
    // process EL GET command and reply GET_RES
    elGet(ip, uint8Array);
});

// UDP: setting for multicast
sock.bind( EL_port, function() {
	sock.addMembership( isIPv6 ? EL_multiAdr6 : EL_multiAdr4 );
	console.log( "port bind OK!" );
});

// Send INF (EPC=0xD5)
const multicastAddress = isIPv6 ? EL_multiAdr6 : EL_multiAdr4;
const instanceList = [0x10, 0x81, 0x00, 0x0a, 0x0e, 0xf0, 0x01, 0x0e, 0xf0, 0x01, 0x73, 0x01, 0xd5, 0x04, 0x01, 0x05, 0xff, 0x01];
sendUdp(multicastAddress, instanceList);

function sendUdp(ip, byteArray) {   // string:ip, array:byteArray
  const buffer = new Buffer(byteArray);
	let client = dgram.createSocket(isIPv6 ? "udp6" : "udp4");
	client.send( buffer, EL_port, ip, function(err, bytes) {
		client.close();
	});
}

function saveLog(data) {  // string:data
  const date = new Date();
  let year = date.getFullYear();
  let month = (date.getMonth()+1).toString();
  let day = date.getDate().toString();
  let hour = date.getHours().toString();
  let minute = date.getMinutes().toString();
  let second = date.getSeconds().toString();
  month = (month.length == 1) ? ("0" + month) : month;
  day = (day.length == 1) ? ("0" + day) : day;
  hour = (hour.length == 1) ? ("0" + hour) : hour;
  minute = (minute.length == 1) ? ("0" + minute) : minute;
  second = (second.length == 1) ? ("0" + second) : second;
  filename = "ssngLog_" + year + month + day + hour + minute + second  + ".txt";
  
  const buffer = new Buffer(data);
  fs.writeFile("log/"+filename, buffer, (err) => {
    if (err) console.log("Error: Can not save a log file.");
    console.log('The file has been saved!');
  });
}

function elGet(ip, uint8Array) {  // string:ip, array: uint8Array
  // console.log("elGet ip= ", ip, "uint8Array= ", uint8Array);
  const elPacket = parseEL(uint8Array);
  if (elPacket !== null) {
    const deoj = elPacket.deoj[0] * 256 + elPacket.deoj[1];
    if (( deoj == 0x05FF) && (elPacket.esv == 0x62)) { // controller and Get
      const uint8ArraySend = createUint8ArraySend(elPacket, epcDevice);
      // console.log("elGet ip= ", ip, "uint8ArraySend= ", uint8ArraySend);
      sendUdp(ip, uint8ArraySend);
    }
    else if ((deoj == 0x0EF0) && (elPacket.esv == 0x62)) {  // node and Get
      const uint8ArraySend = createUint8ArraySend(elPacket, epcNode);
      // console.log("elGet ip= ", ip, "uint8ArraySend= ", uint8ArraySend);
      sendUdp(ip, uint8ArraySend);
    }
  }   
}

function createUint8ArraySend(elPacket, epcs) {
  let uint8ArraySend = [0x10, 0x81, 0x00, 0x00, 0x0e, 0xf0, 0x01, 0x0e, 0xf0, 0x01, 0x72, 0x01, 0x80, 0x00];
  uint8ArraySend[2] = elPacket.tid[0];  // tid
  uint8ArraySend[3] = elPacket.tid[1];  // tid
  uint8ArraySend[4] = elPacket.deoj[0]; // seoj
  uint8ArraySend[5] = elPacket.deoj[1]; // seoj
  uint8ArraySend[6] = elPacket.deoj[2]; // seoj
  uint8ArraySend[7] = elPacket.seoj[0]; // deoj
  uint8ArraySend[8] = elPacket.seoj[1]; // deoj
  uint8ArraySend[9] = elPacket.seoj[2]; // deoj
  uint8ArraySend[12] = elPacket.epc;  // epc
  const edt = epcs[elPacket.epc];
  if (edt !== undefined) {
      uint8ArraySend[10] = 0x72;  // esv: Get_Res
      uint8ArraySend[13] = edt.length;  // PDC
      for (let data of edt) {
        uint8ArraySend.push(data);
      }
  } else {
      uint8ArraySend[10] = 0x52;  // esv: Get_SNA
  }
  return uint8ArraySend;
}

function parseEL(uint8Array) {
  let elr = {};
  if (uint8Array.length < 14) {
    console.log("parseEL ERROR: UDP data is less than 14 bytes.");
    return null;
  }
  const ehd = uint8Array[0] * 256 + uint8Array[1];
  if (ehd != 0x1081) {
    console.log("parseEL ERROR: EHD is wrong");
    return null;
  }
  elr.ehd = [uint8Array[0], uint8Array[1]];
  elr.tid = [uint8Array[2], uint8Array[3]];
  elr.seoj = [uint8Array[4], uint8Array[5], uint8Array[6]];
  elr.deoj = [uint8Array[7], uint8Array[8], uint8Array[9]];
  elr.esv = uint8Array[10];
  elr.opc = uint8Array[11];
  elr.operations = uint8Array.slice(12);
  if (elr.opc == 1) {
    elr.epc =  uint8Array[12];
    elr.pdc = uint8Array[13];
    if (elr.pdc !== 0) {
      edt = uint8Array.slice(14);
    }
  }
  return elr;
}

// Get Local IP Address
function getLocalAddress() {
    let ifacesObj = {}
    ifacesObj.ipv4 = [];
    ifacesObj.ipv6 = [];
    let interfaces = os.networkInterfaces();
    for (let dev in interfaces) {
        interfaces[dev].forEach(function(details){
            if (!details.internal){
                switch(details.family){
                    case "IPv4":
                        ifacesObj.ipv4.push({name:dev, address:details.address});
                    break;
                    case "IPv6":
                        ifacesObj.ipv6.push({name:dev, address:details.address})
                    break;
                }
            }
        });
    }
    return ifacesObj;
};