'use strict';

(function () {
  var ls = typeof window !== 'undefined' ? window.localStorage : null
    , ms = require('ms')
    , lzstring = require('lz-string');

  // Provide an in-memory fallback for
  // older browsers.
  if (!ls) {
    ls = {
      _data: {},
      setItem: function(id, val) {
        return this._data[id] = String(val);
      },
      getItem: function(id) {
        return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
      },
      removeItem: function(id) {
        return delete this._data[id];
      },
      key: function (index) {
        for (var key in this_data) {
          if (!(index--)) {
            return key;
          }
        }
      },
      clear: function() {
        return this._data = {};
      }
    };
  }

  // Fastest utility functions for this case.
  // Faster than underscore and lodash.
  // Besides, do I even need them here?
  var utils = {
    each: function (arr, iteratee) {
      var l = arr.length;
      while (l--) iteratee(arr[l], l);
    },
    map : function (arr, iteratee) {
      var newArr = new Array(arr.length)
        , l = arr.length;
      while (l--) newArr[l] = iteratee(arr[l], l);
      return newArr;
    },
    filter: function (arr, iteratee) {
      var newArr = []
        , l = arr.length;
      while (l--) {
        if (iteratee(arr[l], l))
          newArr.push(arr[l]);
      }
      return newArr;
    }
  }

  var _keys, _config, _compressAll, _timeouts = {};

  var Locally = function (options) {
    // custom options
    options = options || {};
    _compressAll = options.compress;

    // load current localStorage state
    _config = ls.getItem('locally-config');

    // start anew if no config
    if (!_config) {
      _config = {};

      // reads localstorage and updates config
      _rebuildConfig();
    }
    else {
      var deconfig = lzstring.decompressFromUTF16(_config);

      try {
        _config = JSON.parse(deconfig || _config);
      } catch (e) {
        if (!!deconfig) {
          try {
            _config = JSON.parse(_config);
          } catch (e) {
            throw new Error('Locally: config is corrupted');
          }
        } else throw new Error('Locally: config is corrupted');
      }

      // reads localstorage and updates config
      _rebuildConfig();
    }

    _saveConfig();

    Object.defineProperty(this, 'length', {
      get: function () {
        return _keys.length;
      }
    });
  };

  Locally.prototype.set = function (key, value, options) {
    if (arguments.length < 2)
      throw new Error('Locally: no key or value given');

    options = options || {};

    if (typeof options !== 'object') {
      options = { ttl: options };
    }

    if (typeof options.ttl === 'string') {
      options.ttl = ms(options.ttl);
    }

    // Set TTL
    _config[key] = _config[key] || {};

    // Add to keys array
    if (_keys.indexOf(key) == -1) {
      _keys.push(key);
    }

    // Set TTL
    if (options.ttl && !isNaN(options.ttl)) {
      _clearTimeout(key);
      _setTimeout(key, options.ttl);
    } else if (_config[key].ttl) {
      _clearTimeout(key);
    }

    // LocalStorage saves and returns values as strings.
    // Type of values will be saved so that values will be
    // parsed to their original type.
    var res = _getType(value);

    value = res.value;
    _config[key].t = res.type;

    // compression
    if (options.compress || _compressAll) {
      _config[key].c = 1;
      value = lzstring.compressToUTF16(value.toString());
    }

    key = String(key);
    value = String(value);

    ls.setItem(key, value);
    _saveConfig();
  }

  Locally.prototype.get = function (key) {
    return Array.isArray(key) ? utils.map(key, function (item) { return _get(item); }.bind(this)) : _get(key);
  }

  Locally.prototype.keys = function (pattern) {
    // Return all keys
    if (!pattern || pattern == '*') return _keys.slice(0);

    // RegExp pattern to be queried
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp('.*' + pattern + '.*');
    }

    return utils.filter(_keys, function (key) {
      return pattern.test(key);
    });
  }

  Locally.prototype.remove = function (key) {
    if (typeof key === 'undefined')
      throw new Error('Locally: \'remove\' requires a key');

    if (Array.isArray(key)) {
      utils.each(key, _remove);
    } else {
      _remove(key);
    }
  }

  // callback gets 'value' and 'key' as parameters
  Locally.prototype.scan = function (key, fn) {
    return utils.each(this.keys(key), function (key) {
      fn(_get(key), key);
    });
  }

  Locally.prototype.ttl = function (key, returnString) {
    return _config[key] ? _config[key].ttl ? (!returnString ? _config[key].ttl - Date.now() : ms(_config[key].ttl - Date.now())) : -1 : -2;
  }

  Locally.prototype.persist = function (key) {
    return _config[key] ? delete _config[key].ttl && _saveConfig() && _clearTimeout(key) : false;
  }

  Locally.prototype.expire = function (key, ttl) {
    return _config[key] ? !!(_config[key].ttl = Date.now() + ttl) && _saveConfig() : false;
  }

  Locally.prototype.clear = function () {
    ls.clear();

    _config = {};
    _keys = [];
    return _saveConfig();
  }

  Locally.prototype.key = function (index) {
    return _keys[index];
  }

  // Removes a value from localStorage
  function _remove(key) {
    var i = _keys.indexOf(key)
    if (i > -1) {
      ls.removeItem(key);
      _keys.splice(_keys.indexOf(key), 1);
      delete _config[key];
    }
  }

  // Saves config to localStorage
  function _saveConfig() {
    ls.setItem('locally-config', lzstring.compressToUTF16( JSON.stringify(_config)) );
    return true;
  }

  function _get(key) {
    // Return null if no key is given
    if (typeof key === 'undefined' || !_config[key]) return null;

    // Check for TTL
    // If TTL is exceeded delete data
    // and return null
    if (_config[key].ttl && _config[key].ttl < Date.now()) {
      delete _config[key];

      _saveConfig();
      _remove(key);

      return null;
    }

    var temp, value = _config[key].c ? lzstring.decompressFromUTF16( ls.getItem(key) ) : ls.getItem(key);

    // Return value in correct type
    switch (_config[key].t) {
      case 'o':
        try {
          value = JSON.parse(value);
        } catch (e) {}

        return value;
        break;

      case 'd':
        return new Date(parseInt(value, 10));
        break;

      case 'r':
        return new RegExp(value.substring(1, value.length - 1));
        break;

      case 'f':
        eval('temp = ' + value);
        return temp;
        break;

      case 'n':
        return Number(value);
        break;

      case 'b':
        return value == '1';
        break;

      case 's':
      default:
        if (value === 'null')
          return null;
        else if (value === 'undefined')
          return undefined;
        else return String(value);
        break;
    }
  }

  function _getType(value) {
    var type;

    switch (typeof value) {
      case 'object':
        // Keep Date objects as timestamps
        if (value instanceof Date) {
          value = value.getTime();
          type = 'd';
        }
        // Keep RegExp objects as strings
        else if (value instanceof RegExp) {
          value = value.toString();
          type = 'r';
        }
        // Otherwise keep them as JSON
        else {
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
      value: value,
      type: type
    };
  }

  function _rebuildConfig() {
    var l = ls.length;
    _keys = new Array(l);

    // Cache localStorage keys for faster access
    while (l--) {
      _keys[l] = ls.key(l);
      _config[_keys[l]] = _config[_keys[l]] || {};

      // _compressAll is given and value is not
      // compressed then compress the value
      if (_compressAll && !_config[_keys[l]].c) {
        _config[_keys[l]].c = true;
        ls.setItem(_keys[l], lzstring.compressToUTF16( ls.getItem(_keys[l]) ));
      }
      // if the value is compressed and
      // compressAll is not given then decompress
      // current value.
      else if (!_compressAll && _config[_keys[l]].c) {
        delete _config[_keys[l]].c;
        ls.setItem(_keys[l], lzstring.decompressFromUTF16( ls.getItem(_keys[l]) ));
      }

      if (_config[_keys[l]].ttl) {
        _setTimeout(_keys[l], _config[_keys[l]].ttl - Date.now());
      }
    }

    // Exclude locally-config from _keys array
    if (_keys.indexOf('locally-config') > -1) {
      _keys.splice(_keys.indexOf('locally-config'), 1);
    }
  }

  function _setTimeout(key, ttl) {
    _config[key].ttl = Date.now() + ttl;
    _timeouts[key] = setTimeout(function () {
      _remove(key);
    }, ttl);
  }

  function _clearTimeout(key) {
    if (_keys.indexOf(key) > -1) {
      clearTimeout(_timeouts[key]);
      delete _timeouts[key];
      delete _config[key].ttl;
      return true;
    }
    else return false;
  }

  // CommonJS
  if (typeof exports === 'object') {
    module.exports.Store = Locally;
  }
   // AMD. Register as an anonymous module.
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return {
        Store: Locally
      };
    });
  }
  // Browser global.
  if (typeof window === 'object') {
    window.Locally = {
      Store: Locally
    };
  }
})();
