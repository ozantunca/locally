Locally
============
[![npm version](https://badge.fury.io/js/locallyjs.svg)](https://www.npmjs.org/package/locallyjs)
[![Travis](https://travis-ci.org/ozantunca/locally.svg?branch=master)](https://travis-ci.org/ozantunca/locally)

Locally is a localStorage manager that supports expirable items with timeout values and saves space by compressing them using LZW algorithm. W3C specification suggest 5MB of quota for every origin. Even though it's not a must, browsers tend to stay around that number thus giving our site an exhaustible storage in the long run. Locally's TTL support will take care of that. 
Locally works much like a caching software (e.g. Redis). Try the <a href="http://demo.ozantunca.org/locally/" target="_blank">demo</a>.

### Features
- [Defining timeout for values to ensure some values will expire in time.](#user-content-timeout-support)
- Type checking store and return ```Number```, ```String```, ```Boolean```, ```Array```, ```Object```, ```Date```, ```RegExp``` and ```Function``` values in their given forms.
- A much simpler API than originial localStorage while keeping all it's functions intact.
- [Compression via LZW algorithm.](#user-content-compression)


Locally is installable via 

- [npm](http://bower.io/): `npm install locallyjs`
- [bower](http://bower.io/): `bower install locallyjs`

### Quick Examples
```javascript
store.set('example', {
  property1: 'value1',
  property2: 'value2'
});

store.get('example'); // { property1: "value1", property2: "value2" }

store.expire('example', 1000);

setTimeout(function () {
  store.get('example') // null
}, 1001);
```

### Functions and Properties

- [.set(key, value[, options])](#setkey-value-options)
- [.get(key)](#getkey)
- [.remove(key)](#removekey)
- [.clear()](#clear)
- [.ttl(key[, returnString])](#ttlkey-returnstring)
- [.persist(key)](#persistkey)
- [.expire(key, timeout)](#expirekey-timeout)
- [.keys([keyPattern])](#keyskeypattern)
- [.scan(keyPattern, function)](#scankeypattern-function)
- [.length](#length)

### Usage
#### [Demo](http://demo.ozantunca.org/locally/)

#### Initialization
Basic initialization with window global is:
```js
var Store = window.Locally.Store
  , store = new Store();
```
or if you are already using **browserify**
```js
var Store = require('locally').Store
  , store = new Store();
```
If **compression** for all values is wanted to be done as default, Locally can be initialized to indicate that.
```js
var store = new Store({ compress: true });
```
Locally will compress all current and and upcoming values. If you have compressed values but want to decompress them all and continue uncompressed, Locally will perform decompression on all currently compressed values once it's initialized as:
```js 
var store = new Store();
```

#### .set(key, value[, options])
Assigns a ```value``` to given ```key```. ```key``` is a ```string```. Basic usage is as follows:
```js
store.set('key', 'value');
```
Value can be anything. If it's a ```String```,
```Number```, ```Boolean```, ```Array```, ```Object```, ```Date```, ```RegExp``` or ```Function```, ```.get()``` will return the value in it's correct type instead of a string.
```js
store.set('key', new Date());

store.get('key') instanceof Date; // true
```

##### Timeout support
Time To Live (TTL) values can be given to keys so that defined values will be removed after given milliseconds. TTL can be included in ```options``` parameter;
```js
store.set('key', 'value', {
  ttl: 1000
}); // TTL is 1000 milliseconds
```
or can be given as the third parameter as a shorthand;
```js
store.set('key', 'value', 1000);
```
You can also specify TTL with string thanks to [ms.js](https://github.com/rauchg/ms.js).
```js
store.set('key', 'value', '5s');
store.set('key', 'value', '2m');
store.set('key', 'value', '1 hour');
```
##### Compression
You can tell **.set()** to compress given value.
```js
store.set('key', 'value to be compressed', { compress: true });

store.get('key'); // 'value to be compressed'
store.get('key').length; // 22
localStorage.getItem('key').length; // < 22
```
#### .get(key)
Returns the corresponding value of given key.
```js
store.set('key', 'value');

store.get('key'); // "value"
store.get('nokey'); // null
```
**.get()** can have it's first parameter as an array. In which case **.get()** will return an array of values assigned to given array of keys.
```js
store.set('key1', 'value1');
store.set('key2', 'value2');
store.set('key3', 'value3');

store.get(['key1', 'key2', 'key3']); // ["value1", "value2", "value3"]
```
#### .remove(key)
```.remove()``` removes a value from localStorage using given key.
```js
store.set('key', 'value');

store.remove('key');

store.get('key'); // null
```
**.remove()** can have it's first parameter as an array. In which case **.remove()** will remove an array of values assigned to given array of keys.
```js
store.set('key1', 'value1');
store.set('key2', 'value2');
store.set('key3', 'value3');

store.remove(['key1', 'key2', 'key3']);
store.get(['key1', 'key2', 'key3']); // []
```
#### .clear()
It will wipe out all values from localStorage.
```js
store.clear();
```
#### .key(index)
Returns key at the given index. Similar to same function of native **localStorage**.
```js
store.key(0); // "key"
```
#### .ttl(key[, returnString])
Returns timeout for given key. If second parameter is ```true ``` **.ttl()** will return a logical reply using **ms** module.
```js
store.set('key', 'value', 1000);

store.ttl('key'); // <= 1000
store.ttl('key', true); // '1s'
```
It will return ```-1``` if the value has no TTL and persists or ```-2``` if there is no value associated with the key.
```js
store.ttl('key')
```
#### .persist(key)
Remove timeout of given key, making the value non-expiring.
```js
store.set('key', 'value', 1000);

store.persist('key');

store.ttl('key'); // null
```
#### .expire(key, timeout)
Adds timeout to key, making it expiring if it wasn't, or updating it's timeout value.
```js
store.set('key', 'value');
store.expire('key', 1000);

setTimeout(function () {
  store.get('key'); // null
}, 1001);
```
#### .keys([keyPattern])
Queries given string among **keys** and returns the one that includes that string.
```js
store.set('key1', 'value1');
store.set('key2', 'value2');
store.set('somekey1', 'somevalue1');
store.set('somekey2', 'somevalue2');
store.set('something different', 'different value');

store.keys('key'); // ["key1", "key2", "somekey1", "somekey2"]
```
**keyPattern** can also be a **RegExp**, in which case that **RegExp** will be used when querying.
```js
store.set('key1', 'value1');
store.set('key2', 'value2');
store.set('somekey1', 'somevalue1');
store.set('somekey2', 'somevalue2');
store.set('something different', 'different value');

store.keys(/^key.*/); // ["key1", "key2"]
```
**.keys()** will return all values if **keyPattern** is not present or is ```*```.
```js
store.set('key1', 'value1');
store.set('key2', 'value2');
store.set('somekey1', 'somevalue1');
store.set('somekey2', 'somevalue2');
store.set('something different', 'different value');

store.keys(); // ["key1", "key2", "somekey1", "somekey2", "something different"]
store.keys('*'); // ["key1", "key2", "somekey1", "somekey2", "something different"]
```

#### .scan(keyPattern, function)
Queries using **keyPattern** and runs **function** for values associated with keys matching **keyPattern**. **keyPattern** can be ```String``` or ```RegExp```.
```js
store.set('key1', 'value1');
store.set('key2', 'value2');

store.scan(/key/, function (value, key) {
  console.log(key, ' : ', value);
});
```

#### .length
Similar to ```length``` property of native localStorage, **.length** is an integer that represents number of keys Locally is holding at anytime.
```js
store.length; // 0

store.set('key1', 'value1');
store.set('key2', 'value2');

store.length; // 2
```

#### Compression
**Locally** by default does not compress values unless it's told to do otherwise. It can be configured to compress all values by giving parameter on initialization, or an extra parameter can be given to **.set()** so that **.set()** will compress that only that value.

### How Locally Works
Locally holds an extra object in localStorage called ```locally-config``` to save TTL and type information. It automatically updates config on page load using current values in localStorage to make sure it doesn't miss any value added to localStorage without using Locally.

### Testing
If you want to run unit tests yourself run command below after installing **Locally**.
```sh
cd node_modules/locallyjs
npm install
npm test
open test/browser.html
```
This will run tests on all distributables. Last command will **open** default web browser and run mocha tests on the browser.
