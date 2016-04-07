'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let websocket;

const ipcMain = require('electron').ipcMain;

function startWebsocketServer() {
  // Websocket Server
  // https://github.com/websockets/ws
  var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 39682 });

  wss.on('connection', function connection(ws) {

    websocket = ws;

    ws.send('startup');

    ws.on('message', function incoming(message, flags) {
      console.log('received: %s', message);
      var jmsg = JSON.parse(message);
      var ret = handleMessage(jmsg);
      ws.send(JSON.stringify(ret));
    });

  });
};

ipcMain.on('keyDown', function(event, arg) {
  sendMessage('keyDown', arg);
});


function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({show: false, 'web-preferences': {'web-security': false}});

  // and load the index.html of the app.
  win.loadURL('file://' + __dirname + '/index.html');

  win.webContents.on('did-finish-load', function() {
    win.webContents.send('console', 'ready');
    startWebsocketServer();
    win.show();
  });

  // Emitted when the window is closed.
  win.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

function handleMessage(message) {
  var fn_name = message.fn;
  var arg = message.arg;

  switch(fn_name) {

    case 'loadURL':
      var msg = {fn: 'loadURL', arg: arg}
      win.webContents.send('webview', JSON.stringify(msg));
      break;

    case 'keyDown':
      var msg = {fn: 'keyDown', arg: arg}
      win.webContents.send('webview', JSON.stringify(msg));
      break;

    case 'show':
      win.show();
      break;

    case 'hide':
      win.hide();
      break;

    case 'executeJavaScript':
      win.webContents.executeJavaScript(arg);
      break;

    case 'setFullScreen':
      var enable = arg.toLowerCase() == 'true';
      win.setFullScreen(enable);
      break;

    default:
      win.webContents.send('console', 'unknown message: ' + fn_name);
  };
};

function sendMessage(fn, arg) {
  var msg = {fn: 'keyDown', arg: arg};
  if (websocket) {
    websocket.send(JSON.stringify(msg));
  } else {
    console.log(msg);
  };
};

