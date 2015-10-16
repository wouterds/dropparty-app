const electron = require('electron');
const path = require('path');
const fs = require('fs');
const events = require('events');
const util = require('util');

parseDataFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    return {};
  }
}

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    const fileName = (opts ? opts.configName : null) || 'udata';
    this.path = path.join(userDataPath, fileName + '.json');

    if (!fs.existsSync(userDataPath)) {
      fs.mkdir(userDataPath);
    }

    if (!fs.existsSync(this.path)) {
      fs.writeFileSync(this.path, '{}');
    }

    this.data = parseDataFile(this.path);
  }

  // This will just return the property on the `data` object
  get(key) {
    if (!(this.data !== undefined && this.data[key] !== undefined)) {
      return null;
    }

    return this.data[key];
  }

  // ...and this will set it
  set(key, val) {
    this.data[key] = val;

    // Wait, I thought using the node.js' synchronous APIs was bad form?
    // We're not writing a server so there's not nearly the same IO demand on the process
    // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete,
    // we might lose that data. Note that in a real app, we would try/catch this.
    fs.writeFileSync(this.path, JSON.stringify(this.data));

    this.emit('change');
  }
}

util.inherits(Store, events.EventEmitter);

// expose the class
module.exports = Store;
