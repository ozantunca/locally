"use strict";
var Locally = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/ms/index.js
  var require_ms = __commonJS({
    "node_modules/ms/index.js"(exports, module) {
      "use strict";
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse(val);
        } else if (type === "number" && isNaN(val) === false) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
      };
      function parse(str) {
        str = String(str);
        if (str.length > 1e4) {
          return;
        }
        var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms2) {
        if (ms2 >= d) {
          return Math.round(ms2 / d) + "d";
        }
        if (ms2 >= h) {
          return Math.round(ms2 / h) + "h";
        }
        if (ms2 >= m) {
          return Math.round(ms2 / m) + "m";
        }
        if (ms2 >= s) {
          return Math.round(ms2 / s) + "s";
        }
        return ms2 + "ms";
      }
      function fmtLong(ms2) {
        return plural(ms2, d, "day") || plural(ms2, h, "hour") || plural(ms2, m, "minute") || plural(ms2, s, "second") || ms2 + " ms";
      }
      function plural(ms2, n, name) {
        if (ms2 < n) {
          return;
        }
        if (ms2 < n * 1.5) {
          return Math.floor(ms2 / n) + " " + name;
        }
        return Math.ceil(ms2 / n) + " " + name + "s";
      }
    }
  });

  // node_modules/lz-string/libs/lz-string.js
  var require_lz_string = __commonJS({
    "node_modules/lz-string/libs/lz-string.js"(exports, module) {
      "use strict";
      var LZString = (function() {
        var f = String.fromCharCode;
        var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
        var baseReverseDic = {};
        function getBaseValue(alphabet, character) {
          if (!baseReverseDic[alphabet]) {
            baseReverseDic[alphabet] = {};
            for (var i = 0; i < alphabet.length; i++) {
              baseReverseDic[alphabet][alphabet.charAt(i)] = i;
            }
          }
          return baseReverseDic[alphabet][character];
        }
        var LZString2 = {
          compressToBase64: function(input) {
            if (input == null) return "";
            var res = LZString2._compress(input, 6, function(a) {
              return keyStrBase64.charAt(a);
            });
            switch (res.length % 4) {
              // To produce valid Base64
              default:
              // When could this happen ?
              case 0:
                return res;
              case 1:
                return res + "===";
              case 2:
                return res + "==";
              case 3:
                return res + "=";
            }
          },
          decompressFromBase64: function(input) {
            if (input == null) return "";
            if (input == "") return null;
            return LZString2._decompress(input.length, 32, function(index) {
              return getBaseValue(keyStrBase64, input.charAt(index));
            });
          },
          compressToUTF16: function(input) {
            if (input == null) return "";
            return LZString2._compress(input, 15, function(a) {
              return f(a + 32);
            }) + " ";
          },
          decompressFromUTF16: function(compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return LZString2._decompress(compressed.length, 16384, function(index) {
              return compressed.charCodeAt(index) - 32;
            });
          },
          //compress into uint8array (UCS-2 big endian format)
          compressToUint8Array: function(uncompressed) {
            var compressed = LZString2.compress(uncompressed);
            var buf = new Uint8Array(compressed.length * 2);
            for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
              var current_value = compressed.charCodeAt(i);
              buf[i * 2] = current_value >>> 8;
              buf[i * 2 + 1] = current_value % 256;
            }
            return buf;
          },
          //decompress from uint8array (UCS-2 big endian format)
          decompressFromUint8Array: function(compressed) {
            if (compressed === null || compressed === void 0) {
              return LZString2.decompress(compressed);
            } else {
              var buf = new Array(compressed.length / 2);
              for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
              }
              var result = [];
              buf.forEach(function(c) {
                result.push(f(c));
              });
              return LZString2.decompress(result.join(""));
            }
          },
          //compress into a string that is already URI encoded
          compressToEncodedURIComponent: function(input) {
            if (input == null) return "";
            return LZString2._compress(input, 6, function(a) {
              return keyStrUriSafe.charAt(a);
            });
          },
          //decompress from an output of compressToEncodedURIComponent
          decompressFromEncodedURIComponent: function(input) {
            if (input == null) return "";
            if (input == "") return null;
            input = input.replace(/ /g, "+");
            return LZString2._decompress(input.length, 32, function(index) {
              return getBaseValue(keyStrUriSafe, input.charAt(index));
            });
          },
          compress: function(uncompressed) {
            return LZString2._compress(uncompressed, 16, function(a) {
              return f(a);
            });
          },
          _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            var i, value2, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
            for (ii = 0; ii < uncompressed.length; ii += 1) {
              context_c = uncompressed.charAt(ii);
              if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                context_dictionary[context_c] = context_dictSize++;
                context_dictionaryToCreate[context_c] = true;
              }
              context_wc = context_w + context_c;
              if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                context_w = context_wc;
              } else {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                  if (context_w.charCodeAt(0) < 256) {
                    for (i = 0; i < context_numBits; i++) {
                      context_data_val = context_data_val << 1;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                    }
                    value2 = context_w.charCodeAt(0);
                    for (i = 0; i < 8; i++) {
                      context_data_val = context_data_val << 1 | value2 & 1;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                      value2 = value2 >> 1;
                    }
                  } else {
                    value2 = 1;
                    for (i = 0; i < context_numBits; i++) {
                      context_data_val = context_data_val << 1 | value2;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                      value2 = 0;
                    }
                    value2 = context_w.charCodeAt(0);
                    for (i = 0; i < 16; i++) {
                      context_data_val = context_data_val << 1 | value2 & 1;
                      if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                      } else {
                        context_data_position++;
                      }
                      value2 = value2 >> 1;
                    }
                  }
                  context_enlargeIn--;
                  if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                  }
                  delete context_dictionaryToCreate[context_w];
                } else {
                  value2 = context_dictionary[context_w];
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value2 & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value2 = value2 >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                context_dictionary[context_wc] = context_dictSize++;
                context_w = String(context_c);
              }
            }
            if (context_w !== "") {
              if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                  }
                  value2 = context_w.charCodeAt(0);
                  for (i = 0; i < 8; i++) {
                    context_data_val = context_data_val << 1 | value2 & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value2 = value2 >> 1;
                  }
                } else {
                  value2 = 1;
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value2;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value2 = 0;
                  }
                  value2 = context_w.charCodeAt(0);
                  for (i = 0; i < 16; i++) {
                    context_data_val = context_data_val << 1 | value2 & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value2 = value2 >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
              } else {
                value2 = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value2 & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value2 = value2 >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
            }
            value2 = 2;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = context_data_val << 1 | value2 & 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value2 = value2 >> 1;
            }
            while (true) {
              context_data_val = context_data_val << 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data.push(getCharFromInt(context_data_val));
                break;
              } else context_data_position++;
            }
            return context_data.join("");
          },
          decompress: function(compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return LZString2._decompress(compressed.length, 32768, function(index) {
              return compressed.charCodeAt(index);
            });
          },
          _decompress: function(length, resetValue, getNextValue) {
            var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
            for (i = 0; i < 3; i += 1) {
              dictionary[i] = i;
            }
            bits = 0;
            maxpower = Math.pow(2, 2);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            switch (next = bits) {
              case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                c = f(bits);
                break;
              case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                c = f(bits);
                break;
              case 2:
                return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true) {
              if (data.index > length) {
                return "";
              }
              bits = 0;
              maxpower = Math.pow(2, numBits);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              switch (c = bits) {
                case 0:
                  bits = 0;
                  maxpower = Math.pow(2, 8);
                  power = 1;
                  while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                      data.position = resetValue;
                      data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                  }
                  dictionary[dictSize++] = f(bits);
                  c = dictSize - 1;
                  enlargeIn--;
                  break;
                case 1:
                  bits = 0;
                  maxpower = Math.pow(2, 16);
                  power = 1;
                  while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                      data.position = resetValue;
                      data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                  }
                  dictionary[dictSize++] = f(bits);
                  c = dictSize - 1;
                  enlargeIn--;
                  break;
                case 2:
                  return result.join("");
              }
              if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
              }
              if (dictionary[c]) {
                entry = dictionary[c];
              } else {
                if (c === dictSize) {
                  entry = w + w.charAt(0);
                } else {
                  return null;
                }
              }
              result.push(entry);
              dictionary[dictSize++] = w + entry.charAt(0);
              enlargeIn--;
              w = entry;
              if (enlargeIn == 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
              }
            }
          }
        };
        return LZString2;
      })();
      if (typeof define === "function" && define.amd) {
        define(function() {
          return LZString;
        });
      } else if (typeof module !== "undefined" && module != null) {
        module.exports = LZString;
      } else if (typeof angular !== "undefined" && angular != null) {
        angular.module("LZString", []).factory("LZString", function() {
          return LZString;
        });
      }
    }
  });

  // src/locally.ts
  var locally_exports = {};
  __export(locally_exports, {
    Store: () => Locally
  });
  var import_ms = __toESM(require_ms());
  var lzstring = __toESM(require_lz_string());
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
      opts.ttl = (0, import_ms.default)(opts.ttl);
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
    return !returnString ? remaining : (0, import_ms.default)(remaining);
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
        _setTimeout(_keys[l], _config[_keys[l]].ttl - Date.now());
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
  return __toCommonJS(locally_exports);
})();
//# sourceMappingURL=locally.global.js.map