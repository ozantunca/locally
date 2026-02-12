// src/locally.ts
import ms from "ms";
import * as lzstring from "lz-string";
var ls = typeof window !== "undefined" ? window.localStorage : null;
if (!ls) {
  const memoryStorage = {
    _data: {},
    setItem: function(id, val) {
      return this._data[id] = String(val);
    },
    getItem: function(id) {
      return this._data.hasOwnProperty(id) ? this._data[id] : void 0;
    },
    removeItem: function(id) {
      return delete this._data[id];
    },
    key: function(index) {
      for (const key2 in this._data) {
        if (!index--) {
          return key2;
        }
      }
      return null;
    },
    clear: function() {
      return this._data = {};
    },
    get length() {
      return Object.keys(this._data).length;
    }
  };
  ls = memoryStorage;
}
var utils = {
  each: function(arr, iteratee) {
    let l = arr.length;
    while (l--) iteratee(arr[l], l);
  },
  map: function(arr, iteratee) {
    const newArr = new Array(arr.length);
    let l = arr.length;
    while (l--) newArr[l] = iteratee(arr[l], l);
    return newArr;
  },
  filter: function(arr, iteratee) {
    const newArr = [];
    let l = arr.length;
    while (l--) {
      if (iteratee(arr[l], l)) newArr.push(arr[l]);
    }
    return newArr;
  }
};
var _keys = [];
var _config = {};
var _compressAll = false;
var _timeouts = {};
function Locally(options) {
  options = options || {};
  _compressAll = !!options.compress;
  const configStr = ls.getItem("locally-config");
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
          throw new Error("Locally: config is corrupted");
        }
      } else throw new Error("Locally: config is corrupted");
    }
    _rebuildConfig();
  }
  _saveConfig();
  Object.defineProperty(this, "length", {
    get: function() {
      return _keys.length;
    }
  });
}
Locally.prototype.set = function(key2, value2, options) {
  if (arguments.length < 2) throw new Error("Locally: no key or value given");
  let opts = options || {};
  if (typeof options !== "object") {
    opts = { ttl: options };
  }
  if (typeof opts.ttl === "string") {
    opts.ttl = ms(opts.ttl);
  }
  _config[key2] = _config[key2] || {};
  if (_keys.indexOf(key2) === -1) {
    _keys.push(key2);
  }
  if (opts.ttl && !isNaN(opts.ttl)) {
    _clearTimeout(key2);
    _setTimeout(key2, opts.ttl);
  } else if (_config[key2].ttl) {
    _clearTimeout(key2);
  }
  const res = _getType(value2);
  value2 = res.value;
  _config[key2].t = res.type;
  if (opts.compress || _compressAll) {
    _config[key2].c = 1;
    value2 = lzstring.compressToUTF16(value2.toString());
  }
  const keyStr = String(key2);
  const valueStr = String(value2);
  ls.setItem(keyStr, valueStr);
  _saveConfig();
};
Locally.prototype.get = function(key2) {
  return Array.isArray(key2) ? utils.map(key2, (item) => _get(item)) : _get(key2);
};
Locally.prototype.keys = function(pattern) {
  if (!pattern || pattern === "*") return _keys.slice(0);
  const regex = !(pattern instanceof RegExp) ? new RegExp(".*" + pattern + ".*") : pattern;
  return utils.filter(_keys, (key2) => regex.test(key2));
};
Locally.prototype.remove = function(key2) {
  if (typeof key2 === "undefined")
    throw new Error("Locally: 'remove' requires a key");
  if (Array.isArray(key2)) {
    utils.each(key2, _remove);
  } else {
    _remove(key2);
  }
};
Locally.prototype.scan = function(key2, fn) {
  return utils.each(this.keys(key2), (keyName) => {
    fn(_get(keyName), keyName);
  });
};
Locally.prototype.ttl = function(key2, returnString) {
  const cfg = _config[key2];
  if (!cfg) return -2;
  if (!cfg.ttl) return -1;
  const remaining = cfg.ttl - Date.now();
  return !returnString ? remaining : ms(remaining);
};
Locally.prototype.persist = function(key2) {
  return _config[key2] ? !!(delete _config[key2].ttl && _saveConfig() && _clearTimeout(key2)) : false;
};
Locally.prototype.expire = function(key2, ttl) {
  return _config[key2] ? !!((_config[key2].ttl = Date.now() + ttl) && _saveConfig()) : false;
};
Locally.prototype.clear = function() {
  ls.clear();
  _config = {};
  _keys = [];
  return _saveConfig();
};
Locally.prototype.key = function(index) {
  return _keys[index];
};
function _remove(key2) {
  const i = _keys.indexOf(key2);
  if (i > -1) {
    ls.removeItem(key2);
    _keys.splice(_keys.indexOf(key2), 1);
    delete _config[key2];
  }
}
function _saveConfig() {
  ls.setItem("locally-config", lzstring.compressToUTF16(JSON.stringify(_config)));
  return true;
}
function _get(key) {
  if (typeof key === "undefined" || !_config[key]) return null;
  if (_config[key].ttl && _config[key].ttl < Date.now()) {
    delete _config[key];
    _saveConfig();
    _remove(key);
    return null;
  }
  let temp;
  let value = _config[key].c ? lzstring.decompressFromUTF16(ls.getItem(key) || "") : ls.getItem(key);
  switch (_config[key].t) {
    case "o":
      try {
        value = JSON.parse(value);
      } catch (e) {
      }
      return value;
    case "d":
      return new Date(parseInt(value, 10));
    case "r":
      return new RegExp(value.substring(1, value.length - 1));
    case "f":
      eval("temp = " + value);
      return temp;
    case "n":
      return Number(value);
    case "b":
      return value === "1";
    case "s":
    default:
      if (value === "null") return null;
      else if (value === "undefined") return void 0;
      else return String(value);
  }
}
function _getType(value2) {
  let type;
  switch (typeof value2) {
    case "object":
      if (value2 instanceof Date) {
        value2 = value2.getTime();
        type = "d";
      } else if (value2 instanceof RegExp) {
        value2 = value2.toString();
        type = "r";
      } else {
        value2 = JSON.stringify(value2);
        type = "o";
      }
      break;
    case "function":
      type = "f";
      break;
    case "number":
      type = "n";
      break;
    case "boolean":
      value2 = value2 ? 1 : 0;
      type = "b";
      break;
    case "string":
    default:
      type = "s";
  }
  return {
    value: value2,
    type
  };
}
function _rebuildConfig() {
  const len = ls.length;
  _keys = new Array(len);
  let l = len;
  while (l--) {
    _keys[l] = ls.key(l) || "";
    _config[_keys[l]] = _config[_keys[l]] || {};
    if (_compressAll && !_config[_keys[l]].c) {
      _config[_keys[l]].c = 1;
      ls.setItem(_keys[l], lzstring.compressToUTF16(ls.getItem(_keys[l]) || ""));
    } else if (!_compressAll && _config[_keys[l]].c) {
      delete _config[_keys[l]].c;
      ls.setItem(_keys[l], lzstring.decompressFromUTF16(ls.getItem(_keys[l]) || "") || "");
    }
    if (_config[_keys[l]].ttl) {
      const remaining = _config[_keys[l]].ttl - Date.now();
      if (remaining <= 0) {
        _remove(_keys[l]);
      } else {
        _setTimeout(_keys[l], remaining);
      }
    }
  }
  const configIndex = _keys.indexOf("locally-config");
  if (configIndex > -1) {
    _keys.splice(configIndex, 1);
  }
}
function _setTimeout(key2, ttl) {
  _config[key2] = _config[key2] || {};
  _config[key2].ttl = Date.now() + ttl;
  _timeouts[key2] = setTimeout(() => {
    _remove(key2);
  }, ttl);
}
function _clearTimeout(key2) {
  if (_keys.indexOf(key2) > -1) {
    clearTimeout(_timeouts[key2]);
    delete _timeouts[key2];
    delete _config[key2].ttl;
    return true;
  }
  return false;
}
export {
  Locally as Store
};
//# sourceMappingURL=locally.mjs.map