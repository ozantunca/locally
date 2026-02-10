'use strict';
/// <reference path="globals.d.ts" />
(function () {
    var ls = typeof window !== 'undefined' ? window.localStorage : null;
    // Provide an in-memory fallback for older browsers.
    if (!ls) {
        var memoryStorage = {
            _data: {},
            setItem: function (id, val) {
                return (this._data[id] = String(val));
            },
            getItem: function (id) {
                return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
            },
            removeItem: function (id) {
                return delete this._data[id];
            },
            key: function (index) {
                for (var key in this._data) {
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
    var utils = {
        each: function (arr, iteratee) {
            var l = arr.length;
            while (l--)
                iteratee(arr[l], l);
        },
        map: function (arr, iteratee) {
            var newArr = new Array(arr.length);
            var l = arr.length;
            while (l--)
                newArr[l] = iteratee(arr[l], l);
            return newArr;
        },
        filter: function (arr, iteratee) {
            var newArr = [];
            var l = arr.length;
            while (l--) {
                if (iteratee(arr[l], l))
                    newArr.push(arr[l]);
            }
            return newArr;
        }
    };
    var _keys = [];
    var _config = {};
    var _timeouts = {};
    function Locally(options) {
        options = options || {};
        var configStr = ls.getItem('locally-config');
        if (!configStr) {
            _config = {};
            _rebuildConfig();
        }
        else {
            try {
                _config = JSON.parse(configStr);
            }
            catch (e) {
                if (!!configStr) {
                    try {
                        _config = JSON.parse(configStr);
                    }
                    catch (e2) {
                        throw new Error('Locally: config is corrupted');
                    }
                }
                else
                    throw new Error('Locally: config is corrupted');
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
    Locally.prototype.set = function (key, value, options) {
        if (arguments.length < 2)
            throw new Error('Locally: no key or value given');
        var opts = options || {};
        if (typeof options !== 'object') {
            opts = { ttl: options };
        }
        if (typeof opts.ttl === 'string') {
            opts.ttl = parseInt(opts.ttl, 10);
            if (isNaN(opts.ttl)) {
                throw new Error("Locally: ttl should be a number in /light version of Locally.");
            }
        }
        _config[key] = _config[key] || {};
        if (_keys.indexOf(key) === -1) {
            _keys.push(key);
        }
        if (opts.ttl && !isNaN(opts.ttl)) {
            _clearTimeout(key);
            _setTimeout(key, opts.ttl);
        }
        else if (_config[key].ttl) {
            _clearTimeout(key);
        }
        var res = _getType(value);
        value = res.value;
        _config[key].t = res.type;
        var keyStr = String(key);
        var valueStr = String(value);
        ls.setItem(keyStr, valueStr);
        _saveConfig();
    };
    Locally.prototype.get = function (key) {
        return Array.isArray(key)
            ? utils.map(key, function (item) { return _get(item); })
            : _get(key);
    };
    Locally.prototype.keys = function (pattern) {
        if (!pattern || pattern === '*')
            return _keys.slice(0);
        var regex = !(pattern instanceof RegExp)
            ? new RegExp('.*' + pattern + '.*')
            : pattern;
        return utils.filter(_keys, function (key) { return regex.test(key); });
    };
    Locally.prototype.remove = function (key) {
        if (typeof key === 'undefined')
            throw new Error("Locally: 'remove' requires a key");
        if (Array.isArray(key)) {
            utils.each(key, _remove);
        }
        else {
            _remove(key);
        }
    };
    Locally.prototype.scan = function (key, fn) {
        return utils.each(this.keys(key), function (keyName) {
            fn(_get(keyName), keyName);
        });
    };
    Locally.prototype.ttl = function (key) {
        var cfg = _config[key];
        if (!cfg)
            return -2;
        if (!cfg.ttl)
            return -1;
        return cfg.ttl - Date.now();
    };
    Locally.prototype.persist = function (key) {
        return _config[key]
            ? !!(delete _config[key].ttl && _saveConfig() && _clearTimeout(key))
            : false;
    };
    Locally.prototype.expire = function (key, ttl) {
        return _config[key]
            ? !!((_config[key].ttl = Date.now() + ttl) && _saveConfig())
            : false;
    };
    Locally.prototype.clear = function () {
        ls.clear();
        _config = {};
        _keys = [];
        return _saveConfig();
    };
    Locally.prototype.key = function (index) {
        return _keys[index];
    };
    function _remove(key) {
        var i = _keys.indexOf(key);
        if (i > -1) {
            ls.removeItem(key);
            _keys.splice(_keys.indexOf(key), 1);
            delete _config[key];
        }
    }
    function _saveConfig() {
        ls.setItem('locally-config', JSON.stringify(_config));
        return true;
    }
    function _get(key) {
        if (typeof key === 'undefined' || !_config[key])
            return null;
        if (_config[key].ttl && _config[key].ttl < Date.now()) {
            delete _config[key];
            _saveConfig();
            _remove(key);
            return null;
        }
        var temp;
        var value = ls.getItem(key);
        switch (_config[key].t) {
            case 'o':
                try {
                    return JSON.parse(value);
                }
                catch (e) { }
                return null;
            case 'd':
                return new Date(parseInt(value, 10));
            case 'r':
                return new RegExp(value.substring(1, value.length - 1));
            case 'f':
                eval('temp = ' + value);
                return temp;
            case 'n':
                return Number(value);
            case 'b':
                return value === '1';
            case 's':
            default:
                if (value === 'null')
                    return null;
                else if (value === 'undefined')
                    return undefined;
                else
                    return String(value);
        }
    }
    function _getType(value) {
        var type;
        switch (typeof value) {
            case 'object':
                if (value instanceof Date) {
                    value = value.getTime();
                    type = 'd';
                }
                else if (value instanceof RegExp) {
                    value = value.toString();
                    type = 'r';
                }
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
        var len = ls.length;
        _keys = new Array(len);
        var l = len;
        while (l--) {
            _keys[l] = ls.key(l) || '';
            _config[_keys[l]] = _config[_keys[l]] || {};
            ls.setItem(_keys[l], ls.getItem(_keys[l]) || '');
            if (_config[_keys[l]].ttl) {
                _setTimeout(_keys[l], _config[_keys[l]].ttl - Date.now());
            }
        }
        var configIndex = _keys.indexOf('locally-config');
        if (configIndex > -1) {
            _keys.splice(configIndex, 1);
        }
    }
    function _setTimeout(key, ttl) {
        _config[key] = _config[key] || {};
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
        return false;
    }
    if (typeof exports === 'object') {
        exports.Store = Locally;
    }
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return { Store: Locally };
        });
    }
    if (typeof window === 'object') {
        window.Locally = {
            Store: Locally
        };
    }
})();
//# sourceMappingURL=light.js.map