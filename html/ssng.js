// ssng.js for SSNG(client side)
// 2019.04.11

const serverURL = "/ssng/";
let tid = 0;
let packetId = 0;
let active_packet_id = '';
let dataLogArray = [];
let analyzedData = "";

var vm = new Vue({
    el: '#app',
    data: {
        ipServer: "",
        ipData: "224.0.23.0",
        el: {
            deojData: "0x013001",
            esvData: "0x62",
            epcData: "0x80",
            edtData: "0x30"
        },
        freeData: "10,81,00,0A,05,FF,01,01,30,01,62,01,80,00",
        ipDataStyle: {color: 'black'},
        deojDataStyle: {color: 'black'},
        esvDataStyle: {color: 'black'},
        epcDataStyle: {color: 'black'},
        edtDataStyle: {color: 'black'},
        freeDataStyle: {color: 'black'},
        rbInputData: "el",
        rbOrder: "normalOrder",
        filters: ["showGet", "showInf", "showGetres", "showSNA"],
        packet_list: [],
        packetDetail: ""
    },
    methods: {
        buttonClickSearch: function () {
            buttonClickSearch();
        },
        buttonClickSend: function () {
            buttonClickSend(this.ipData, this.el, this.freeData);
        },
        updateRbOrder: function () {
            displayLog();
        },
        updateFilters: function () {
            displayLog();
        },
        clearLog: function () {
            clearLog();
        },
        saveLog: function () {
            saveLog();
        },
		// パケット一覧からパケット行がクリックされたときの処理 (パケット詳細を表示)
		showPacketDetail: this.packetMonitorShowPacketDetail.bind(this),
		// パケット一覧で矢印キーが押されたときの処理
		upDownList: this.packetMonitorUpDownList.bind(this)
    }
});

// Show server IP address
let request = new XMLHttpRequest();
request.addEventListener("load", reqListener);
request.open('GET', 'ssng/ipv4');
request.send();
function reqListener () {
    vm.ipServer = this.responseText;
}

// connect websocket
console.log('ws://' + document.location.host);
let ws = new WebSocket('ws://' + document.location.host);
ws.onopen = function(event){
    console.log("connected");
};

ws.onmessage = function(event){
    console.log("server_to_client", event.data);
    const obj = JSON.parse(event.data);
    if (obj.ip != vm.ipServer ) {
        const packet_id = 'packet-' + packetId++;
        const pkt = {
            id:packet_id,
            timeStamp:timeStamp(),
            direction:"R",
            ip:obj.ip,
            data:obj.uint8Array
        }
        dataLogArray.push(pkt);
        displayLog();
    }
};

function displayLog() {
    let log = [];
    for (let dataLog of dataLogArray) {
        const esv = dataLog.data[10];
        const pkt = {
            id: dataLog.id,
            timeStamp: dataLog.timeStamp,
            direction: dataLog.direction,
            address: dataLog.ip,
            hex: elFormat(dataLog.data)
        }
        if ((dataLog.direction == "T") || filterEsv(esv)) {
            log.push(pkt);
        }
    }
    if (vm.rbOrder == "reverseOrder") {
        log.reverse();
    }
    vm.packet_list = log;
    // clear packet selection
	if (this.active_packet_id) {
		$('#' + this.active_packet_id).removeClass('active');
		this.active_packet_id = '';
	}
    vm.packetDetail = "";    
    return;

    function filterEsv(esv) {
      if (!vm.filters.includes("showGet") && (esv == 0x62)) {
        return false;
      }
      if (!vm.filters.includes("showInf") && (esv == 0x73)) {
        return false;
      }
      if (!vm.filters.includes("showGetres") && (esv == 0x72)) {
        return false;
      }
      if (!vm.filters.includes("showSNA") && ((esv == 0x50) || (esv == 0x51) || (esv == 0x52) || (esv == 0x53) || (esv == 0x5E))) {
        return false;
      }
      return true;
    }
}

function timeStamp() {
    const date = new Date();
    let hour = date.getHours().toString();
    let minute = date.getMinutes().toString();
    let second = date.getSeconds().toString();
    hour = (hour.length == 1) ? ("0" + hour) : hour;
    minute = (minute.length == 1) ? ("0" + minute) : minute;
    second = (second.length == 1) ? ("0" + second) : second;
    return hour + ":" + minute + ":" + second;
}

