'use strict';

const electron = require('electron');
var http = require('http');
var fs = require('fs');

var flashLoader = require('flash-player-loader');
var path = '/Volumes/SpindMac/Users/corona/Library/Application Support/Google/Chrome/PepperFlash/21.0.0.216/PepperFlashPlayer.plugin';
flashLoader.addSource(path);
console.log(flashLoader.getVersion(path));
path = '/Volumes/SpindMac/Users/corona/Library/Application Support/Google/Chrome/PepperFlash/21.0.0.216';
flashLoader.addSource(path);
flashLoader.load();

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let websocket;

var keymap;

const ipcMain = require('electron').ipcMain;

function startWebsocketServer() {
  // Websocket Server
  // https://github.com/websockets/ws
  var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 39682 });

  wss.on('connection', function connection(ws) {

    websocket = ws;

    // ws.send('connected');

    ws.on('message', function incoming(message, flags) {
      console.log('received: %s', message);
      var jmsg = JSON.parse(message);
      var ret = handleMessage(jmsg);
      ws.send(JSON.stringify(ret));
    });

  });
};

ipcMain.on('keyDown', function(event, arg) {
  if (keymap) {
    console.log('mapping_key: '+arg);
    console.log('running_key: '+arg+" = "+keymap[arg]);
    try {
      eval(keymap[arg]);
    } catch (e) {
       console.log(e);
    }
  } else {
    console.log('no_map_key: '+arg)
    sendMessage('keyDown', arg);
  }
});


