(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.locallyjs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],2:[function(require,module,exports){
"use strict";!function(){function _remove(e){ls.removeItem(e),_keys.splice(_keys.indexOf(e),1),this.length=_keys.length}function _saveConfig(){return ls.setItem("locally-config",JSON.stringify(_config)),!0}function _get(key){if("undefined"==typeof key||!_config[key])return null;if(_config[key].ttl<Date.now())return delete _config[key],_saveConfig(),_remove(key),null;var value=ls.getItem(key),temp;switch(_config[key].t){case"o":return JSON.parse(value);case"d":return new Date(parseInt(value,10));case"r":return new RegExp(value.substring(1,value.length-1));case"f":return eval("temp = "+value),temp;case"n":return Number(value);case"s":return String(value);case"b":return"1"==value}return value}var ls="undefined"!=typeof window?window.localStorage:null,ms=require("ms");ls||(ls={_data:{},setItem:function(e,t){return this._data[e]=String(t)},getItem:function(e){return this._data.hasOwnProperty(e)?this._data[e]:void 0},removeItem:function(e){return delete this._data[e]},key:function e(t){for(var e in this_data)if(!t--)return e},clear:function(){return this._data={}}});var utils={each:function(e,t){for(var n=e.length;n--;)t(e[n],n)},map:function(e,t){for(var n=new Array(e.length),o=e.length;o--;)n[o]=t(e[o],o);return n},filter:function(e,t){for(var n=[],o=e.length;o--;)t(e[o],o)&&n.push(t);return n}},_keys,_config,Locally=function(e){if(_config=ls.getItem("locally-config")){var t=ls.length;for(_config=JSON.parse(_config),_keys=new Array(t);t--;)_keys[t]=ls.key(t),_config[_keys[t]]=_config[_keys[t]]||{};_keys.splice(_keys.indexOf("locally-config"),1),this.length=_keys.length}else _config={},_keys=[],this.length=0;_saveConfig=_saveConfig.bind(this),_remove=_remove.bind(this),_get=_get.bind(this),_saveConfig()};Locally.prototype.set=function(e,t,n){if(!e||!t)return new Error("no key or value given");switch(n=n||{},"object"!=typeof n&&(n={ttl:n}),"string"==typeof n.ttl&&(n.ttl=ms(n.ttl)),_config[e]=_config[e]||{},-1==_keys.indexOf(e)&&(_keys.push(e),this.length=_keys.length),n.ttl&&!isNaN(n.ttl)?_config[e].ttl=Date.now()+n.ttl:_config[e].ttl&&delete _config[e].ttl,typeof t){case"object":t instanceof Date?(t=t.getTime(),_config[e].t="d"):t instanceof RegExp?(t=t.toString(),_config[e].t="r"):(t=JSON.stringify(t),_config[e].t="o");break;case"function":_config[e].t="f";break;case"number":_config[e].t="n";break;case"boolean":t=t?1:0,_config[e].t="b";break;case"string":default:_config[e].t="s"}ls.setItem(e,t),_saveConfig()},Locally.prototype.get=function(e){return Array.isArray(e)?utils.map(e,function(e){return _get(e)}.bind(this)):_get(e)},Locally.prototype.keys=function(e){return e&&"*"!=e?(e instanceof RegExp||(e=new RegExp(".*"+e+".*")),utils.filter(_keys,function(t){return e.test(t)})):_keys.slice(0)},Locally.prototype.remove=function(e){if("undefined"==typeof e)throw new Error("'remove' requires a key");Array.isArray(e)?utils.each(e,_remove):_remove(e)},Locally.prototype.scan=function(e,t){return utils.each(this.keys(e),t)},Locally.prototype.ttl=function(e,t){return _config[e]?_config[e].ttl?t?ms(_config[e].ttl-Date.now()):_config[e].ttl-Date.now():-1:-2},Locally.prototype.persist=function(e){return _config[e]?delete _config[e].ttl&&_saveConfig():!1},Locally.prototype.expire=function(e,t){return _config[e]?!!(_config[e].ttl=Date.now()+t)&&_saveConfig():!1},Locally.prototype.clear=function(){return ls.clear(),this.length=0,_config={},_keys=[],_saveConfig()},Locally.prototype.key=function(e){return _keys[e]},"object"==typeof exports&&(module.exports.Store=Locally),"function"==typeof define&&define.amd&&define(function(){return{Store:Locally}}),"object"==typeof window&&(window.Locally={Store:Locally})}();

},{"ms":1}]},{},[2])(2)
});