function analyzeData(uint8Array) {  // uint8Array: [UInt8]
    let analyzedData = "";
    let epcArray = [];
    const esv = uint8Array[10];
    const epc = uint8Array[12];
    const edt = uint8Array.slice(14);

    // Decode PropertyMap
    if (shouldDecodePropertyMap()) {
      if (edt.length < 17) {  // PropertyMapがEPCの列挙の場合
        for (let i=1; i<edt.length; i++) {
          epcArray.push(toStringHex(edt[i], 1));
        }
      } else {    // PropertyMapがbitmapの場合
        for (let i = 1; i<17; i++) {
          for (let j = 0; j<8; j++) {
            if ((edt[i] & (1 << j)) !==0 ) {
              let epc = 0x80 + (0x10 * j) + i-1;
                epcArray.push(toStringHex(epc, 1));
            }             
          }
        }
      }
      epcArray.sort();
      analyzedData = "EPC:";
      for (let data of epcArray) {
        analyzedData += " " + data;
      }
    } else {
        return null;
    }
    return analyzedData;  // analyzedData: string
    function shouldDecodePropertyMap() {
      return ((esv == 0x72)&&((epc == 0x9D)||(epc == 0x9E)||(epc == 0x9F)));
    }
}

function elFormat(uint8Array) {
    let elString = "";
    for (let value of uint8Array) {
      elString += toStringHex(value, 1);
    }
    elString = strIns(elString, 4, " ");
    elString = strIns(elString, 9, " ");
    elString = strIns(elString, 16, " ");
    elString = strIns(elString, 23, " ");
    elString = strIns(elString, 26, " ");
    elString = strIns(elString, 29, " ");
    elString = strIns(elString, 32, " ");
    elString = strIns(elString, 35, " ");
    return elString;
}

// 数値(number)を16進数表記の文字列に変換する
// 数値のbyte数は(bytes)
// example: toStringHex(10, 1) => "0A"
// example: toStringHex(10, 2) => "000A"
function toStringHex(number, bytes) {
  let str = number.toString(16).toUpperCase();
  while (str.length < 2*bytes) { str = "0" + str; }
      return str;
}

// stringに文字列を挿入
function strIns(str, idx, val){ // str:string（元の文字列）, idx:number（挿入する位置）, val:string（挿入する文字列）
    var res = str.slice(0, idx) + val + str.slice(idx);
    return res;
}

