
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
    }
  }

  var Locally = function (options) {
    // load current localStorage state
    this._config = ls.getItem('locally-config');

    // start anew if no config
    if (!this._config) {
      this._config = {};
      this._keys = [];
    }
    else {
      this._config = JSON.parse(this._config);

      var l = ls.length
        , keys = new Array(l);

      // Cache localStorage keys for faster access
      while (l--) {
        keys[l] = ls.key(l);
        this._config[keys[l]] = this._config[keys[l]] || {};
      }

      // Exclude locally-config from keys array
      keys.splice(keys.indexOf('locally-config'), 1);
      this._keys = keys;
    }

    _saveConfig(this._config);
  };

  Locally.prototype.set = function (key, value, options) {
    if (!key || !value)
      return new Error('no key or value given');

    options = options || {};

    // Set TTL
    this._config[key] = this._config[key] || {};

    // Add to keys array
    if (this._keys.indexOf(key) == -1) {
      this._keys.push(key);
    }

    // Set TTL
    if (options.ttl && !isNaN(options.ttl)) {
      this._config[key].ttl = Date.now() + options.ttl;
    }

    // LocalStorage saves and returns values as strings.
    // Type of values will be saved so that values will be
    // parsed to their original type.
    switch (typeof value) {
      case 'object':
        // Keep Date objects as timestamps
        if (value instanceof Date) {
          value = value.getTime();
          this._config[key].t = 'd';
        }
        // Keep RegExp objects as strings
        else if (value instanceof RegExp) {
          value = value.toString();
          this._config[key].t = 'r';
        }
        // Otherwise keep them as JSON
        else {
          value = JSON.stringify(value);
          this._config[key].t = 'o';
        }
        break;

      case 'function':
        this._config[key].t = 'f';
        break;

      case 'number':
        this._config[key].t = 'n';
        break;

      case 'boolean':
        value = value ? 1 : 0;
        this._config[key].t = 'b';
        break;

      case 'string':
      default:
        this._config[key].t = 's';
    }

    ls.setItem(key, value);
    _saveConfig(this._config);
  }

  Locally.prototype.get = function (key) {
    return Array.isArray(key) ? utils.map(key, function (item) { return _get.call(this, item); }.bind(this)) : _get.call(this, key);
  }

  Locally.prototype.keys = function (pattern) {
    // Return all keys
    if (!pattern || pattern == '*') return this._keys.slice(0);

    // RegExp pattern to be queried
    if (!(pattern instanceof RegExp)) {
      pattern = new RegExp('.*' + pattern + '.*');
    }

    return this._keys.filter(function (key) {
      return pattern.test(key);
    });
  }

  Locally.prototype.remove = function (key) {
    if (typeof key === 'undefined')
      throw new Error('\'remove\' requires a key');

    _remove(key);
  }

  // Removes a value from localStorage
  function _remove(key) {
    ls.removeItem(key);
    this._keys.splice(this._keys.indexOf(key), 1);
  }

  // Saves config to localStorage
  function _saveConfig(config) {
    ls.setItem('locally-config', JSON.stringify(config));
  }

  function _get(key) {
    // Return null if no key is given
    if (typeof key === 'undefined' || !this._config[key]) return null;

    // Check for TTL
    // If TTL is exceeded delete data
    // and return null
    if (this._config[key].ttl < Date.now()) {
      delete this._config[key];

      _saveConfig(this._config);
      _remove.call(this, key);

      return null;
    }

    var value = ls.getItem(key), temp;

    // Return value in correct type
    switch (this._config[key].t) {
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
    module.exports = Locally;
  }
  else if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return Locally;
    });
  }
  else {
    // Browser global.
    window.Locally = Locally;
  }
})();
