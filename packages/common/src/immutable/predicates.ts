import { isKeyed } from './isKeyed';
import { isIndexed } from './isIndexed';

export function isAssociative(maybeAssociative) {
  return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
}
// Note: value is unchanged to not break immutable-devtools.
export const IS_COLLECTION_SYMBOL = '@@__IMMUTABLE_ITERABLE__@@';

export function isCollection(maybeCollection) {
  return Boolean(maybeCollection && maybeCollection[IS_COLLECTION_SYMBOL]);
}
import { isCollection } from './isCollection';
import { isRecord } from './isRecord';

export function isImmutable(maybeImmutable) {
  return isCollection(maybeImmutable) || isRecord(maybeImmutable);
}
export const IS_INDEXED_SYMBOL = '@@__IMMUTABLE_INDEXED__@@';

export function isIndexed(maybeIndexed) {
  return Boolean(maybeIndexed && maybeIndexed[IS_INDEXED_SYMBOL]);
}
export const IS_KEYED_SYMBOL = '@@__IMMUTABLE_KEYED__@@';

export function isKeyed(maybeKeyed) {
  return Boolean(maybeKeyed && maybeKeyed[IS_KEYED_SYMBOL]);
}
export const IS_LIST_SYMBOL = '@@__IMMUTABLE_LIST__@@';

export function isList(maybeList) {
  return Boolean(maybeList && maybeList[IS_LIST_SYMBOL]);
}
export const IS_MAP_SYMBOL = '@@__IMMUTABLE_MAP__@@';

export function isMap(maybeMap) {
  return Boolean(maybeMap && maybeMap[IS_MAP_SYMBOL]);
}
export const IS_ORDERED_SYMBOL = '@@__IMMUTABLE_ORDERED__@@';

export function isOrdered(maybeOrdered) {
  return Boolean(maybeOrdered && maybeOrdered[IS_ORDERED_SYMBOL]);
}
import { isMap } from './isMap';
import { isOrdered } from './isOrdered';

export function isOrderedMap(maybeOrderedMap) {
  return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
}
import { isSet } from './isSet';
import { isOrdered } from './isOrdered';

export function isOrderedSet(maybeOrderedSet) {
  return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
}
export const IS_RECORD_SYMBOL = '@@__IMMUTABLE_RECORD__@@';

export function isRecord(maybeRecord) {
  return Boolean(maybeRecord && maybeRecord[IS_RECORD_SYMBOL]);
}
export const IS_SEQ_SYMBOL = '@@__IMMUTABLE_SEQ__@@';

export function isSeq(maybeSeq) {
  return Boolean(maybeSeq && maybeSeq[IS_SEQ_SYMBOL]);
}
export const IS_SET_SYMBOL = '@@__IMMUTABLE_SET__@@';

export function isSet(maybeSet) {
  return Boolean(maybeSet && maybeSet[IS_SET_SYMBOL]);
}
export const IS_STACK_SYMBOL = '@@__IMMUTABLE_STACK__@@';

export function isStack(maybeStack) {
  return Boolean(maybeStack && maybeStack[IS_STACK_SYMBOL]);
}
export function isValueObject(maybeValue) {
  return Boolean(
    maybeValue &&
      typeof maybeValue.equals === 'function' &&
      typeof maybeValue.hashCode === 'function'
  );
}
