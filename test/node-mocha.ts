const { assert } = require("chai");
const fs = require("fs");
const optimist = require("optimist");

const argvParsed = optimist.argv as { mode?: string };

function deleteFolderRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file: string) => {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
  }
}

if (!fs.existsSync("test/storage")) {
  fs.mkdirSync("test/storage");
}

deleteFolderRecursive("test/storage");

const g = global as unknown as {
  window?: { localStorage?: Storage };
  localStorage?: Storage;
};
let testLocalStorage: Storage;
let LocalStorage: new (path: string) => Storage;
if (typeof g.localStorage === "undefined" || g.localStorage === null) {
  LocalStorage = require("node-localstorage").LocalStorage;
  const storage = new LocalStorage("./test/storage");
  g.window = { localStorage: storage };
  g.localStorage = storage;
  testLocalStorage = storage;
} else {
  testLocalStorage = g.localStorage;
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
  case "dist":
    Store = require("../dist/locally").Store;
    break;

  case "light":
    Store = require("../dist/light").Store;
    break;

  default:
    Store = require("../dist/locally").Store;
}

testLocalStorage.setItem("preexisting", "value");

require("./locally-mocha")({
  assert,
  localStorage: testLocalStorage,
  Store,
  testMode: (argvParsed.mode as string) || "src",
});

describe("locally cleanup", function () {
  after(function () {
    deleteFolderRecursive("test/storage");
    fs.rmdirSync("test/storage");
  });
});
