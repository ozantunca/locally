interface TestVars {
  assert: typeof import('chai').assert;
  localStorage: Storage;
  Store: new (options?: object) => {
    set(key: string, value: unknown, options?: unknown): void;
    get(key: string | string[]): unknown;
    keys(pattern?: string | RegExp): string[];
    remove(key: string | string[]): void;
    scan(key: string | RegExp, fn: (value: unknown, key: string) => void): void;
    ttl(key: string, returnString?: boolean): number | string;
    persist(key: string): boolean;
    expire(key: string, ttl: number): boolean;
    clear(): boolean;
    key(index: number): string | undefined;
    length: number;
  };
  testMode: string;
}

declare let assert: typeof import('chai').assert;
declare let store: InstanceType<TestVars['Store']>;
declare let Store: TestVars['Store'];
declare let testMode: string;

if (typeof exports === 'object') {
  const mod = module as unknown as {
    exports: (vars: TestVars) => void;
    _assert?: typeof import('chai').assert;
    _localStorage?: Storage;
    _store?: InstanceType<TestVars['Store']>;
    _Store?: TestVars['Store'];
    _testMode?: string;
  };

  mod.exports = function (vars: TestVars) {
    (global as unknown as { __assert: typeof import('chai').assert }).__assert = vars.assert;
    (global as unknown as { __localStorage: Storage }).__localStorage = vars.localStorage;
    (global as unknown as { __Store: TestVars['Store'] }).__Store = vars.Store;
    (global as unknown as { __store: InstanceType<TestVars['Store']> }).__store = new vars.Store();
    (global as unknown as { __testMode: string }).__testMode = vars.testMode;
    runTests();
  };
} else {
  runTests();
}

function expectedLen(len: number) {
  const v = getTestVars();
  v.assert.lengthOf(v.localStorage, len);
  v.assert.lengthOf(v.store, len - 1);
}

function getTestVars(): TestVars & { store: InstanceType<TestVars['Store']> } {
  if (typeof exports === 'object') {
    const g = global as unknown as {
      __assert?: typeof import('chai').assert;
      __localStorage?: Storage;
      __store?: InstanceType<TestVars['Store']>;
      __Store?: TestVars['Store'];
      __testMode?: string;
    };
    return {
      assert: g.__assert!,
      localStorage: g.__localStorage!,
      store: g.__store!,
      Store: g.__Store!,
      testMode: g.__testMode!
    };
  }
  const w = typeof window !== 'undefined' ? window as unknown as {
    assert?: typeof import('chai').assert;
    localStorage?: Storage;
    store?: InstanceType<TestVars['Store']>;
    Store?: TestVars['Store'];
    testMode?: string;
  } : {};
  return {
    assert: w.assert!,
    localStorage: w.localStorage!,
    store: w.store!,
    Store: w.Store!,
    testMode: w.testMode || 'distmin'
  };
}

