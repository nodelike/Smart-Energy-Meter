const { app, BrowserWindow } = require('electron');
const path = require('path');


function createWindow () {
  const win = new BrowserWindow({
    width: 1080,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'logo.ico')
  });

  win.loadFile('index.html');

}

app.whenReady().then(createWindow);
