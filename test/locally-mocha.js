
if (typeof exports === 'object') {
  var assert, localStorage, store, Store;

  module.exports = function (vars) {
    assert = vars.assert;
    localStorage = vars.localStorage;
    Store = vars.Store;
    store = new Store();

    runTests();
  };
} else runTests();

function expectedLen (len) {
  assert.lengthOf(localStorage, len);
  assert.lengthOf(store, len - 1);
}

function deepCompare () {
  var i, l, leftChain, rightChain;

  function compare2Objects (x, y) {
    var p;

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
         return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on step when comparing prototypes
    if (x === y) {
        return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
       (x instanceof Date && y instanceof Date) ||
       (x instanceof RegExp && y instanceof RegExp) ||
       (x instanceof String && y instanceof String) ||
       (x instanceof Number && y instanceof Number)) {
        return x.toString() === y.toString();
    }

    // At last checking prototypes as good a we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }

    if (x.constructor !== y.constructor) {
      return false;
    }

    if (x.prototype !== y.prototype) {
      return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
       return false;
    }

    // Quick checking of one object beeing a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      }
      else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }

    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      }
      else if (typeof y[p] !== typeof x[p]) {
        return false;
      }

      switch (typeof (x[p])) {
        case 'object':
        case 'function':

          leftChain.push(x);
          rightChain.push(y);

          if (!compare2Objects (x[p], y[p])) {
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }

  for (i = 1, l = arguments.length; i < l; i++) {

    leftChain = []; //Todo: this can be cached
    rightChain = [];

    if (!compare2Objects(arguments[0], arguments[i])) {
      return false;
    }
  }

  return true;
}

