import ms from 'ms';
import * as lzstring from 'lz-string';

interface StorageLike {
  setItem(id: string, val: string): string;
  getItem(id: string): string | undefined | null;
  removeItem(id: string): void;
  key(index: number): string | null;
  clear(): void;
  length: number;
}

interface MemoryStorage extends StorageLike {
  _data: Record<string, string>;
}

interface KeyConfig {
  t?: string;
  c?: number;
  ttl?: number;
}

interface Config {
  [key: string]: KeyConfig | undefined;
}

interface SetOptions {
  ttl?: number | string;
  compress?: boolean;
}

interface TypeResult {
  value: string | number;
  type: string;
}

interface LocallyOptions {
  compress?: boolean;
}

let ls: StorageLike | null =
  typeof window !== 'undefined' ? (window as unknown as { localStorage: StorageLike }).localStorage : null;

// Provide an in-memory fallback for older browsers.
if (!ls) {
  const memoryStorage: MemoryStorage = {
    _data: {},
    setItem: function (id: string, val: string) {
      return (this._data[id] = String(val));
    },
    getItem: function (id: string) {
      return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    },
    removeItem: function (id: string) {
      return delete this._data[id];
    },
    key: function (index: number) {
      for (const key in this._data) {
        if (!(index--)) {
          return key;
        }
      }
      return null;
    },
    clear: function () {
      return (this._data = {});
    },
    get length() {
      return Object.keys(this._data).length;
    }
  };
  ls = memoryStorage;
}

const utils = {
  each: function <T>(arr: T[], iteratee: (item: T, index: number) => void) {
    let l = arr.length;
    while (l--) iteratee(arr[l], l);
  },
  map: function <T, U>(arr: T[], iteratee: (item: T, index: number) => U): U[] {
    const newArr = new Array(arr.length) as U[];
    let l = arr.length;
    while (l--) newArr[l] = iteratee(arr[l], l);
    return newArr;
  },
  filter: function <T>(arr: T[], iteratee: (item: T, index: number) => boolean): T[] {
    const newArr: T[] = [];
    let l = arr.length;
    while (l--) {
      if (iteratee(arr[l], l)) newArr.push(arr[l]);
    }
    return newArr;
  }
};

let _keys: string[] = [];
let _config: Config = {};
let _compressAll = false;
const _timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

function Locally(this: void, options?: LocallyOptions) {
  options = options || {};
  _compressAll = !!options.compress;

  const configStr = ls!.getItem('locally-config');

  if (!configStr) {
    _config = {};
    _rebuildConfig();
  } else {
    const deconfig = lzstring.decompressFromUTF16(configStr);

    try {
      _config = JSON.parse(deconfig || configStr);
    } catch (e) {
      if (!!deconfig) {
        try {
          _config = JSON.parse(configStr);
        } catch (e2) {
          throw new Error('Locally: config is corrupted');
        }
      } else throw new Error('Locally: config is corrupted');
    }

    _rebuildConfig();
  }

  _saveConfig();

  Object.defineProperty(this, 'length', {
    get: function () {
      return _keys.length;
    }
  });
}

Locally.prototype.set = function (
  key: string,
  value: unknown,
  options?: SetOptions | number | string
) {
  if (arguments.length < 2) throw new Error('Locally: no key or value given');

  let opts: SetOptions = (options as SetOptions) || {};

  if (typeof options !== 'object') {
    opts = { ttl: options as number | string };
  }

  if (typeof opts.ttl === 'string') {
    opts.ttl = (ms as (input: string | number) => number)(opts.ttl);
  }

  _config[key] = _config[key] || {};

  if (_keys.indexOf(key) === -1) {
    _keys.push(key);
  }

  if (opts.ttl && !isNaN(opts.ttl as number)) {
    _clearTimeout(key);
    _setTimeout(key, opts.ttl as number);
  } else if (_config[key]!.ttl) {
    _clearTimeout(key);
  }

  const res = _getType(value);

  value = res.value;
  _config[key]!.t = res.type;

  if (opts.compress || _compressAll) {
    _config[key]!.c = 1;
    value = lzstring.compressToUTF16((value as string).toString());
  }

  const keyStr = String(key);
  const valueStr = String(value);

  ls!.setItem(keyStr, valueStr);
  _saveConfig();
};

Locally.prototype.get = function (key: string | string[]) {
  return Array.isArray(key)
    ? utils.map(key, (item) => _get(item as string))
    : _get(key);
};

Locally.prototype.keys = function (pattern?: string | RegExp) {
  if (!pattern || pattern === '*') return _keys.slice(0);

  const regex = !(pattern instanceof RegExp)
    ? new RegExp('.*' + pattern + '.*')
    : pattern;

  return utils.filter(_keys, (key) => regex.test(key));
};