function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({show: false, 'web-preferences': {'web-security': false, 'plugins': true}});

  // and load the index.html of the app.
  win.loadURL('file://' + __dirname + '/index.html');

  win.webContents.on('did-finish-load', function() {
    win.webContents.send('console', 'ready');
    startWebsocketServer();
    // win.show();
    console.log('rcBrowser Ready');
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

function close() {
    var msg = {fn: 'backToBlack'};
    win.webContents.send('webview', JSON.stringify(msg));
    win.hide();
    sendMessage('close');  // Ensure kodi is notified of the closure.
}

function keyPress(keycode) {
  var msg = {fn: 'keyPress', arg: keycode};
  console.log('sending to window: '+JSON.stringify(msg));
  win.webContents.send('webview', JSON.stringify(msg));
}

function webviewJavascript(js) {
  var msg = {fn: 'executeJavaScript', arg: js};
  var ret = win.webContents.send('webview', JSON.stringify(msg));
  return ret;
}

function handleMessage(message) {
  var fn_name = message.fn;
  var arg = message.arg;
  var seq = message.seq;
  var ret = {seq:seq, arg:null};

  switch(fn_name) {

    case 'loadURL':
      var msg = {fn: 'loadURL', arg: arg}
      win.webContents.send('webview', JSON.stringify(msg));
      ret.arg = true;
      break;

    case 'keyPress':
      keyPress(arg);
      ret.arg = true;
      // console.log("->" + msg);
      break;

    case 'show':
      win.show();
      ret.arg = true;
      break;

    case 'hide':
      win.hide();
      ret.arg = true;
      break;

    case 'close':
      close();
      ret.arg = true;
      break;

    case 'back':
      var msg = {fn: 'back'};
      win.webContents.send('webview', JSON.stringify(msg));
      ret.arg = true;
      break;

    case 'setKeymap':
      console.log('setting keymap: '+arg)
      keymap = JSON.parse(arg);
      ret.arg = true;
      break;

    case 'getCookies':
      var ses = session.fromPartition("persist:rcBrowser");
      ret.arg = ses.cookies;
      break;

    case 'setCookies':
      var ses = session.fromPartition("persist:rcBrowser");
      ses.cookies.set(arg);
      break;

    case 'executeJavaScript':
      console.log(arg);
      try {
        ret.arg = eval(arg);
      } catch (e) {
         console.log(e);
      }
      break;

    case 'setFullScreen':
      var enable = (arg.toLowerCase() == 'true');
      win.setFullScreen(enable);
      ret.arg = enable;
      break;

    case 'downloadImages':
      for (let req in arg) {
          http.get(req.url, function(response) {
            var file = fs.createWriteStream(req.path);
            response.pipe(file);
      })};
      break;
    
    default:
      win.webContents.send('console', 'unknown message: ' + fn_name);
      ret.arg = false;

  };
  return ret
};

function sendMessage(fn, arg) {
  var msg = JSON.stringify({fn: fn, arg: arg});
  if (websocket) {
    websocket.send(msg);
    console.log("<-" + msg);
  } else {
    console.log(msg);
  };
};

// var template = [
//   {
//     label: 'rcBrowser',
//     submenu: [
//       {
//         label: 'Quit',
//         accelerator: 'Command+Q',
//         click: function() { app.quit(); }
//       }
//     ]
//   },
//   {
//     label: 'View',
//     submenu [
//     {
//         label: 'Dev Tools',
//         // click: function() { remote.getCurrentWindow().toggleDevTools(); }
//         click: function(item, focusedWindow) {
//           if (focusedWindow)
//             focusedWindow.webContents.toggleDevTools();
//         }

//     },
//     {
//         label: 'Inner Dev Tools',
//         click: function() { sendMessage('devTools'); }
//     }
//     ];
//   },
// ];

// var template = [
//   {
//     label: 'Edit',
//     submenu: [
//       {
//         label: 'Undo',
//         accelerator: 'CmdOrCtrl+Z',
//         role: 'undo'
//       },
//       {
//         label: 'Redo',
//         accelerator: 'Shift+CmdOrCtrl+Z',
//         role: 'redo'
//       },
//       {
//         type: 'separator'
//       },
//       {
//         label: 'Cut',
//         accelerator: 'CmdOrCtrl+X',
//         role: 'cut'
//       },
//       {
//         label: 'Copy',
//         accelerator: 'CmdOrCtrl+C',
//         role: 'copy'
//       },
//       {
//         label: 'Paste',
//         accelerator: 'CmdOrCtrl+V',
//         role: 'paste'
//       },
//       {
//         label: 'Select All',
//         accelerator: 'CmdOrCtrl+A',
//         role: 'selectall'
//       },
//     ]
//   },
//   {
//     label: 'View',
//     submenu: [
//       {
//         label: 'Reload',
//         accelerator: 'CmdOrCtrl+R',
//         click: function(item, focusedWindow) {
//           if (focusedWindow)
//             focusedWindow.reload();
//         }
//       },
//       {
//         label: 'Toggle Full Screen',
//         accelerator: (function() {
//           if (process.platform == 'darwin')
//             return 'Ctrl+Command+F';
//           else
//             return 'F11';
//         })(),
//         click: function(item, focusedWindow) {
//           if (focusedWindow)
//             focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
//         }
//       },
//       {
//         label: 'Toggle Developer Tools',
//         accelerator: (function() {
//           if (process.platform == 'darwin')
//             return 'Alt+Command+I';
//           else
//             return 'Ctrl+Shift+I';
//         })(),
//         click: function(item, focusedWindow) {
//           if (focusedWindow)
//             focusedWindow.webContents.toggleDevTools();
//         }
//       },
//       {
//         label: 'Toggle Inner Developer Tools',
//         click: function() { sendMessage('devTools'); }
//       }
//     ]
//   },
//   {
//     label: 'Window',
//     role: 'window',
//     submenu: [
//       {
//         label: 'Minimize',
//         accelerator: 'CmdOrCtrl+M',
//         role: 'minimize'
//       },
//       {
//         label: 'Close',
//         accelerator: 'CmdOrCtrl+W',
//         role: 'close'
//       },
//     ]
//   },
//   {
//     label: 'Help',
//     role: 'help',
//     submenu: [
//       {
//         label: 'Learn More',
//         click: function() { require('electron').shell.openExternal('http://electron.atom.io') }
//       },
//     ]
//   },
// ];

// if (process.platform == 'darwin') {
//   var name = app.getName();
//   template.unshift({
//     label: name,
//     submenu: [
//       {
//         label: 'About ' + name,
//         role: 'about'
//       },
//       {
//         type: 'separator'
//       },
//       {
//         label: 'Services',
//         role: 'services',
//         submenu: []
//       },
//       {
//         type: 'separator'
//       },
//       {
//         label: 'Hide ' + name,
//         accelerator: 'Command+H',
//         role: 'hide'
//       },
//       {
//         label: 'Hide Others',
//         accelerator: 'Command+Alt+H',
//         role: 'hideothers'
//       },
//       {
//         label: 'Show All',
//         role: 'unhide'
//       },
//       {
//         type: 'separator'
//       },
//       {
//         label: 'Quit',
//         accelerator: 'Command+Q',
//         click: function() { app.quit(); }
//       },
//     ]
//   });
//   // Window menu.
//   template[3].submenu.push(
//     {
//       type: 'separator'
//     },
//     {
//       label: 'Bring All to Front',
//       role: 'front'
//     }
//   );
// }

// var Menu = require('menu')

// var menu = Menu.buildFromTemplate(template);
// Menu.setApplicationMenu(menu);