function runTests () {
  describe('setting values', function set() {
    it('should add one value to localStorage', function () {
      var len = localStorage.length;
      store.set('key', 'value');

      // tests
      expectedLen(len + 1);
      assert.strictEqual(store.get('key'), 'value');
    });

    it('should overwrite a value', function () {
      var len = localStorage.length;
      store.set('key', 'different value');

      // tests
      expectedLen(len);
      assert.strictEqual(store.get('key'), 'different value');
    });

    it('should add another value', function () {
      var len = localStorage.length;
      store.set('key2', 'some value');

      // tests
      expectedLen(len + 1);
      assert.strictEqual(store.get('key2'), 'some value');
    });

    it('should cache a value with options object', function (done) {
      var len = localStorage.length;

      store.set('key4', 'value', { ttl: 1000 });

      // tests
      expectedLen(len + 1);
      assert.isNotNull(store.get('key4'));

      setTimeout(function () {
        expectedLen(len);
        assert.isNull(store.get('key4'));
        done();
      }, 1010);
    });

    it('should cache a value with options object when ttl is string', function (done) {
      var len = localStorage.length;

      store.set('key4', 'value', { ttl: '1s' });

      // tests
      expectedLen(len + 1);
      assert.isNotNull(store.get('key4'));

      setTimeout(function () {
        expectedLen(len);
        assert.isNull(store.get('key4'));
        done();
      }, 1010);
    });

    it('should overwrite timeout if new value is set', function () {
      store.set('overwrite', 'somevalue', 1000);
      store.set('overwrite', 'some other value');

      assert.equal(store.ttl('overwrite'), -1);
    });

    it('should cache a value using ms(\'2s\')', function (done) {
      this.timeout(3000);

      var len = localStorage.length;
      store.set('key5', 'value', '2s');

      expectedLen(len + 1);
      assert.isNotNull(store.get('key5'));

      setTimeout(function () {
        assert.isNull(store.get('key5'));
        expectedLen(len);
        done();
      }, 2010);
    });

    it('should cache a value using ms(\'1m\')', function (done) {
      var len = localStorage.length;
      store.set('key5', 'value', '1m');

      expectedLen(len + 1);
      assert.isNotNull(store.get('key5'));

      setTimeout(function () {
        assert.isNotNull(store.get('key5'));
        assert.isBelow(store.ttl('key5'), 60000);
        assert.isAbove(store.ttl('key5'), 59000);

        done();
      }, 500);
    });

    it('should cache a value using ms(\'2 days\')', function (done) {
      var len = localStorage.length;
      store.set('key6', 'value', '2 days');

      expectedLen(len + 1);
      assert.isNotNull(store.get('key6'));

      setTimeout(function () {
        assert.isBelow(store.ttl('key6'), 60 * 60 * 24 * 2 * 1000);

        done();
      }, 1000);
    });

    it('should be able to store falsy values', function () {
      store.set('falsy1', null);
      store.set('falsy2', undefined);
      store.set('falsy3', false);
      store.set('falsy4', '');
      store.set('falsy5', 0);
      store.set('falsy6', NaN);

      assert.isNull(store.get('falsy1'), null);
      assert.isUndefined(store.get('falsy2'), undefined);
      assert.strictEqual(store.get('falsy3'), false);
      assert.strictEqual(store.get('falsy4'), '');
      assert.strictEqual(store.get('falsy5'), 0);
      assert.ok(isNaN(store.get('falsy6')));

      store.remove('falsy1');
      store.remove('falsy6');
    });
  });

  describe('compression', function compression() {
    it('should compress given value', function () {
      store.set('compress1', 'tobecompressed', { compress: true });

      assert.isBelow(localStorage.getItem('compress1').length, 'tobecompressed'.length)
      assert.equal(store.get('compress1').length, 'tobecompressed'.length);
    });

    it('should compress all', function () {
      var store3 = new Store({ compress: true });

      store3.set('shouldbecompressed', 'tobecompressed');
      store3.set('shouldbecompressed2', 'tobecompressed');

      assert.isBelow(localStorage.getItem('shouldbecompressed').length, 'tobecompressed'.length)
      assert.equal(store.get('shouldbecompressed'), 'tobecompressed');

      assert.isBelow(localStorage.getItem('shouldbecompressed').length, 'tobecompressed'.length)
      assert.equal(store.get('shouldbecompressed2'), 'tobecompressed');

      store.scan('*', function (value, key) {
        assert.notEqual(localStorage.getItem(key), value);
      });
    });

    it('get() should return decompressed value', function () {
      store.set('decompress1', 'tobedecompressed', { compress: true });

      assert.equal(store.get('decompress1'), 'tobedecompressed');
    });

    it('should decompress all', function () {
      new Store();

      store.scan('*', function (value, key) {
        assert.isNotNull(localStorage.getItem(key));
        assert.equal(value, store.get(key));
      });
    });
  });

  describe('type checks', function () {
    it('should be able to add an object', function () {
      var len = localStorage.length;
      var obj = { 'some': 'object', 'number': 3, 'arr': [] };
      store.set('key3', obj);

      // tests
      expectedLen(len + 1);
      assert.typeOf(store.get('key3'), 'object');
      assert.ok(deepCompare(store.get('key3'), obj));
    });

    it('should be able to save a function', function () {
      var len = localStorage.length;
      var fn = function () { return 'test function'; };
      store.set('fn1', fn);

      // tests
      expectedLen(len + 1);
      assert.typeOf(store.get('fn1'), 'function');
      assert.equal(store.get('fn1')(), 'test function');
    });

    it('should be able to save a Date', function () {
      var len = localStorage.length;
      var date = new Date(2012, 10, 10);
      store.set('date1', date);

      // tests
      expectedLen(len + 1);
      assert.typeOf(store.get('date1'), 'date');
      assert.ok(store.get('date1') instanceof Date);
      assert.equal(store.get('date1').getTime(), (new Date(2012, 10, 10).getTime()));
    });

    it('should be able to save a Number', function () {
      var len = localStorage.length;
      var num = 23014; // some random number
      store.set('num1', num);

      // tests
      expectedLen(len + 1);
      assert.typeOf(store.get('num1'), 'number');
    });

    it('should be able to save a Boolean', function () {
      var len = localStorage.length;
      var bool1 = false, bool2 = true;
      store.set('bool1', bool1);
      store.set('bool2', bool2);

      // tests
      expectedLen(len + 2);

      // bool1
      assert.typeOf(store.get('bool1'), 'boolean');
      assert.strictEqual(store.get('bool1'), bool1);

      // bool2
      assert.typeOf(store.get('bool2'), 'boolean');
      assert.strictEqual(store.get('bool2'), bool2);
    });
  });

  describe('get()', function() {
    it('should return a value', function () {
      assert.strictEqual(store.get('key'), 'different value');
    });

    it('should return several values', function () {
      var vals = store.get(['key', 'key2', 'key3']);

      assert.lengthOf(vals, 3);
      assert.deepEqual(vals, ['different value', 'some value', { 'some': 'object', 'number': 3, 'arr': [] }]);
    });
  });

  describe('keys()', function() {
    it('should return all keys', function () {
      var len = localStorage.length - 1;
      var keys = store.keys();

      assert.equal(keys.length, store.length);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, len);

      for (var i in keys) {
        assert.typeOf(keys[i], 'string');
        assert.isNotNull(store.get(keys[i]));
      }

      keys.splice(0, 1);
      keys[0] = null;

      // should return the same copy of keys
      keys = store.keys();
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, len);

      for (var i in keys) {
        assert.typeOf(keys[i], 'string');
        assert.isNotNull(store.get(keys[i]));
      }
    });

    it('should return queried keys', function () {
      store.set('anykey', 'anyvalue');
      store.set('anykey2', 'anyvalue2');

      var keys = store.keys(/^key.*/);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 5);

      keys.forEach(function (k) {
        assert.equal(k.indexOf('key'), 0);
      });

      var keys = store.keys(/.*key.*/);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 7);

      keys.forEach(function (k) {
        assert.isAbove(k.indexOf('key'), -1);
      });

      // when given string, locally should add .*
      // on both ends and query like that
      var keys = store.keys('key');
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 7);

      keys.forEach(function (k) {
        assert.isAbove(k.indexOf('key'), -1);
      });
    });
  });

  describe('scan()', function () {
    it('should iterate records that matches given key pattern', function () {
      var count = 0;

      store.scan('.*key.*', function (value, key) {
        count++;
        assert.isNotNull(value);
        assert.isNotNull(key);
        assert.deepEqual(store.get(key), value);
      });

      assert.equal(count, 7);
    });
  });

  describe('remove()', function() {
    it('should delete record of given key', function () {
      var len = localStorage.length;
      store.remove('key');
      assert.equal(len - 1, localStorage.length);
    });

    it('should be able to delete several keys', function () {
      var len = localStorage.length;
      store.remove(['key2', 'key3']);
      assert.equal(len - 2, localStorage.length);
    });
  });

  describe('ttl()', function () {
    it('should return time to live for a key', function (done) {
      store.set('somekey', 'somevalue', 1000);

      assert.isAbove(store.ttl('somekey'), 0);

      setTimeout(function () {
        assert.isBelow(store.ttl('somekey'), 1000);
      }, 5);

      setTimeout(function () {
        assert.isNull(store.get('somekey'));
        assert.equal(store.ttl('notexist'), -2);
        done();
      }, 1001);
    });

    it('should return string if second parameter is true', function (done) {
      store.set('somekey', 'somevalue', '2s');

      assert.isAbove(store.ttl('somekey'), 0);

      setTimeout(function () {
        assert.isBelow(store.ttl('somekey'), 2000);
        done();
      }, 5);

      assert.equal(store.ttl('somekey', true), '2s');
    });

    it('should return -2 if key does not exist', function () {
      assert.equal(store.ttl('notexist'), -2);
    });

    it('should return -1 if key exists but has no associated expire', function () {
      store.set('somekey', 'somevalue');

      assert.equal(store.ttl('somekey'), -1);
    });
  });

  describe('persist()', function () {
    it('should persist value of a key', function (done) {
      store.set('somekey', 'somevalue', 1000);

      assert.equal(store.persist('somekey'), 1);
      assert.equal(store.ttl('somekey'), -1);

      setTimeout(function () {
        assert.isNotNull(store.get('somekey'));
        done();
      }, 1001);
    });

    it('should return 0 if key does not exist', function () {
      assert.equal(store.persist('notexist'), 0);
    });
  });

  describe('expire()', function (done) {
    it('should expire when time is done', function (done) {
      assert.equal(store.expire('somekey', 1000), 1);

      setTimeout(function () {
        assert.isNotNull(store.get('somekey'));
        assert.isBelow(store.ttl('somekey'), 1000);
      }, 500);

      setTimeout(function () {
        assert.isNull(store.get('somekey'));
        done();
      }, 1001);
    });

    it('should return 0 if key does not exist', function () {
      assert.equal(store.expire('notexist'), 0);
    });
  });

  describe('key()', function () {
    it('should return same result with localStorage', function () {
      var arr1 = [], arr2 = [];
      assert.equal(localStorage.length, store.length + 1);

      for (var i = 0, j = 0; j < store.length; i++, j++) {
        if (localStorage.key(i) === 'locally-config')
          i++;

        arr1.push(localStorage.key(i));
        arr2.push(store.key(j));
      }

      assert.equal(arr1.length, arr2.length);

      arr1.sort();
      arr2.sort();

      for (var i = 0; i < arr1.length; i++) {
        assert.strictEqual(arr1[i], arr2[i]);
      }
    });
  });

  describe('not breaking current data', function () {
    it('should read current data', function () {
      var len = store.length;

      localStorage.setItem('outsideItem1', 'testItem1');
      localStorage.setItem('outsideItem2', 123);

      var store2 = new Store();

      // tests
      assert.strictEqual(store2.get('anykey'), 'anyvalue');
      assert.strictEqual(store2.get('outsideItem1'), 'testItem1');
      assert.strictEqual(store2.get('outsideItem2'), '123');
      assert.ok(store2.keys().indexOf('outsideItem2') > -1);
      assert.equal(len + 2, store2.length);
    });

    it('should be able to start from scratch', function () {
      localStorage.removeItem('locally-config');

      var store4 = new Store();

      assert.isAbove(store4.length, 0);
      assert.equal(store4.length, store.length);
    });

    it('shouldnt forget timeout when starting from scratch', function (done) {
      store.set('timeout', 'value', '1s');
      var store4 = new Store();

      assert.notEqual(store4.ttl('timeout'), -1);
      assert.notEqual(store4.ttl('timeout'), -2);
      assert.isAbove(store4.ttl('timeout'), 0);

      setTimeout(function () {
        assert.isNull(store4.get('timeout'));
        done();
      }, 1010);
    });

    it('should remove timed out values on startup', function (done) {
      var len = localStorage.length;

      store.set('timeout', 'value', '1s');

      setTimeout(function () {
        new Store();
        expectedLen(len);
        done();
      }, 1010);
    });

    it('shouldnt forget type when starting from scratch', function () {
      store.set('string', 'string');
      store.set('number', 123);
      store.set('function', function () {});
      store.set('object', { key: 'value' });
      store.set('date', new Date());
      store.set('regexp', new RegExp('.*'));

      var store4 = new Store();

      assert.typeOf(store4.get('string'), 'string');
      assert.typeOf(store4.get('number'), 'number');
      assert.typeOf(store4.get('function'), 'function');
      assert.typeOf(store4.get('object'), 'object');
      assert.typeOf(store4.get('date'), 'date');
      assert.typeOf(store4.get('regexp'), 'regexp');
    });
  });

  describe('clear()', function () {
    it('should remove all values', function () {
      store.clear();
      expectedLen(1);
    });
  });
}
