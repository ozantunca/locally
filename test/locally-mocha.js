
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

function expectedKeys (len) {
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
  describe('setting values', function() {
    it('should add one value to localStorage', function () {
      var len = localStorage.length;
      store.set('key', 'value');

      // tests
      expectedKeys(len + 1);
      assert.strictEqual(store.get('key'), 'value');
    });

    it('should overwrite a value', function () {
      var len = localStorage.length;
      store.set('key', 'different value');

      // tests
      expectedKeys(len);
      assert.strictEqual(store.get('key'), 'different value');
    });

    it('should add another value', function () {
      var len = localStorage.length;
      store.set('key2', 'some value');

      // tests
      expectedKeys(len + 1);
      assert.strictEqual(store.get('key2'), 'some value');
    });

    it('should cache a value', function (done) {
      var len = localStorage.length;
      store.set('key4', 'value', { ttl: 1000 });

      // tests
      expectedKeys(len + 1);
      assert.isNotNull(store.get('key4'));

      setTimeout(function () {
        assert.isNull(store.get('key4'));
        assert.lengthOf(localStorage, len);
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

      expectedKeys(len + 1);
      assert.isNotNull(store.get('key5'));

      setTimeout(function () {
        assert.isNull(store.get('key5'));
        expectedKeys(len);

        done();
      }, 2010);
    });

    it('should cache a value using ms(\'1m\')', function (done) {
      var len = localStorage.length;
      store.set('key5', 'value', '1m');

      expectedKeys(len + 1);
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

      expectedKeys(len + 1);
      assert.isNotNull(store.get('key6'));

      setTimeout(function () {
        assert.isBelow(store.ttl('key6'), 60 * 60 * 24 * 2 * 1000);

        done();
      }, 1000);
    });
  });

  describe('type checks', function () {
    it('should be able to add an object', function () {
      var len = localStorage.length;
      var obj = { 'some': 'object', 'number': 3, 'arr': [] };
      store.set('key3', obj);

      // tests
      expectedKeys(len + 1);
      assert.typeOf(store.get('key3'), 'object');
      assert.ok(deepCompare(store.get('key3'), obj));
    });

    it('should be able to save a function', function () {
      var len = localStorage.length;
      var fn = function () { return 'test function'; };
      store.set('fn1', fn);

      // tests
      expectedKeys(len + 1);
      assert.typeOf(store.get('fn1'), 'function');
      assert.equal(store.get('fn1')(), 'test function');
    });

    it('should be able to save a Date', function () {
      var len = localStorage.length;
      var date = new Date(2012, 10, 10);
      store.set('date1', date);

      // tests
      expectedKeys(len + 1);
      assert.typeOf(store.get('date1'), 'date');
      assert.ok(store.get('date1') instanceof Date);
      assert.equal(store.get('date1').getTime(), (new Date(2012, 10, 10).getTime()));
    });

    it('should be able to save a Number', function () {
      var len = localStorage.length;
      var num = 23014; // some random number
      store.set('num1', num);

      // tests
      expectedKeys(len + 1);
      assert.typeOf(store.get('num1'), 'number');
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

      var keys = store.keys(/.*key.*/);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 7);

      // when given string, locally should add .*
      // on both ends and query like that
      var keys = store.keys('key');
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 7);
    });
  });

  describe('scan()', function () {
    it('should iterate records that matches given key pattern', function () {
      var count = 0;

      store.scan('.*key.*', function (item) {
        count++;
        assert.isNotNull(item);
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

    it('should return string if second parameter is true', function () {
      store.set('somekey', 'somevalue', '2s');

      setTimeout(function () {
        assert.isBelow(store.ttl('somekey'), 2000);
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
      localStorage.setItem('outsideItem1', 'testItem1');
      localStorage.setItem('outsideItem2', 123);

      var store2 = new Store();

      // tests
      assert.strictEqual(store2.get('anykey'), 'anyvalue');
      assert.strictEqual(store2.get('outsideItem1'), 'testItem1');
      assert.ok(store2.keys().indexOf('outsideItem2') > -1);
    });
  });

  describe('clear()', function () {
    it('should remove all values', function () {
      store.clear();
      expectedKeys(1);
    });
  });
}
