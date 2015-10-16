const electron = require('electron')
const notify = require('electron-main-notification')
const Store = require('./store');
const https = require('https');
const http = require('http');
const fs = require('fs');
const FormData = require('form-data');
const Watcher = require('./watcher');
const path = require('path')
const url = require('url')
const AutoLaunch = require('auto-launch');

// Init store
const store = new Store();

global.store = store;

if (store.get('auto-upload-images') === null) {
  store.set('auto-upload-images', true);
}

if (store.get('auto-launch') === null) {
  store.set('auto-launch', true);
}

if (store.get('keep-active-in-tray-on-close') === null) {
  store.set('keep-active-in-tray-on-close', true);
}

if (store.get('use-shortened-links') === null) {
  store.set('use-shortened-links', false);
}

var autoLauncher = new AutoLaunch({
	name: 'Drop Party',
});

if (store.get('auto-launch') === true) {
  autoLauncher.enable();
} else {
  autoLauncher.disable();
}

store.on('change', (e) => {
  if (store.get('auto-launch') === true) {
    autoLauncher.enable();
  } else {
    autoLauncher.disable();
  }
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new electron.BrowserWindow({
    title: 'Drop Party',
    name: 'Drop Party',
    width: 300,
    height: 190,
    titleBarStyle: 'hiddenInset',
    resizable: false,
    fullscreen: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, '../images/icons/app/appIconTemplate.png'),
    backgroundColor: '#fff'
  })

  // and load the index.html of the electron.app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../views/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null;

    electron.app.dock.hide();
  });
}

let menu = new electron.Menu();

const uploadFile = (path, anything) => {
  if (store.get('auto-upload-images') !== true) {
    return;
  }

  let token = store.get('token');

  if (!token) {
    return;
  }

  if (anything !== true && path.toLowerCase().indexOf('.jpg') === -1 && path.toLowerCase().indexOf('.jpeg') === -1 && path.toLowerCase().indexOf('.gif') === -1 && path.toLowerCase().indexOf('.png') === -1) {
    return;
  }

  let form = new FormData();
  form.append('file', fs.createReadStream(path));
  form.append('short', store.get('use-shortened-links') ? '1' : '0');

  let headers = form.getHeaders();
  headers['Authorization'] = token;

  let request = https.request({
    method: 'post',
    host: 'staging-api.dropparty.xyz',
    path: '/files.upload',
    headers: headers,
  });

  try {
    form.pipe(request);
  } catch (e) {
    notify('Upload failed', {
      body: 'Something went wrong while uploading the file!'
    })
    return;
  }

  request.on('error', () => {
    notify('Upload failed', {
      body: 'Something went wrong while uploading the file!'
    });
    return;
  });

  request.on('response', (response) => {
    if (response.statusCode !== 200) {
      notify('Upload failed', {
        body: 'Something went wrong while uploading the file!'
      })
      return;
    }

    response.on('data', function (chunk) {
       let response = JSON.parse(chunk);

       if (response.data.hashId) {
         electron.clipboard.writeText('https://dropparty.xyz/' + response.data.hashId);
       } else {
         electron.clipboard.writeText('https://dropparty.xyz/view/' + response.data.id);
       }

       notify('Upload finished', {
         body: 'File finished uploading, a link has been copied to your clipboard!'
       })
     });
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on('ready', () => {
  createWindow();

    // Setup the menubar with an icon
    tray = new electron.Tray(path.join(__dirname, '../images/icons/tray/blackTemplate.png'))
    tray.setPressedImage(path.join(__dirname, '../images/icons/tray/whiteTemplate.png'))

    // Add a click handler so that when the user clicks on the menubar icon, it shows
    // our popup window
    tray.on('click', function(event) {
      electron.app.dock.show();

      if (mainWindow === null) {
        createWindow()
      }
    })

    tray.on('drop-files', (event, files) => {
      if (files.length !== 1) {
        alert('invalid number of files dropped');
      }

      uploadFile(files[0], true);
    });
})

// Quit when all windows are closed.
electron.app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin' || store.get('keep-active-in-tray-on-close') === false) {
    electron.app.quit()
    return
  }

  if (store.get('keep-active-in-tray-on-close')) {
      mainWindow = null;
      electron.app.dock.hide();
  }
})

electron.app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Init watcher
const watcher = new Watcher();

// Start watching
watcher.watch();

watcher.onFileAdded = uploadFile;