Locally.prototype.remove = function (key: string | string[]) {
  if (typeof key === 'undefined')
    throw new Error("Locally: 'remove' requires a key");

  if (Array.isArray(key)) {
    utils.each(key, _remove);
  } else {
    _remove(key);
  }
};

Locally.prototype.scan = function (key: string | RegExp, fn: (value: unknown, key: string) => void) {
  return utils.each(this.keys(key), (keyName: string) => {
    fn(_get(keyName), keyName);
  });
};

Locally.prototype.ttl = function (key: string, returnString?: boolean): number | string {
  const cfg = _config[key];
  if (!cfg) return -2;
  if (!cfg.ttl) return -1;
  const remaining = cfg.ttl - Date.now();
  return !returnString ? remaining : (ms as (input: string | number) => string)(remaining);
};

Locally.prototype.persist = function (key: string) {
  return _config[key]
    ? !!(delete _config[key]!.ttl && _saveConfig() && _clearTimeout(key))
    : false;
};

Locally.prototype.expire = function (key: string, ttl: number) {
  return _config[key]
    ? !!((_config[key]!.ttl = Date.now() + ttl) && _saveConfig())
    : false;
};

Locally.prototype.clear = function () {
  ls!.clear();
  _config = {};
  _keys = [];
  return _saveConfig();
};

Locally.prototype.key = function (index: number) {
  return _keys[index];
};

function _remove(key: string) {
  const i = _keys.indexOf(key);
  if (i > -1) {
    ls!.removeItem(key);
    _keys.splice(_keys.indexOf(key), 1);
    delete _config[key];
  }
}

function _saveConfig() {
  ls!.setItem('locally-config', lzstring.compressToUTF16(JSON.stringify(_config)));
  return true;
}

function _get(key: string): unknown {
  if (typeof key === 'undefined' || !_config[key]) return null;

  if (_config[key]!.ttl && _config[key]!.ttl! < Date.now()) {
    delete _config[key];
    _saveConfig();
    _remove(key);
    return null;
  }

  let temp: unknown;
  let value = _config[key]!.c
    ? lzstring.decompressFromUTF16(ls!.getItem(key) || '')
    : ls!.getItem(key);

  switch (_config[key]!.t) {
    case 'o':
      try {
        value = JSON.parse(value as string);
      } catch (e) {}
      return value;

    case 'd':
      return new Date(parseInt(value as string, 10));

    case 'r':
      return new RegExp((value as string).substring(1, (value as string).length - 1));

    case 'f':
      eval('temp = ' + value);
      return temp;

    case 'n':
      return Number(value);

    case 'b':
      return value === '1';

    case 's':
    default:
      if (value === 'null') return null;
      else if (value === 'undefined') return undefined;
      else return String(value);
  }
}

function _getType(value: unknown): TypeResult {
  let type: string;

  switch (typeof value) {
    case 'object':
      if (value instanceof Date) {
        value = (value as Date).getTime();
        type = 'd';
      } else if (value instanceof RegExp) {
        value = (value as RegExp).toString();
        type = 'r';
      } else {
        value = JSON.stringify(value);
        type = 'o';
      }
      break;

    case 'function':
      type = 'f';
      break;

    case 'number':
      type = 'n';
      break;

    case 'boolean':
      value = value ? 1 : 0;
      type = 'b';
      break;

    case 'string':
    default:
      type = 's';
  }

  return {
    value: value as string | number,
    type
  };
}

function _rebuildConfig() {
  const len = ls!.length;
  _keys = new Array(len);

  let l = len;
  while (l--) {
    _keys[l] = ls!.key(l) || '';
    _config[_keys[l]] = _config[_keys[l]] || {};

    if (_compressAll && !_config[_keys[l]]!.c) {
      _config[_keys[l]]!.c = 1;
      ls!.setItem(_keys[l], lzstring.compressToUTF16(ls!.getItem(_keys[l]) || ''));
    } else if (!_compressAll && _config[_keys[l]]!.c) {
      delete _config[_keys[l]]!.c;
      ls!.setItem(_keys[l], lzstring.decompressFromUTF16(ls!.getItem(_keys[l]) || '') || '');
    }

    if (_config[_keys[l]]!.ttl) {
      _setTimeout(_keys[l], _config[_keys[l]]!.ttl! - Date.now());
    }
  }

  const configIndex = _keys.indexOf('locally-config');
  if (configIndex > -1) {
    _keys.splice(configIndex, 1);
  }
}

function _setTimeout(key: string, ttl: number) {
  _config[key] = _config[key] || {};
  _config[key]!.ttl = Date.now() + ttl;
  _timeouts[key] = setTimeout(() => {
    _remove(key);
  }, ttl);
}

function _clearTimeout(key: string) {
  if (_keys.indexOf(key) > -1) {
    clearTimeout(_timeouts[key]);
    delete _timeouts[key];
    delete _config[key]!.ttl;
    return true;
  }
  return false;
}

export { Locally as Store };
