# SSNG for Node.js

2018.07.17 v1.0.0 release    

## Abstract
SSNG for Node.jsは、ECHONET Liteコマンド送受信ツールである。  

SSNG for Node.js is a tool to send and receive ECHONET Lite command.

## Requirements
Node.jsがインストールされたWindows PC, Macまたは Raspberry Pi  

Windows PC, Macintosh or Raspberry Pi on which Node.js is installed.

## Installation
ターミナルで "npm i -g ssng" を実行する

Execute "npm i -g ssng" on a terminal


## Launch
#### Japanese
1. ターミナルで "ssng" を実行する   
2. Web Browserを起動し、localhost:3000 をアクセスする  
3. SSNGのGUIが表示される(Fig. 1)  

#### English
1. execute "ssng" on a terminal  
2. Launch a Web Browser and access localhost:3000
3. GUI of SSNG is displayed(Fig. 1)  

![gui1](https://raw.githubusercontent.com/KAIT-HEMS/ssng-node/master/_graphics/gui1.png "gui1")  
<div style="text-align: center;">Fig.1 GUI of SSNG</div>

## How to use
#### Japanese
### 基本的な使い方
　IP Address, DEOJ, ESV, EPC, EDTのデータ入力欄に値を入力し、SENDボタンをクリックするとECHONET Liteコマンドが送信される。受信したECHONET LiteデータはPackets monitor areaに自動的に表示される。  

### IP Address 入力欄
　IPv4形式の値を入力する。  

### ECHONET Lite Data 入力欄
　16進数(HEX)の値を入力する。"0x"は省略可能。  
　TIDは0x0001から始まり、コマンドを送信するごとに自動でインクリメントされる。OPCは0x01の固定値。PDCはEDTから自動で計算される。EDTが２バイト以上の場合は、0xAA33FF のような値を入力する。EDTが不要なESVの場合、EDT入力欄のデータは無視される。  

### Free Data 入力欄
　OPC=2以上のコマンドを送る場合や、ECHONET Liteとしては正しくないコマンドを送る場合は、Free Data 入力欄を利用する。ラジオボタンでFree Dataを選択するとFree Data を入力できるようになる。入力するデータのフォーマットは、コンマで区切られた１バイトデータ（0xを省略したの16進数）である。

### SEND ボタン
　その時点で選択されている入力欄のデータを用いてECHONET Liteコマンドを送信する。

### SEARCH ボタン
　機器探索のためのコマンドを送信する。

### CLEAR ボタン
　Packets monitor表示欄をクリアする。

### SAVE ボタン
　Packets monitor表示欄のデータをファイルとして保存する。保存先はホームディレクトリで、ファイル名は以下のように "ssngLog\_" の後にtimestamp(YYYYMMDDHHMMSS)を付加したものである。
>　ssngLog_20180625161502.txt

#### English
### Basic usage
Type data to input field of IP Address, DEOJ, ESV, EPC and EDT. Click SEND button, then ECHONET Lite command is sent. Received ECHONET Lite data is displayed in the Packets monitor area automatically.

### IP Address input field
Type IPv4 address. Initial data of 224.0.23.0 is a multicast address of ECHONET Lite.

### ECHONET Lite Data input field
Type HEX data. "0x" can be omitted.  
TID starts from 0x0001 and it is incremented automatically upon sending a new command. OPC is fixed value of 0x01. PDC is calculated automatically with EDT. In case of more than 2 bytes data of EDT, input data like this "0xAA33FF". EDT data is ignored depending on ESV value.

### Free Data input field
Free data input field can be utilized in case OPC is more than 2 or a command is not compliant to ECHONET Lite. Select Free data radio button then input field is enabled. Data format should be comma separated byte data in HEX without "0x".

### SEND Button
Sends a command with data in the currently selected input field.

### SEARCH Button
Sends a command to search ECHONET Lite devices.

### CLEAR Button
Clear Packets monitor display ares.

### SAVE DATA Button
Save data on Packets monitor display area to a home directory. The file name starts with "ssngLog\_" and timestamp(YYYYMMDDHHMMSS) follows. Here is an example.
> "ssngLog\_20180625161502.txt".


## Packets monitor display area

#### Japanese
Packets monitor表示エリアには、送信・受信したデータが表示される。第１コラムはタイムスタンプ、第２コラムは送受信を示す記号(T:送信/R:受信)、第３コラムはECHONET Liteパケットである。   
Packets monitor headerにはデータ表示を制御するチェックボックスやラジオボタンが存在する。

### Order radio button (Normal, Reverse)
ログデータの表示の順序をコントロールするラジオボタンである。Normalを選択すると時間軸は下向き、Reverseを選択すると時間軸は上向きとなる。

### Filter check box (GET, INF, GET_RES, SNA)
受信データのESVの値によって表示にフィルタをかける。チェックをはずすと非表示となる。

#### English
Data display area shows ECHONET Lite packets with timestamp and a symbol that represent SEND:T and RECEIVE:R
There are check boxes and radio buttons to control views of data display at the header area.

### Order radio button (Normal, Reverse)
A radio button to control the order of time.

### Filter check box (GET, INF, GET_RES, SNA)
Check boxes to show/hide data by the value of ESV of received data.
