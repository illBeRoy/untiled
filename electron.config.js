const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile('dist/index.html');

  if (process.env.NODE_ENV === 'development') {
    const watch = require('watch');
    watch.watchTree('dist', () => win.reload());
  }
}

app.on('ready', createWindow);
