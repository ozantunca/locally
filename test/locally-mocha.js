if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./storage');
}

var Store = require('../dist/locally')
  , store = new Store()
  , assert = require('chai').assert;


describe('locally', function() {

  describe('set()', function() {
    it('should add one value to localStorage', function () {
      store.set('key', 'value');
      assert.lengthOf(store._values, 1);
      assert.lengthOf(localStorage, 1);
    });

    it('should overwrite a value', function () {
      store.set('key', 'different value');
      assert.lengthOf(store._values, 1);
      assert.lengthOf(localStorage, 1);
    });

    it('should add another value', function () {
      store.set('key2', 'some value');
      assert.lengthOf(store._values, 2);
      assert.lengthOf(localStorage, 2);
    });

    it('should be able to add an object', function () {
      store.set('key3', { 'some': 'object', 'number': 3, 'arr': [] });
      assert.lengthOf(store._values, 3);
      assert.lengthOf(localStorage, 3);
      assert.typeOf(store.get('key3'), 'object');
    });

    it('should cache a value', function (done) {
      store.set('key4', 'value', 1000);
      assert.lengthOf(store._values, 4);
      assert.isNotNull(localStorage.getItem('key4'));

      setTimeout(function () {
        assert.lengthOf(store._values, 3);
        assert.isNull(localStorage.getItem('key4'));
        done();
      }, 1010);
    });
  });

  describe('get()', function() {
    it('should return a value', function () {
      var val = store.get('key');
      assert.isNotNull(val);
      assert.equal(val, 'value');
    });

    it('should return several values', function () {
      var vals = store.get(['key', 'key2', 'key3']);
      assert.lengthOf(vals, 3);
      assert.deepEqual(vals, ['different value', 'some value', { 'some': 'object', 'number': 3, 'arr': [] }]);
    });
  });

  describe('keys()', function() {
    it('should return all keys', function () {
      var keys = store.keys();
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 3);

      for (var i in keys) {
        assert.typeOf(keys[i], 'string');
        assert.isNotNull(store.get(keys[i]));
      }
    });

    it('should return queried keys', function () {
      store.set('anykey', 'anyvalue');
      store.set('anykey2', 'anyvalue2');

      var keys = store.keys('key*');
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 3);

      var keys = store.keys('*key*');
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, 5);
    });
  });

  describe('remove()', function() {
    it('should delete record of given key', function () {
      var len = store._keys.length;
      store.remove('key');
      assert.equal(len - 1, store._keys.length);
    });

    it('should be able to delete several keys', function () {
      var len = store._keys.length;
      store.remove(['key2', 'key3']);
      assert.equal(len - 2, store._keys.length);
    });
  });

  describe('scan()', function () {
    it('should iterate records that matches given key pattern', function () {
      store.scan('key*', function (item) {
        assert.property(item, 'value');
        assert.property(item, 'ttl');
      });
    });
  });

  describe('ttl()', function () {
    it('should return time to live for a key', function (done) {
      store.set('somekey', 'somevalue', 2000);

      var ttl = store.ttl('somekey');
      assert.isAbove(0, ttl);

      setTimeout(function () {
        assert.isBelow(2000, ttl);
        done();
      }, 5);
    });

    it('should return -1 if key does not exist', function () {
      assert.equal(store.ttl('notexist'), -1);
    });
  });

  describe('persist()', function () {
    it('should persist value of a key', function (done) {
      store.persist('somekey');

      setTimeout(function () {
        assert.isNotNull(store.get('someKey'));
        done();
      }, 2000);
    });
  });

  describe('expire()', function (done) {
    it('should expire when time is done', function (done) {
      store.expire('somekey', 1000);

      setTimeout(function () {
        assert.isNotNull(store.get('somekey'));
      }, 500);

      setTimeout(function () {
        assert.isNull(store.get('somekey'));
        done();
      }, 1001);
    });
  });

});
