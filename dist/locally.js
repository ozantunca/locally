
'use strict';

(function () {
  var utils = {
    each: function (arr, iteratee) {
      for(var l = arr.length; l-- !== 0;)
        iteratee(arr[l], l);
    }
  }

  var Locally = function () {
    this._keys = [];
    this._values = {};
  };

  Locally.prototype.set = function (key, value, ttl) {
    localStorage.setItem(key, value);
    this._keys.push(key);
    this._values[key] = {
      value: value,
      ttl: ttl
    };
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
