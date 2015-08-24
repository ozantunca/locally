Locally
============
[![NPM Version](http://img.shields.io/npm/v/locally.svg?style=flat)](https://www.npmjs.org/package/dispatcherjs)
[![Travis](https://img.shields.io/travis/ozantunca/locally.svg?style=flat)](https://travis-ci.org/ozantunca/DispatcherJS)

Locally is a localStorage manager that supports expirable values with TTL and compresses them using LZW.
W3C specification suggest 5MB of quota for every origin. Even though it's not a must, browsers tend to stay around that number thus giving our site that is exhaustible in the long run. Locally's TTL support will take care of that. 
Locally works much like a caching software (e.g. Redis) 

# Features
- Defining TTL for values to ensure some values will expire in time.
- Type checking store and return <code>Number</code>, <code>String</code>, <code>Array</code>, <code>Object</code>, <code>Date</code>, <code>RegExp</code> and <code>Function</code> values in their given forms.
- Compression via LZW algorithm.
- A much simpler API than originial localStorage while keeping all it's functions intact.
