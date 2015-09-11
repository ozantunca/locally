
'use strict';

(function () {
  var ls = localStorage;

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
          newArr.push(iteratee);
      }
      return newArr;
    }
  }

  var _keys, _config;

  var Locally = function (options) {
    // load current localStorage state
    _config = ls.getItem('locally-config');

    // start anew if no config
    if (!_config) {
      _config = {};
      _keys = [];
    }
    else {
      _config = JSON.parse(_config);

      var l = ls.length
        , keys = new Array(l);

      // Cache localStorage keys for faster access
      while (l--) {
        keys[l] = ls.key(l);
        _config[keys[l]] = _config[keys[l]] || {};
      }

      // Exclude locally-config from keys array
      keys.splice(keys.indexOf('locally-config'), 1);
      _keys = keys;
    }

    _saveConfig = _saveConfig.bind(this);
    _remove = _remove.bind(this);
    _get = _get.bind(this);

    _saveConfig();
  };

  Locally.prototype.set = function (key, value, options) {
    if (!key || !value)
      return new Error('no key or value given');

    options = options || {};

    if (typeof options === 'number') {
      options = { ttl: options };
    }

    // Set TTL
    _config[key] = _config[key] || {};

    // Add to keys array
    if (_keys.indexOf(key) == -1) {
      _keys.push(key);
    }

    // Set TTL
    if (options.ttl && !isNaN(options.ttl)) {
      _config[key].ttl = Date.now() + options.ttl;
    }

    // LocalStorage saves and returns values as strings.
    // Type of values will be saved so that values will be
    // parsed to their original type.
    switch (typeof value) {
      case 'object':
        // Keep Date objects as timestamps
        if (value instanceof Date) {
          value = value.getTime();
          _config[key].t = 'd';
        }
        // Keep RegExp objects as strings
        else if (value instanceof RegExp) {
          value = value.toString();
          _config[key].t = 'r';
        }
        // Otherwise keep them as JSON
        else {
          value = JSON.stringify(value);
          _config[key].t = 'o';
        }
        break;

      case 'function':
        _config[key].t = 'f';
        break;

      case 'number':
        _config[key].t = 'n';
        break;

      case 'boolean':
        value = value ? 1 : 0;
        _config[key].t = 'b';
        break;

      case 'string':
      default:
        _config[key].t = 's';
    }

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

    return _keys.filter(function (key) {
      return pattern.test(key);
    });
  }

  Locally.prototype.remove = function (key) {
    if (typeof key === 'undefined')
      throw new Error('\'remove\' requires a key');

    if (Array.isArray(key)) {
      utils.each(key, _remove);
    } else {
      _remove(key);
    }
  }

  Locally.prototype.scan = function (key, fn) {
    return utils.each(this.keys(key), fn);
  }

  Locally.prototype.ttl = function (key) {
    return _config[key] ? _config[key].ttl ? _config[key].ttl - Date.now() : null : -1;
  }

  Locally.prototype.persist = function (key) {
    return _config[key] && delete _config[key].ttl && _saveConfig();
  }

  Locally.prototype.expire = function (key, ttl) {
    return _config[key] && (_config[key].ttl = Date.now() + ttl) && _saveConfig();
  }

  Locally.prototype.clear = function () {
    return ls.clear(), _config = {}, _saveConfig(), _keys = [];
  }

  // Removes a value from localStorage
  function _remove(key) {
    ls.removeItem(key);
    _keys.splice(_keys.indexOf(key), 1);
  }

  // Saves config to localStorage
  function _saveConfig() {
    ls.setItem('locally-config', JSON.stringify(_config));
  }

  function _get(key) {
    // Return null if no key is given
    if (typeof key === 'undefined' || !_config[key]) return null;

    // Check for TTL
    // If TTL is exceeded delete data
    // and return null
    if (_config[key].ttl < Date.now()) {
      delete _config[key];

      _saveConfig();
      _remove(key);

      return null;
    }

    var value = ls.getItem(key), temp;

    // Return value in correct type
    switch (_config[key].t) {
      case 'o':
        return JSON.parse(value);
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

      case 's':
        return String(value);
        break;

      case 'b':
        return value == '1';
        break;
    }
    return value;
  }

  if (typeof exports === 'object') {
    // CommonJS
    module.exports.Store = Locally;
  }
  else if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return {
        Store: Locally
      };
    });
  }
  else {
    // Browser global.
    window.Locally = {
      Store: Locally
    };
  }
})();