// Check input value of text field
// argument: inputType:string, enum("ip", "deoj", "esv", "epc", "edt", "free")
// get text data from text input field of "inputType"
// return value: boolean
function checkInputValue(inputType, inputValue) {
    let regex;
    switch (inputType) {
      case "ip":
        regex = /^(([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
        break;
      case "deoj":
        regex = /^(0x)?(\d|[a-f]|[A-F]){6}$/;
        break;
      case "esv":
      case "epc":
        regex = /^(0x)?(\d|[a-f]|[A-F]){2}$/;
        break;
      case "edt":
        regex = /^((0x)?((\d|[a-f]|[A-F]){2}){1,})?$/;
        break;
      case "free":
        regex = /^((\d|[a-f]|[A-F]){2},\s*){1,}(\d|[a-f]|[A-F]){2}\s*$/;
        break;
      default:
    }
    if (regex.test(inputValue)) {
        return true;
    }else{
        return false;
    }
}

function buttonClickSend(ipData, el, freeData) {
    if (!checkInputValue('ip', vm.ipData)) {
        vm.ipDataStyle.color = "red";
        window.alert("Check IP address");
        return false;
    } else {
        vm.ipDataStyle.color = "black";
    }
    let uint8Array = [];
    let binaryString = "";
    uint8Array = (vm.rbInputData == "el") ? createUint8ArrayFromElData(el) : createUint8ArrayFromFreeData(freeData);

    if (uint8Array !== false) {
        const message = {ip:ipData, uint8Array:uint8Array};
        const request = new XMLHttpRequest();
        request.open('PUT', serverURL + 'send');
        request.setRequestHeader("Content-type", "application/json");
        request.send(JSON.stringify(message));

      // push "Sent Data" to LOG
        const packet_id = 'packet-' + packetId++;
        const pkt = {
            id:packet_id,
            timeStamp:timeStamp(),
            direction:"T",
            ip:ipData,
            data:uint8Array
        }
        dataLogArray.push(pkt);
        displayLog();
    }
}

function createUint8ArrayFromElData(el) {
    if (!checkInputValue('deoj', vm.el.deojData)) {
        vm.deojDataStyle.color = "red";
        window.alert("Check DEOJ");
        return false;
    } else {
        vm.deojDataStyle.color = "black";
    }
    if (!checkInputValue('esv', vm.el.esvData)) {
        vm.esvDataStyle.color = "red";
        window.alert("Check ESV");
        return false;
    } else {
        vm.esvDataStyle.color = "black";
    }
    if (!checkInputValue('epc', vm.el.epcData)) {
        vm.epcDataStyle.color = "red";
        window.alert("Check EPC");
        return false;
    } else {
        vm.epcDataStyle.color = "black";
    }
    if (!checkInputValue('edt', vm.el.edtData)) {
        vm.edtDataStyle.color = "red";
        window.alert("Check EDT");
        return false;
    } else {
        vm.edtDataStyle.color = "black";
    }
    let uint8Array = [0x10, 0x81];  // EHD
    tid = (tid == 0xFFFF) ? 0 : (tid+1);
    uint8Array.push(Math.floor(tid/16), tid%16);  // TID
    uint8Array.push(0x05, 0xFF, 0x01);  // SEOJ
    for (let data of hex2Array(el.deojData)) { // DEOJ
        uint8Array.push(data);
    }
    uint8Array.push(parseInt(el.esvData, 16));  // ESV
    uint8Array.push(0x01);  // OPC
    uint8Array.push(parseInt(el.epcData, 16));  // EPC
    const esv = parseInt(el.esvData, 16);
    if ((esv == 0x62) || 
        (esv == 0x63) || 
        (esv == 0x71) || 
        (esv == 0x7A) || 
        (esv == 0x7E) || 
        (esv == 0x50) || 
        (esv == 0x51) || 
        (esv == 0x52) || 
        (esv == 0x53) || 
        (esv == 0x5E)) {
        uint8Array.push(0x00);  // PDC
    } else {  // EPC= 0x60:SetI, 0x61:SetC, 0x6E:SetGet, 0x72:Get_Res, 0x73:INF, 0x74:INFC, 
        const edtArray = hex2Array(el.edtData)
        uint8Array.push(edtArray.length);  // PDC
        for (let data of hex2Array(el.edtData)) {  // EDT
            uint8Array.push(data);
        }
    }
    return uint8Array;
}

function hex2Array(hex) { // hex: string of this format 0xXXXX or XXXX
    if (hex.slice(0,2) != "0x") {
      hex = "0x" + hex;
    }
    let array =[];
    const bytes = (hex.length - 2)/2;
    for (let i=0; i<bytes; i++) {
      array.push(parseInt(hex.slice((i+1)*2,(i+1)*2+2), 16));
    }
    return array; // array: array of byte data
}
  
function createUint8ArrayFromFreeData(freeData) {
    if (!checkInputValue('free', vm.freeData)) {
        console.log("vm.freeDataStyle.color: ", vm.freeDataStyle.color);
        vm.freeDataStyle.color = "red";
        window.alert("Check Free data");
        return false;
    } else {
        vm.freeDataStyle.color = "black";
    }
    let uint8Array = [];
    let arrayFromFreeData = freeData.split(",");
    for (let value of arrayFromFreeData) {
        uint8Array.push(parseInt(value.trim(), 16));
    }
    return uint8Array;
}

function buttonClickSearch() {
    const ipData = "224.0.23.0";
    const el = {
            deojData: "0x0EF001",
            esvData: "0x62",
            epcData: "0xD6",
            edtData: ""
        };
    const freeData="10,81,00,04,05,FF,01,0E,F0,01,62,01,D6,00";
    buttonClickSend(ipData, el, freeData);
}

function saveLog() {
    let log = "";
    for (let dataLog of dataLogArray) {
      log = log + dataLog.timeStamp + "," + dataLog.direction + "," + dataLog.ip + "," + elFormat(dataLog.data) + "\n";
    }
    const message = {log:log};
    const request = new XMLHttpRequest();
    request.open('POST', serverURL + 'saveLog');
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify(message));
}

function clearLog() {
    packetId = 0;
    dataLogArray.length = 0;
    vm.packet_list = [];
	vm.packetDetail = "";
}

function packetMonitorShowPacketDetail(event){
	if (this.active_packet_id) {
		$('#' + this.active_packet_id).removeClass('active');
		this.active_packet_id = '';
	}
	let t = event.target;
	console.log("t.id: ",t.id);
    $('#' + t.id).addClass('active');
	this.active_packet_id = t.id;

	// 現在選択中のパケット ID
	let id_parts = this.active_packet_id.split('-');
	let pno = parseInt(id_parts[1], 10);
	
    // packetの解析結果の表示
	vm.packetDetail = analyzeData(dataLogArray[pno].data);
}

function packetMonitorUpDownList(event){
	event.preventDefault();
	event.stopPropagation();
	// 選択中のパケット行がなければ終了
	if (!this.active_packet_id) {
		return;
	}
	// 現在選択中のパケット ID
	let id_parts = this.active_packet_id.split('-');
	let pno = parseInt(id_parts[1], 10);

	let c = event.keyCode;
	let k = event.key;
	if (c === 38 || k === 'ArrowUp') {
		// 上矢印キー
		if (vm.rbOrder == "normalOrder") {
    		if (pno-- <0 ) {pno = 0}
		} else {
    		if (pno++ >= dataLogArray.length ) {pno = dataLogArray.length -1}		
		}
	} else if (c === 40 || k === 'ArrowDown') {
		// 下矢印キー
		if (vm.rbOrder == "normalOrder") {
    		if (pno++ >= dataLogArray.length ) {pno = dataLogArray.length -1}
		} else {
    		if (pno-- <0 ) {pno = 0}
		}
	} else {
		return;
	}
	// 遷移したパケット行にフォーカスする
	$('#packet-' + pno).focus();
}