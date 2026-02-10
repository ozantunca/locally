const assert = require('chai').assert;
const fs = require('fs');

const argvParsed = require('optimist').argv as { mode?: string };

function deleteFolderRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
  }
}

if (!fs.existsSync('test/storage')) {
  fs.mkdirSync('test/storage');
}

deleteFolderRecursive('test/storage');

declare global {
  var window: { localStorage?: Storage } | undefined;
  var localStorage: Storage;
}

let LocalStorage: new (path: string) => Storage;
if (typeof localStorage === 'undefined' || localStorage === null) {
  LocalStorage = require('node-localstorage').LocalStorage;
  const storage = new LocalStorage('./test/storage');
  (global as unknown as { window: { localStorage: Storage }; localStorage: Storage }).window = {
    localStorage: storage
  };
  (global as unknown as { localStorage: Storage }).localStorage = storage;
}

type StoreConstructor = new (options?: object) => {
  set(key: string, value: unknown, options?: unknown): void;
  get(key: string | string[]): unknown;
  keys(pattern?: string | RegExp): string[];
  remove(key: string | string[]): void;
  scan(key: string | RegExp, fn: (value: unknown, key: string) => void): void;
  ttl(key: string, returnString?: boolean): number | string;
  persist(key: string): boolean;
  expire(key: string, ttl: number): boolean;
  clear(): boolean;
  key(index: number): string | undefined;
  length: number;
};

let Store: StoreConstructor;

switch (argvParsed.mode) {
  case 'dist':
    Store = require('../dist/locally').Store;
    break;

  case 'distmin':
    Store = require('../dist/locally.min').Store;
    break;

  case 'light':
    Store = require('../dist/light.min').Store;
    break;

  default:
    Store = require('../dist/locally').Store;
}

localStorage.setItem('preexisting', 'value');

describe('locally', function () {
  require('./locally-mocha')({
    assert,
    localStorage,
    Store,
    testMode: (argvParsed.mode as string) || 'src'
  });

  after(function () {
    deleteFolderRecursive('test/storage');
    fs.rmdirSync('test/storage');
  });
});
