export function asImmutable() {
  return this.__ensureOwner();
}
import { OwnerID } from '../TrieUtils';

export function asMutable() {
  return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
}
import { removeIn } from '../functional/removeIn';

export function deleteIn(keyPath) {
  return removeIn(this, keyPath);
}
import { getIn as _getIn } from '../functional/getIn';

export function getIn(searchKeyPath, notSetValue) {
  return _getIn(this, searchKeyPath, notSetValue);
}
import { hasIn as _hasIn } from '../functional/hasIn';

export function hasIn(searchKeyPath) {
  return _hasIn(this, searchKeyPath);
}
import { KeyedCollection } from '../Collection';
import { NOT_SET } from '../TrieUtils';
import { update } from '../functional/update';

export function merge(...iters) {
  return mergeIntoKeyedWith(this, iters);
}

export function mergeWith(merger, ...iters) {
  if (typeof merger !== 'function') {
    throw new TypeError('Invalid merger function: ' + merger);
  }
  return mergeIntoKeyedWith(this, iters, merger);
}

function mergeIntoKeyedWith(collection, collections, merger) {
  const iters = [];
  for (let ii = 0; ii < collections.length; ii++) {
    const collection = KeyedCollection(collections[ii]);
    if (collection.size !== 0) {
      iters.push(collection);
    }
  }
  if (iters.length === 0) {
    return collection;
  }
  if (
    collection.toSeq().size === 0 &&
    !collection.__ownerID &&
    iters.length === 1
  ) {
    return collection.constructor(iters[0]);
  }
  return collection.withMutations(collection => {
    const mergeIntoCollection = merger
      ? (value, key) => {
          update(collection, key, NOT_SET, oldVal =>
            oldVal === NOT_SET ? value : merger(oldVal, value, key)
          );
        }
      : (value, key) => {
          collection.set(key, value);
        };
    for (let ii = 0; ii < iters.length; ii++) {
      iters[ii].forEach(mergeIntoCollection);
    }
  });
}
import { mergeDeepWithSources } from '../functional/merge';

export function mergeDeep(...iters) {
  return mergeDeepWithSources(this, iters);
}

export function mergeDeepWith(merger, ...iters) {
  return mergeDeepWithSources(this, iters, merger);
}
import { mergeDeepWithSources } from '../functional/merge';
import { updateIn } from '../functional/updateIn';
import { emptyMap } from '../Map';

export function mergeDeepIn(keyPath, ...iters) {
  return updateIn(this, keyPath, emptyMap(), m =>
    mergeDeepWithSources(m, iters)
  );
}
import { mergeWithSources } from '../functional/merge';
import { updateIn } from '../functional/updateIn';
import { emptyMap } from '../Map';

export function mergeIn(keyPath, ...iters) {
  return updateIn(this, keyPath, emptyMap(), m => mergeWithSources(m, iters));
}
import { setIn as _setIn } from '../functional/setIn';

export function setIn(keyPath, v) {
  return _setIn(this, keyPath, v);
}
import assertNotInfinite from '../utils/assertNotInfinite';

export function toObject() {
  assertNotInfinite(this.size);
  const object = {};
  this.__iterate((v, k) => {
    object[k] = v;
  });
  return object;
}
import { update as _update } from '../functional/update';

export function update(key, notSetValue, updater) {
  return arguments.length === 1
    ? key(this)
    : _update(this, key, notSetValue, updater);
}
import { updateIn as _updateIn } from '../functional/updateIn';

export function updateIn(keyPath, notSetValue, updater) {
  return _updateIn(this, keyPath, notSetValue, updater);
}
export function wasAltered() {
  return this.__altered;
}
export function withMutations(fn) {
  const mutable = this.asMutable();
  fn(mutable);
  return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
}
