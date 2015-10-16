const electron = require('electron');
const chokidar = require('chokidar');

class Watcher {
  constructor(opts) {
    this.path = (electron.app || electron.remote.app).getPath('desktop');
    this.watching = false;
  }

  watch() {
    if (this.watching === true) {
      return;
    }

    this.watching = true;

    this.watcher = chokidar.watch(this.path, {
      ignored: /[\/\\]\./,
      persistent: true,
    });

    this.watcher.on('add', this.fileAdded.bind(this));
    this.watcher.on('ready', this.ready.bind(this));
  }

  ready() {
    this.ready = true;

    console.log('Watcher is ready!');
  }

  fileAdded(path) {
    if (this.ready !== true) {
      return;
    }

    if (typeof this.onFileAdded !== 'function') {
      return;
    }

    this.onFileAdded(path);
  }
}

// expose the class
module.exports = Watcher;
