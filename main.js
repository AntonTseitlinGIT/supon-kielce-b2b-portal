const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    icon: path.join(__dirname, 'logo.png')
  });

  win.loadFile('index.html');

  // Disable DevTools and custom menu in production
  if (app.isPackaged) {
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools();
    });
    Menu.setApplicationMenu(null);
  } else {
    // Open DevTools in development mode
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
