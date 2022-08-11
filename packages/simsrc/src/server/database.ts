/*export class DataLoader<K, V, C = K> {

  constructor(batchLoadFn: DataLoader.BatchLoadFn<K, V>, options?: DataLoader.Options<K, V, C>);
  load(key: K): Promise<V>;
  loadMany(keys: ArrayLike<K>): Promise<Array<V | Error>>;
  clear(key: K): this;
  clearAll(): this;
  prime(key: K, value: V | Error): this;
}

declare namespace DataLoader {
  export type CacheMap<K, V> = {
    get(key: K): V | void;
    set(key: K, value: V): any;
    delete(key: K): any;
    clear(): any;
  }
  export type BatchLoadFn<K, V> =
    (keys: ReadonlyArray<K>) => PromiseLike<ArrayLike<V | Error>>;
  export type Options<K, V, C = K> = {
    batch?: boolean,
    maxBatchSize?: number;
    batchScheduleFn?: (callback: () => void) => void;
    cache?: boolean,
    cacheKeyFn?: (key: K) => C,
    cacheMap?: CacheMap<C, Promise<V>> | null;
  }
}
export type BatchLoadFn<K, V> =
  (keys: ReadOnlyArray<K>) => Promise<ReadOnlyArray<V | Error>>;

export type Options<K, V, C = K> = {
  batch?: boolean;
  maxBatchSize?: number;
  batchScheduleFn?: (callback: () => void) => void;
  cache?: boolean;
  cacheKeyFn?: (key: K) => C;
  cacheMap?: CacheMap<C, Promise<V>> | null;
};

export type CacheMap<K, V> = {
  get(key: K): V | void;
  set(key: K, value: V): any;
  delete(key: K): any;
  clear(): any;
};
export class DataLoader<K, V, C = K> {
  constructor(
    batchLoadFn: BatchLoadFn<K, V>,
    options?: Options<K, V, C>
  ) {
    if (typeof batchLoadFn !== 'function') {
      throw new TypeError(
        'DataLoader must be constructed with a function which accepts ' +
        `Array<key> and returns Promise<Array<value>>, but got: ${batchLoadFn}.`
      );
    }
    this._batchLoadFn = batchLoadFn;
    this._maxBatchSize = getValidMaxBatchSize(options);
    this._batchScheduleFn = getValidBatchScheduleFn(options);
    this._cacheKeyFn = getValidCacheKeyFn(options);
    this._cacheMap = getValidCacheMap(options);
    this._batch = null;
  }

  // Private
  _batchLoadFn: BatchLoadFn<K, V>;
  _maxBatchSize: number;
  _batchScheduleFn: (() => void) => void;
  _cacheKeyFn: K => C;
  _cacheMap: CacheMap<C, Promise<V>> | null;
  _batch: Batch<K, V> | null;

  load(key: K): Promise<V> {
    if (key === null || key === undefined) {
      throw new TypeError(
        'The loader.load() function must be called with a value, ' +
        `but got: ${String(key)}.`
      );
    }

    var batch = getCurrentBatch(this);
    var cacheMap = this._cacheMap;
    var cacheKey = this._cacheKeyFn(key);

    // If caching and there is a cache-hit, return cached Promise.
    if (cacheMap) {
      var cachedPromise = cacheMap.get(cacheKey);
      if (cachedPromise) {
        var cacheHits = batch.cacheHits || (batch.cacheHits = []);
        return new Promise(resolve => {
          cacheHits.push(() => {
            resolve(cachedPromise);
          });
        });
      }
    }
    batch.keys.push(key);
    var promise = new Promise((resolve, reject) => {
      batch.callbacks.push({ resolve, reject });
    });
    if (cacheMap) {
      cacheMap.set(cacheKey, promise);
    }

    return promise;
  }
  loadMany(keys: ReadOnlyArray<K>): Promise<Array<V | Error>> {
    if (!isArrayLike(keys)) {
      throw new TypeError(
        'The loader.loadMany() function must be called with Array<key> ' +
        `but got: ${(keys: any)}.`
      );
    }
    // Support ArrayLike by using only minimal property access
    const loadPromises = [];
    for (let i = 0; i < keys.length; i++) {
      loadPromises.push(this.load(keys[i]).catch(error => error));
    }
    return Promise.all(loadPromises);
  }
  clear(key: K): this {
    var cacheMap = this._cacheMap;
    if (cacheMap) {
      var cacheKey = this._cacheKeyFn(key);
      cacheMap.delete(cacheKey);
    }
    return this;
  }
  clearAll(): this {
    var cacheMap = this._cacheMap;
    if (cacheMap) {
      cacheMap.clear();
    }
    return this;
  }
  prime(key: K, value: V | Error): this {
    var cacheMap = this._cacheMap;
    if (cacheMap) {
      var cacheKey = this._cacheKeyFn(key);

      // Only add the key if it does not already exist.
      if (cacheMap.get(cacheKey) === undefined) {
        // Cache a rejected promise if the value is an Error, in order to match
        // the behavior of load(key).
        var promise;
        if (value instanceof Error) {
          promise = Promise.reject(value);
          // Since this is a case where an Error is intentionally being primed
          // for a given key, we want to disable unhandled promise rejection.
          promise.catch(() => {});
        } else {
          promise = Promise.resolve(value);
        }
        cacheMap.set(cacheKey, promise);
      }
    }
    return this;
  }
}
var enqueuePostPromiseJob =
  typeof process === 'object' && typeof process.nextTick === 'function' ?
    function (fn) {
      if (!resolvedPromise) {
        resolvedPromise = Promise.resolve();
      }
      resolvedPromise.then(() => {
        process.nextTick(fn);
      });
    } :
    setImmediate || setTimeout;

var resolvedPromise;

type Batch<K, V> = {
  hasDispatched: boolean,
  keys: Array<K>,
  callbacks: Array<{
    resolve: (value: V) => void;
    reject: (error: Error) => void;
  }>,
  cacheHits?: Array<() => void>
}

function getCurrentBatch<K, V>(loader: DataLoader<K, V, any>): Batch<K, V> {

  var existingBatch = loader._batch;
  if (
    existingBatch !== null &&
    !existingBatch.hasDispatched &&
    existingBatch.keys.length < loader._maxBatchSize &&
    (!existingBatch.cacheHits ||
      existingBatch.cacheHits.length < loader._maxBatchSize)
  ) {
    return existingBatch;
  }

  var newBatch = { hasDispatched: false, keys: [], callbacks: [] };

  loader._batch = newBatch;

  loader._batchScheduleFn(() => {
    dispatchBatch(loader, newBatch);
  });

  return newBatch;
}

function dispatchBatch<K, V>(
  loader: DataLoader<K, V, any>,
  batch: Batch<K, V>
) {
  batch.hasDispatched = true;

  if (batch.keys.length === 0) {
    resolveCacheHits(batch);
    return;
  }

  var batchPromise = loader._batchLoadFn(batch.keys);

  if (!batchPromise || typeof batchPromise.then !== 'function') {
    return failedDispatch(loader, batch, new TypeError(
      'DataLoader must be constructed with a function which accepts ' +
      'Array<key> and returns Promise<Array<value>>, but the function did ' +
      `not return a Promise: ${String(batchPromise)}.`
    ));
  }

  batchPromise.then(values => {

    if (!isArrayLike(values)) {
      throw new TypeError(
        'DataLoader must be constructed with a function which accepts ' +
        'Array<key> and returns Promise<Array<value>>, but the function did ' +
        `not return a Promise of an Array: ${String(values)}.`
      );
    }
    if (values.length !== batch.keys.length) {
      throw new TypeError(
        'DataLoader must be constructed with a function which accepts ' +
        'Array<key> and returns Promise<Array<value>>, but the function did ' +
        'not return a Promise of an Array of the same length as the Array ' +
        'of keys.' +
        `\n\nKeys:\n${String(batch.keys)}` +
        `\n\nValues:\n${String(values)}`
      );
    }

    resolveCacheHits(batch);

    // Step through values, resolving or rejecting each Promise in the batch.
    for (var i = 0; i < batch.callbacks.length; i++) {
      var value = values[i];
      if (value instanceof Error) {
        batch.callbacks[i].reject(value);
      } else {
        batch.callbacks[i].resolve(value);
      }
    }
  }).catch(error => {
    failedDispatch(loader, batch, error);
  });
}

function failedDispatch<K, V>(
  loader: DataLoader<K, V, any>,
  batch: Batch<K, V>,
  error: Error
) {
  resolveCacheHits(batch);
  for (var i = 0; i < batch.keys.length; i++) {
    loader.clear(batch.keys[i]);
    batch.callbacks[i].reject(error);
  }
}
function resolveCacheHits(batch: Batch<any, any>) {
  if (batch.cacheHits) {
    for (var i = 0; i < batch.cacheHits.length; i++) {
      batch.cacheHits[i]();
    }
  }
}

function getValidMaxBatchSize(options: ?Options<any, any, any>): number {
  var shouldBatch = !options || options.batch !== false;
  if (!shouldBatch) {
    return 1;
  }
  var maxBatchSize = options && options.maxBatchSize;
  if (maxBatchSize === undefined) {
    return Infinity;
  }
  if (typeof maxBatchSize !== 'number' || maxBatchSize < 1) {
    throw new TypeError(
      `maxBatchSize must be a positive number: ${(maxBatchSize: any)}`
    );
  }
  return maxBatchSize;
}

function getValidBatchScheduleFn(
  options?: Options<any, any, any>
): (() => void) => void {
  var batchScheduleFn = options && options.batchScheduleFn;
  if (batchScheduleFn === undefined) {
    return enqueuePostPromiseJob;
  }
  if (typeof batchScheduleFn !== 'function') {
    throw new TypeError(
      `batchScheduleFn must be a function: ${(batchScheduleFn: any)}`
    );
  }
  return batchScheduleFn;
}

function getValidCacheKeyFn<K, C>(options: ?Options<K, any, C>): (K => C) {
  var cacheKeyFn = options && options.cacheKeyFn;
  if (cacheKeyFn === undefined) {
    return (key => key: any);
  }
  if (typeof cacheKeyFn !== 'function') {
    throw new TypeError(`cacheKeyFn must be a function: ${(cacheKeyFn: any)}`);
  }
  return cacheKeyFn;
}

function getValidCacheMap<K, V, C>(
  options: ?Options<K, V, C>
): CacheMap<C, Promise<V>> | null {
  var shouldCache = !options || options.cache !== false;
  if (!shouldCache) {
    return null;
  }
  var cacheMap = options && options.cacheMap;
  if (cacheMap === undefined) {
    return new Map();
  }
  if (cacheMap !== null) {
    var cacheFunctions = [ 'get', 'set', 'delete', 'clear' ];
    var missingFunctions = cacheFunctions
      .filter(fnName => cacheMap && typeof cacheMap[fnName] !== 'function');
    if (missingFunctions.length !== 0) {
      throw new TypeError(
        'Custom cacheMap missing methods: ' + missingFunctions.join(', ')
      );
    }
  }
  return cacheMap;
}

function isArrayLike(x: mixed): boolean {
  return (
    typeof x === 'object' &&
    x !== null &&
    typeof x.length === 'number' &&
    (x.length === 0 ||
      (x.length > 0 && Object.prototype.hasOwnProperty.call(x, x.length - 1)))
  );
}
*/
