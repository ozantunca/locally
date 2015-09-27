
var assert = require('chai').assert
  , argv = require('optimist').argv
  , fs = require('fs')
  , Store, store, LocalStorage;


function deleteFolderRecursive (path) {
  if ( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function (file,index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
  }
};

if (!fs.existsSync('test/storage')) {
  fs.mkdirSync('test/storage');
}

deleteFolderRecursive('test/storage');

if (typeof localStorage === "undefined" || localStorage === null) {
  window = {};
  LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = window.localStorage = new LocalStorage('./test/storage');
}

if (argv.dist) {
  Store = require('../dist/locally').Store
} else if (argv.es6) {
  Store = require('../dist/locally.es6').Store
} else if (argv.es6min) {
  Store = require('../dist/locally.es6.min').Store
} else if (argv.distmin) {
  Store = require('../dist/locally.min').Store
} else {
  Store = require('../src/locally').Store
}

localStorage.setItem('preexisting', 'value');

describe('locally', function() {

  require('./locally-mocha.js')({
    assert: assert,
    localStorage: localStorage,
    Store: Store
  });

  after(function () {
    deleteFolderRecursive('test/storage');
    fs.rmdirSync('test/storage');
  });

});