function deepCompare(...args: unknown[]): boolean {
  let i: number, l: number;
  let leftChain: unknown[] = [];
  let rightChain: unknown[] = [];

  function compare2Objects(x: unknown, y: unknown): boolean {
    let p: string;

    if (isNaN(x as number) && isNaN(y as number) && typeof x === 'number' && typeof y === 'number') {
      return true;
    }

    if (x === y) return true;

    if (
      (typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)
    ) {
      return x!.toString() === y!.toString();
    }

    if (!(x instanceof Object && y instanceof Object)) return false;

    if (
      (x as object).constructor !== (y as object).constructor ||
      Object.getPrototypeOf(x) !== Object.getPrototypeOf(y)
    ) {
      return false;
    }

    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) return false;

    for (p in y as Record<string, unknown>) {
      if (
        (y as Record<string, unknown>).hasOwnProperty(p) !==
        (x as Record<string, unknown>).hasOwnProperty(p)
      ) {
        return false;
      } else if (
        typeof (y as Record<string, unknown>)[p] !==
        typeof (x as Record<string, unknown>)[p]
      ) {
        return false;
      }
    }

    for (p in x as Record<string, unknown>) {
      if (
        (y as Record<string, unknown>).hasOwnProperty(p) !==
        (x as Record<string, unknown>).hasOwnProperty(p)
      ) {
        return false;
      } else if (
        typeof (y as Record<string, unknown>)[p] !==
        typeof (x as Record<string, unknown>)[p]
      ) {
        return false;
      }

      switch (typeof (x as Record<string, unknown>)[p]) {
        case 'object':
        case 'function':
          leftChain.push(x);
          rightChain.push(y);
          if (
            !compare2Objects(
              (x as Record<string, unknown>)[p],
              (y as Record<string, unknown>)[p]
            )
          ) {
            return false;
          }
          leftChain.pop();
          rightChain.pop();
          break;
        default:
          if ((x as Record<string, unknown>)[p] !== (y as Record<string, unknown>)[p]) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  if (arguments.length < 1) return true;

  for (i = 1, l = arguments.length; i < l; i++) {
    leftChain = [];
    rightChain = [];
    if (!compare2Objects(arguments[0], arguments[i])) return false;
  }
  return true;
}

function runTests() {
  const vars = getTestVars();
  const { assert: a, localStorage: ls, Store: S, testMode: tm } = vars;
  let store = vars.store;
  const assert: typeof import('chai').assert = a;
  const localStorage = ls;
  const Store = S;
  const testMode = tm;
  let lenOfKeys = 0;

  describe('setting values', function set() {
    it('should add one value to localStorage', function () {
      const len = localStorage.length;
      store.set('key', 'value');
      lenOfKeys++;

      expectedLen(len + 1);
      assert.strictEqual(store.get('key'), 'value');
    });

    it('should overwrite a value', function () {
      const len = localStorage.length;
      store.set('key', 'different value');

      expectedLen(len);
      assert.strictEqual(store.get('key'), 'different value');
    });

    it('should add another value', function () {
      const len = localStorage.length;
      store.set('key2', 'some value');
      lenOfKeys++;

      expectedLen(len + 1);
      assert.strictEqual(store.get('key2'), 'some value');
    });

    it('should cache a value with options object', function (done) {
      const len = localStorage.length;

      store.set('key4', 'value', { ttl: 1000 });
      lenOfKeys++;

      expectedLen(len + 1);
      assert.isNotNull(store.get('key4'));

      setTimeout(function () {
        expectedLen(len);
        assert.isNull(store.get('key4'));
        lenOfKeys--;
        done();
      }, 1010);
    });

    if (testMode !== 'light') {
      it('should cache a value with options object when ttl is string', function (done) {
        const len = localStorage.length;

        store.set('key4', 'value', { ttl: '1s' });
        lenOfKeys++;

        expectedLen(len + 1);
        assert.isNotNull(store.get('key4'));

        setTimeout(function () {
          expectedLen(len);
          assert.isNull(store.get('key4'));
          lenOfKeys--;
          done();
        }, 1010);
      });
    }

    it('should overwrite timeout if new value is set', function () {
      store.set('overwrite', 'somevalue', 1000);
      store.set('overwrite', 'some other value');

      assert.equal(store.ttl('overwrite'), -1);
    });

    if (testMode !== 'light') {
      it('should cache a value using ms(\'2s\')', function (done) {
        (this as { timeout: (n: number) => void }).timeout(3000);

        const len = localStorage.length;
        store.set('key5', 'value', '2s');
        lenOfKeys++;

        expectedLen(len + 1);
        assert.isNotNull(store.get('key5'));

        setTimeout(function () {
          assert.isNull(store.get('key5'));
          expectedLen(len);
          lenOfKeys--;
          done();
        }, 2010);
      });

      it('should cache a value using ms(\'1m\')', function (done) {
        const len = localStorage.length;
        store.set('key5', 'value', '1m');
        lenOfKeys++;

        expectedLen(len + 1);
        assert.isNotNull(store.get('key5'));

        setTimeout(function () {
          assert.isNotNull(store.get('key5'));
          assert.isBelow(store.ttl('key5') as number, 60000);
          assert.isAbove(store.ttl('key5') as number, 59000);
          done();
        }, 500);
      });

      it('should cache a value using ms(\'2 days\')', function (done) {
        const len = localStorage.length;
        store.set('key6', 'value', '2 days');
        lenOfKeys++;

        expectedLen(len + 1);
        assert.isNotNull(store.get('key6'));

        setTimeout(function () {
          assert.isBelow(
            store.ttl('key6') as number,
            60 * 60 * 24 * 2 * 1000
          );
          done();
        }, 1000);
      });
    }

    it('should be able to store falsy values', function () {
      store.set('falsy1', null);
      store.set('falsy2', undefined);
      store.set('falsy3', false);
      store.set('falsy4', '');
      store.set('falsy5', 0);
      store.set('falsy6', NaN);

      assert.isNull(store.get('falsy1'));
      assert.isUndefined(store.get('falsy2'));
      assert.strictEqual(store.get('falsy3'), false);
      assert.strictEqual(store.get('falsy4'), '');
      assert.strictEqual(store.get('falsy5'), 0);
      assert.ok(isNaN(store.get('falsy6') as number));

      store.remove('falsy1');
      store.remove('falsy6');
    });
  });

  if (testMode !== 'light') {
    describe('compression', function compression() {
      it('should compress given value', function () {
        store.set('compress1', 'tobecompressed', { compress: true });

        assert.isBelow(
          localStorage.getItem('compress1')!.length,
          'tobecompressed'.length
        );
        assert.equal(store.get('compress1'), 'tobecompressed');
      });

      it('should compress all', function () {
        const store3 = new Store({ compress: true });

        store3.set('shouldbecompressed', 'tobecompressed');
        store3.set('shouldbecompressed2', 'tobecompressed');

        assert.isBelow(
          localStorage.getItem('shouldbecompressed')!.length,
          'tobecompressed'.length
        );
        assert.equal(store.get('shouldbecompressed'), 'tobecompressed');

        assert.isBelow(
          localStorage.getItem('shouldbecompressed')!.length,
          'tobecompressed'.length
        );
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
  }

  describe('type checks', function () {
    it('should be able to add an object', function () {
      const len = localStorage.length;
      const obj = { some: 'object', number: 3, arr: [] as unknown[] };
      store.set('key3', obj);
      lenOfKeys++;

      expectedLen(len + 1);
      assert.typeOf(store.get('key3'), 'object');
      assert.ok(deepCompare(store.get('key3'), obj));
    });

    it('should be able to save a function', function () {
      const len = localStorage.length;
      const fn = function () {
        return 'test function';
      };
      store.set('fn1', fn);

      expectedLen(len + 1);
      assert.typeOf(store.get('fn1'), 'function');
      assert.equal((store.get('fn1') as () => string)(), 'test function');
    });

    it('should be able to save a Date', function () {
      const len = localStorage.length;
      const date = new Date(2012, 10, 10);
      store.set('date1', date);

      expectedLen(len + 1);
      assert.typeOf(store.get('date1'), 'date');
      assert.ok(store.get('date1') instanceof Date);
      assert.equal(
        (store.get('date1') as Date).getTime(),
        new Date(2012, 10, 10).getTime()
      );
    });

    it('should be able to save a Number', function () {
      const len = localStorage.length;
      const num = Math.random();
      store.set('num1', num);

      expectedLen(len + 1);
      assert.typeOf(store.get('num1'), 'number');
    });

    it('should be able to save a Boolean', function () {
      const len = localStorage.length;
      const bool1 = false,
        bool2 = true;
      store.set('bool1', bool1);
      store.set('bool2', bool2);

      expectedLen(len + 2);

      assert.typeOf(store.get('bool1'), 'boolean');
      assert.strictEqual(store.get('bool1'), bool1);

      assert.typeOf(store.get('bool2'), 'boolean');
      assert.strictEqual(store.get('bool2'), bool2);
    });
  });

  describe('get()', function () {
    it('should return a value', function () {
      assert.strictEqual(store.get('key'), 'different value');
    });

    it('should return several values', function () {
      const vals = store.get(['key', 'key2', 'key3']) as unknown[];

      assert.lengthOf(vals, 3);
      assert.deepEqual(vals, [
        'different value',
        'some value',
        { some: 'object', number: 3, arr: [] }
      ]);
    });
  });

  describe('keys()', function () {
    it('should return all keys', function () {
      const len = localStorage.length - 1;
      let keys = store.keys();

      assert.equal(keys.length, store.length);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, len);

      for (const i in keys) {
        assert.typeOf(keys[i], 'string');
        assert.isNotNull(store.get(keys[i]));
      }

      keys.splice(0, 1);
      (keys as unknown[])[0] = null;

      keys = store.keys();
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, len);

      for (const i in keys) {
        assert.typeOf(keys[i], 'string');
        assert.isNotNull(store.get(keys[i]));
      }
    });

    it('should return queried keys', function () {
      store.set('anykey', 'anyvalue');
      store.set('anykey2', 'anyvalue2');

      let keys = store.keys(/^key.*/);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, lenOfKeys);

      keys.forEach(function (k) {
        assert.equal(k.indexOf('key'), 0);
      });

      keys = store.keys(/.*key.*/);
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, lenOfKeys + 2);

      keys.forEach(function (k) {
        assert.isAbove(k.indexOf('key'), -1);
      });

      keys = store.keys('key');
      assert.typeOf(keys, 'array');
      assert.lengthOf(keys, lenOfKeys + 2);

      keys.forEach(function (k) {
        assert.isAbove(k.indexOf('key'), -1);
      });
    });
  });

  describe('scan()', function () {
    it('should iterate records that matches given key pattern', function () {
      let count = 0;

      store.scan('.*key.*', function (value, key) {
        count++;
        assert.isNotNull(value);
        assert.isNotNull(key);
        assert.deepEqual(store.get(key), value);
      });

      assert.equal(count, lenOfKeys + 2);
    });
  });

  describe('remove()', function () {
    it('should delete record of given key', function () {
      const len = localStorage.length;
      store.remove('key');
      assert.equal(len - 1, localStorage.length);
    });

    it('should be able to delete several keys', function () {
      const len = localStorage.length;
      store.remove(['key2', 'key3']);
      assert.equal(len - 2, localStorage.length);
    });
  });

  describe('ttl()', function () {
    it('should return time to live for a key', function (done) {
      store.set('somekey', 'somevalue', 1000);

      assert.isAbove(store.ttl('somekey') as number, 0);

      setTimeout(function () {
        assert.isBelow(store.ttl('somekey') as number, 1000);
      }, 5);

      setTimeout(function () {
        assert.isNull(store.get('somekey'));
        assert.equal(store.ttl('notexist'), -2);
        done();
      }, 1001);
    });

    it('should return string if second parameter is true', function (done) {
      store.set('somekey', 'somevalue', '2s');

      assert.isAbove(store.ttl('somekey') as number, 0);

      if (testMode !== 'light') {
        assert.equal(store.ttl('somekey', true), '2s');
      }

      setTimeout(function () {
        assert.isBelow(store.ttl('somekey') as number, 2000);
        done();
      }, 5);
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

      assert.ok(store.persist('somekey'));
      assert.equal(store.ttl('somekey'), -1);

      setTimeout(function () {
        assert.isNotNull(store.get('somekey'));
        done();
      }, 1001);
    });

    it('should return false if key does not exist', function () {
      assert.isFalse(store.persist('notexist'));
    });
  });

  describe('expire()', function () {
    it('should expire when time is done', function (done) {
      assert.ok(store.expire('somekey', 1000));

      setTimeout(function () {
        assert.isNotNull(store.get('somekey'));
        assert.isBelow(store.ttl('somekey') as number, 1000);
      }, 500);

      setTimeout(function () {
        assert.isNull(store.get('somekey'));
        done();
      }, 1001);
    });

    it('should return false if key does not exist', function () {
      assert.isFalse(store.expire('notexist', 1000));
    });
  });

  describe('key()', function () {
    it('should return same result with localStorage', function () {
      const arr1: string[] = [];
      const arr2: string[] = [];
      assert.equal(localStorage.length, store.length + 1);

      for (let i = 0, j = 0; j < store.length; i++, j++) {
        if (localStorage.key(i) === 'locally-config') i++;

        arr1.push(localStorage.key(i)!);
        arr2.push(store.key(j)!);
      }

      assert.equal(arr1.length, arr2.length);

      arr1.sort();
      arr2.sort();

      for (let i = 0; i < arr1.length; i++) {
        assert.strictEqual(arr1[i], arr2[i]);
      }
    });
  });

  describe('not breaking current data', function () {
    it('should read current data', function () {
      const len = store.length;

      localStorage.setItem('outsideItem1', 'testItem1');
      localStorage.setItem('outsideItem2', '123');

      const store2 = new Store();

      assert.strictEqual(store2.get('anykey'), 'anyvalue');
      assert.strictEqual(store2.get('outsideItem1'), 'testItem1');
      assert.strictEqual(store2.get('outsideItem2'), '123');
      assert.ok(store2.keys().indexOf('outsideItem2') > -1);
      assert.equal(len + 2, store2.length);
    });

    it('should be able to start from scratch', function () {
      localStorage.removeItem('locally-config');

      const store4 = new Store();

      assert.isAbove(store4.length, 0);
      assert.equal(store4.length, store.length);
    });

    it('shouldnt forget timeout when starting from scratch', function (done) {
      store.set('timeout', 'value', 1000);
      const store4 = new Store();

      assert.notEqual(store4.ttl('timeout'), -1);
      assert.notEqual(store4.ttl('timeout'), -2);
      assert.isAbove(store4.ttl('timeout') as number, 0);

      setTimeout(function () {
        assert.isNull(store4.get('timeout'));
        done();
      }, 1010);
    });

    it('should remove timed out values on startup', function (done) {
      const len = localStorage.length;

      store.set('timeout', 'value', 1000);

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

      const store4 = new Store();

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
