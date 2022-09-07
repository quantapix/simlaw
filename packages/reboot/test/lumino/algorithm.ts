// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { ArrayExt } from '@lumino/algorithm';

describe('@lumino/algorithm', () => {
  describe('ArrayExt', () => {
    describe('firstIndexOf()', () => {
      it('should find the index of the first matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one');
        expect(i).to.equal(0);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'red');
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.firstIndexOf(data, 'one');
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', 2);
        expect(i).to.equal(4);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', -2);
        expect(i).to.equal(4);
      });

      it('should support searching within a range', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', 1, 3);
        expect(i).to.equal(2);
      });

      it('should support a negative stop index', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'one', 1, -4);
        expect(i).to.equal(-1);
      });

      it('should wrap around if stop < start', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.firstIndexOf(data, 'two', 3, 2);
        expect(i).to.equal(1);
      });
    });

    describe('lastIndexOf()', () => {
      it('should find the index of the last matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one');
        expect(i).to.equal(4);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'red');
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.lastIndexOf(data, 'one');
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', 2);
        expect(i).to.equal(0);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', -2);
        expect(i).to.equal(2);
      });

      it('should support searching within a range', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', 3, 1);
        expect(i).to.equal(2);
      });

      it('should support a negative stop index', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'one', 1, -4);
        expect(i).to.equal(-1);
      });

      it('should wrap around if start < stop', () => {
        let data = ['one', 'two', 'one', 'four', 'one'];
        let i = ArrayExt.lastIndexOf(data, 'four', 2, 3);
        expect(i).to.equal(3);
      });
    });

    describe('findFirstIndex()', () => {
      it('should find the index of the first matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0);
        expect(i).to.equal(1);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 7 === 0);
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0);
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2);
        expect(i).to.equal(3);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, -3);
        expect(i).to.equal(3);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2, 4);
        expect(i).to.equal(3);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2, -2);
        expect(i).to.equal(3);
      });

      it('should wrap around if stop < start', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 4, 2);
        expect(i).to.equal(1);
      });
    });

    describe('findLastIndex()', () => {
      it('should find the index of the last matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0);
        expect(i).to.equal(3);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 7 === 0);
        expect(i).to.equal(-1);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0);
        expect(i).to.equal(-1);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 2);
        expect(i).to.equal(1);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, -3);
        expect(i).to.equal(1);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 4, 2);
        expect(i).to.equal(3);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, -3, 0);
        expect(i).to.equal(1);
      });

      it('should wrap around if start < stop', () => {
        let data = [1, 2, 3, 4, 5];
        let i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 0, 2);
        expect(i).to.equal(3);
      });
    });

    describe('findFirstValue()', () => {
      it('should find the index of the first matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'blue'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'b');
        expect(i).to.equal('bottle');
      });

      it('should return `undefined` if there is no matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'z');
        expect(i).to.equal(undefined);
      });

      it('should return `undefined` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'b');
        expect(i).to.equal(undefined);
      });

      it('should support searching from a start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'e', 2);
        expect(i).to.equal('egg');
      });

      it('should support a negative start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'e', -3);
        expect(i).to.equal('egg');
      });

      it('should support searching within a range', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'd', 2, 4);
        expect(i).to.equal('dog');
      });

      it('should support a negative stop index', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'd', 2, -2);
        expect(i).to.equal('dog');
      });

      it('should wrap around if stop < start', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findFirstValue(data, v => v[0] === 'b', 4, 2);
        expect(i).to.equal('bottle');
      });
    });

    describe('findLastValue()', () => {
      it('should find the index of the last matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'blue'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'b');
        expect(i).to.equal('blue');
      });

      it('should return `undefined` if there is no matching value', () => {
        let data = ['apple', 'bottle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'z');
        expect(i).to.equal(undefined);
      });

      it('should return `undefined` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'b');
        expect(i).to.equal(undefined);
      });

      it('should support searching from a start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'e', 2);
        expect(i).to.equal('eagle');
      });

      it('should support a negative start index', () => {
        let data = ['apple', 'eagle', 'cat', 'dog', 'egg', 'fish'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'e', -3);
        expect(i).to.equal('eagle');
      });

      it('should support searching within a range', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'd', 4, 2);
        expect(i).to.equal('dog');
      });

      it('should support a negative stop index', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'd', 4, -4);
        expect(i).to.equal('dog');
      });

      it('should wrap around if start < stop', () => {
        let data = ['dark', 'bottle', 'cat', 'dog', 'egg', 'dodge'];
        let i = ArrayExt.findLastValue(data, v => v[0] === 'e', 2, 4);
        expect(i).to.equal('egg');
      });
    });

    describe('lowerBound()', () => {
      it('should return the index of the first element `>=` a value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.lowerBound(data, -5, cmp);
        let r2 = ArrayExt.lowerBound(data, 0, cmp);
        let r3 = ArrayExt.lowerBound(data, 3, cmp);
        let r4 = ArrayExt.lowerBound(data, 5, cmp);
        expect(r1).to.equal(0);
        expect(r2).to.equal(0);
        expect(r3).to.equal(3);
        expect(r4).to.equal(6);
      });

      it('should return `length` if there is no matching value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.lowerBound(data, 9, cmp);
        let r2 = ArrayExt.lowerBound(data, 19, cmp);
        let r3 = ArrayExt.lowerBound(data, 29, cmp);
        expect(r1).to.equal(8);
        expect(r2).to.equal(8);
        expect(r3).to.equal(8);
      });

      it('should return `0` if the array is empty', () => {
        let data: number[] = [];
        let cmp = (a: number, b: number) => a - b;
        let i = ArrayExt.lowerBound(data, 0, cmp);
        expect(i).to.equal(0);
      });

      it('should support searching a range', () => {
        let data = [4, 5, 6, 4, 5, 6];
        let cmp = (a: number, b: number) => a - b;
        let r = ArrayExt.lowerBound(data, 5, cmp, 3, 5);
        expect(r).to.equal(4);
      });
    });

    describe('upperBound()', () => {
      it('should return the index of the first element `>` a value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.upperBound(data, -5, cmp);
        let r2 = ArrayExt.upperBound(data, 0, cmp);
        let r3 = ArrayExt.upperBound(data, 2, cmp);
        let r4 = ArrayExt.upperBound(data, 3, cmp);
        expect(r1).to.equal(0);
        expect(r2).to.equal(0);
        expect(r3).to.equal(3);
        expect(r4).to.equal(5);
      });

      it('should return `length` if there is no matching value', () => {
        let data = [1, 2, 2, 3, 3, 4, 5, 5];
        let cmp = (a: number, b: number) => a - b;
        let r1 = ArrayExt.upperBound(data, 9, cmp);
        let r2 = ArrayExt.upperBound(data, 19, cmp);
        let r3 = ArrayExt.upperBound(data, 29, cmp);
        expect(r1).to.equal(8);
        expect(r2).to.equal(8);
        expect(r3).to.equal(8);
      });

      it('should return `0` if the array is empty', () => {
        let data: number[] = [];
        let cmp = (a: number, b: number) => a - b;
        let i = ArrayExt.upperBound(data, 0, cmp);
        expect(i).to.equal(0);
      });

      it('should support searching a range', () => {
        let data = [4, 5, 6, 4, 5, 6];
        let cmp = (a: number, b: number) => a - b;
        let r = ArrayExt.upperBound(data, 5, cmp, 3, 5);
        expect(r).to.equal(5);
      });
    });

    describe('move()', () => {
      it('should move an element from one index to another', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.move(data, 1, 3);
        ArrayExt.move(data, 4, 0);
        expect(data).to.deep.equal([5, 1, 3, 4, 2]);
      });

      it('should be a no-op for equal indices', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.move(data, 2, 2);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should be a no-op for an array length `<= 1`', () => {
        let data1 = [1];
        let data2: any[] = [];
        ArrayExt.move(data1, 0, 0);
        ArrayExt.move(data2, 0, 0);
        expect(data1).to.deep.equal([1]);
        expect(data2).to.deep.equal([]);
      });
    });

    describe('reverse()', () => {
      it('should reverse an array in-place', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.reverse(data);
        expect(data).to.deep.equal([5, 4, 3, 2, 1]);
      });

      it('should support reversing a section of an array', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.reverse(data, 2);
        expect(data).to.deep.equal([1, 2, 5, 4, 3]);
        ArrayExt.reverse(data, 0, 3);
        expect(data).to.deep.equal([4, 5, 2, 1, 3]);
      });

      it('should be a no-op if `start >= stop`', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.reverse(data, 2, 2);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
        ArrayExt.reverse(data, 4, 2);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should be a no-op for an array length `<= 1`', () => {
        let data1 = [1];
        let data2: any[] = [];
        ArrayExt.reverse(data1);
        ArrayExt.reverse(data2);
        expect(data1).to.deep.equal([1]);
        expect(data2).to.deep.equal([]);
      });
    });

    describe('rotate()', () => {
      it('should rotate the elements left by a positive delta', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 2);
        expect(data).to.deep.equal([3, 4, 5, 1, 2]);
        ArrayExt.rotate(data, 12);
        expect(data).to.deep.equal([5, 1, 2, 3, 4]);
      });

      it('should rotate the elements right by a negative delta', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, -2);
        expect(data).to.deep.equal([4, 5, 1, 2, 3]);
        ArrayExt.rotate(data, -12);
        expect(data).to.deep.equal([2, 3, 4, 5, 1]);
      });

      it('should be a no-op for a zero delta', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 0);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should be a no-op for a array length `<= 1`', () => {
        let data1 = [1];
        let data2: any[] = [];
        ArrayExt.rotate(data1, 1);
        ArrayExt.rotate(data2, 1);
        expect(data1).to.deep.equal([1]);
        expect(data2).to.deep.equal([]);
      });

      it('should rotate a section of the array', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 2, 1, 3);
        expect(data).to.deep.equal([1, 4, 2, 3, 5]);
        ArrayExt.rotate(data, -2, 0, 3);
        expect(data).to.deep.equal([2, 3, 1, 4, 5]);
      });

      it('should be a no-op if `start >= stop`', () => {
        let data = [1, 2, 3, 4, 5];
        ArrayExt.rotate(data, 2, 5, 4);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });
    });

    describe('fill()', () => {
      it('should fill an array with a static value', () => {
        let data = [0, 0, 0, 0, 0];
        ArrayExt.fill(data, 1);
        expect(data).to.deep.equal([1, 1, 1, 1, 1]);
      });

      it('should fill a section of the array', () => {
        let data = [0, 0, 0, 0, 0];
        ArrayExt.fill(data, 1, 1, 3);
        expect(data).to.deep.equal([0, 1, 1, 1, 0]);
      });

      it('should wrap around if `stop < start`', () => {
        let data = [0, 0, 0, 0, 0];
        ArrayExt.fill(data, 1, 3, 1);
        expect(data).to.deep.equal([1, 1, 0, 1, 1]);
      });
    });

    describe('insert()', () => {
      it('should insert a value at the specified index', () => {
        let data: number[] = [];
        ArrayExt.insert(data, 0, 9);
        expect(data).to.deep.equal([9]);
        ArrayExt.insert(data, 0, 8);
        expect(data).to.deep.equal([8, 9]);
        ArrayExt.insert(data, 0, 7);
        expect(data).to.deep.equal([7, 8, 9]);
        ArrayExt.insert(data, -2, 6);
        expect(data).to.deep.equal([7, 6, 8, 9]);
        ArrayExt.insert(data, 2, 5);
        expect(data).to.deep.equal([7, 6, 5, 8, 9]);
        ArrayExt.insert(data, -5, 4);
        expect(data).to.deep.equal([4, 7, 6, 5, 8, 9]);
      });

      it('should clamp the index to the bounds of the vector', () => {
        let data: number[] = [];
        ArrayExt.insert(data, -10, 9);
        expect(data).to.deep.equal([9]);
        ArrayExt.insert(data, -5, 8);
        expect(data).to.deep.equal([8, 9]);
        ArrayExt.insert(data, -1, 7);
        expect(data).to.deep.equal([8, 7, 9]);
        ArrayExt.insert(data, 13, 6);
        expect(data).to.deep.equal([8, 7, 9, 6]);
        ArrayExt.insert(data, 8, 4);
        expect(data).to.deep.equal([8, 7, 9, 6, 4]);
      });
    });

    describe('removeAt()', () => {
      it('should remove the value at a specified index', () => {
        let data = [7, 4, 8, 5, 9, 6];
        expect(ArrayExt.removeAt(data, 1)).to.equal(4);
        expect(data).to.deep.equal([7, 8, 5, 9, 6]);
        expect(ArrayExt.removeAt(data, 2)).to.equal(5);
        expect(data).to.deep.equal([7, 8, 9, 6]);
        expect(ArrayExt.removeAt(data, -2)).to.equal(9);
        expect(data).to.deep.equal([7, 8, 6]);
        expect(ArrayExt.removeAt(data, 0)).to.equal(7);
        expect(data).to.deep.equal([8, 6]);
        expect(ArrayExt.removeAt(data, -1)).to.equal(6);
        expect(data).to.deep.equal([8]);
        expect(ArrayExt.removeAt(data, 0)).to.equal(8);
        expect(data).to.deep.equal([]);
      });

      it('should return `undefined` if the index is out of range', () => {
        let data = [7, 4, 8, 5, 9, 6];
        expect(ArrayExt.removeAt(data, 10)).to.equal(undefined);
        expect(data).to.deep.equal([7, 4, 8, 5, 9, 6]);
        expect(ArrayExt.removeAt(data, -12)).to.equal(undefined);
        expect(data).to.deep.equal([7, 4, 8, 5, 9, 6]);
      });
    });

    describe('removeFirstOf()', () => {
      it('should remove the first occurrence of a value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'one');
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['two', 'three', 'four', 'one']);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four', 'one']);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.removeFirstOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'one', 2);
        expect(i).to.equal(4);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'one', -2);
        expect(i).to.equal(4);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support searching within a range', () => {
        let data = ['three', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'three', 1, 3);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'one']);
      });

      it('should support a negative stop index', () => {
        let data = ['three', 'two', 'three', 'four', 'three'];
        let i = ArrayExt.removeFirstOf(data, 'three', 1, -2);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'three']);
      });

      it('should wrap around if stop < start', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeFirstOf(data, 'two', 3, 1);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'three', 'four', 'one']);
      });
    });

    describe('removeLastOf()', () => {
      it('should remove the last occurrence of a value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'one');
        expect(i).to.equal(4);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four', 'one']);
      });

      it('should return `-1` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.removeLastOf(data, 'five');
        expect(i).to.equal(-1);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'one', 2);
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['two', 'three', 'four', 'one']);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'one', -2);
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['two', 'three', 'four', 'one']);
      });

      it('should support searching within a range', () => {
        let data = ['three', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'three', 3, 1);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'one']);
      });

      it('should support a negative stop index', () => {
        let data = ['three', 'two', 'three', 'four', 'three'];
        let i = ArrayExt.removeLastOf(data, 'three', 3, -4);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['three', 'two', 'four', 'three']);
      });

      it('should wrap around if start < stop', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeLastOf(data, 'two', 3, 1);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'three', 'four', 'one']);
      });
    });

    describe('removeAllOf()', () => {
      it('should remove all occurrences of a value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one');
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['two', 'three', 'four']);
      });

      it('should return `0` if there is no matching value', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'five');
        expect(i).to.equal(0);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four', 'one']);
      });

      it('should return `0` if the array is empty', () => {
        let data: string[] = [];
        let i = ArrayExt.removeAllOf(data, 'five');
        expect(i).to.equal(0);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one', 2);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support a negative start index', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one', -2);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['one', 'two', 'three', 'four']);
      });

      it('should support searching within a range', () => {
        let data = ['three', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'three', 1, 3);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['three', 'two', 'four', 'one']);
      });

      it('should support a negative stop index', () => {
        let data = ['three', 'two', 'three', 'four', 'three'];
        let i = ArrayExt.removeAllOf(data, 'three', 1, -2);
        expect(i).to.equal(1);
        expect(data).to.deep.equal(['three', 'two', 'four', 'three']);
      });

      it('should wrap around if start < stop', () => {
        let data = ['one', 'two', 'three', 'four', 'one'];
        let i = ArrayExt.removeAllOf(data, 'one', 3, 1);
        expect(i).to.equal(2);
        expect(data).to.deep.equal(['two', 'three', 'four']);
      });
    });

    describe('removeFirstWhere()', () => {
      it('should remove the first occurrence of a value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let result = ArrayExt.removeFirstWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, -3);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2, 4);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2, -2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should wrap around if stop < start', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 4, 2);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });
    });

    describe('removeLastWhere()', () => {
      it('should remove the last occurrence of a value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should return `-1` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([1, 2, 3, 4, 5]);
      });

      it('should return `-1` if the array is empty', () => {
        let data: number[] = [];
        let result = ArrayExt.removeLastWhere(data, v => v % 7 === 0);
        expect(result.index).to.equal(-1);
        expect(result.value).to.equal(undefined);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 2);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, -3);
        expect(result.index).to.equal(1);
        expect(result.value).to.equal(2);
        expect(data).to.deep.equal([1, 3, 4, 5]);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 4, 2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 4, -4);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });

      it('should wrap around if start < stop', () => {
        let data = [1, 2, 3, 4, 5];
        let result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 0, 2);
        expect(result.index).to.equal(3);
        expect(result.value).to.equal(4);
        expect(data).to.deep.equal([1, 2, 3, 5]);
      });
    });

    describe('removeAllWhere()', () => {
      it('should remove all occurrences of a value', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0);
        expect(count).to.equal(2);
        expect(data).to.deep.equal([1, 2, 4, 5, 1]);
      });

      it('should return `0` if there is no matching value', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 7 === 0);
        expect(count).to.equal(0);
        expect(data).to.deep.equal([1, 2, 3, 4, 3, 5, 1]);
      });

      it('should return `0` if the array is empty', () => {
        let data: number[] = [];
        let count = ArrayExt.removeAllWhere(data, v => v % 7 === 0);
        expect(count).to.equal(0);
        expect(data).to.deep.equal([]);
      });

      it('should support searching from a start index', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should support a negative start index', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, -4);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should support searching within a range', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3, 5);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should support a negative stop index', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3, -2);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1]);
      });

      it('should wrap around if start < stop', () => {
        let data = [1, 2, 3, 4, 3, 5, 1];
        let count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 5, 3);
        expect(count).to.equal(1);
        expect(data).to.deep.equal([1, 2, 4, 3, 5, 1]);
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { chain } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('chain()', () => {
    testIterator(() => {
      let it = chain([1, 2, 3], [4], [5, 6]);
      let expected = [1, 2, 3, 4, 5, 6];
      return [it, expected];
    });
  });

  describe('ChainIterator', () => {
    testIterator(() => {
      let a = [1, 2, 3];
      let b = ['four', 'five'];
      let c = [true, false][Symbol.iterator]();
      type T = number | string | boolean;
      let it = chain<T>(a, b, c);
      let expected = [1, 2, 3, 'four', 'five', true, false];
      return [it, expected];
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { empty } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('empty()', () => {
    testIterator(() => {
      return [empty(), []];
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { filter } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('filter()', () => {
    testIterator(() => {
      let expected = [0, 2, 4];
      let data = [0, 1, 2, 3, 4, 5];
      let it = filter(data, n => n % 2 === 0);
      return [it, expected];
    });
  });

  describe('filter()', () => {
    testIterator(() => {
      let expected = [1, 3, 5];
      let data = [0, 1, 2, 3, 4, 5][Symbol.iterator]();
      let it = filter(data, n => n % 2 !== 0);
      return [it, expected];
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { find, max, min, minmax } from '@lumino/algorithm';

describe('@lumino/algorithm', () => {
  describe('find()', () => {
    it('should find the first matching value', () => {
      interface IAnimal {
        species: string;
        name: string;
      }
      let isCat = (value: IAnimal) => value.species === 'cat';
      let data: IAnimal[] = [
        { species: 'dog', name: 'spot' },
        { species: 'cat', name: 'fluffy' },
        { species: 'alligator', name: 'pocho' }
      ];
      expect(find(data, isCat)).to.equal(data[1]);
    });

    it('should return `undefined` if there is no matching value', () => {
      interface IAnimal {
        species: string;
        name: string;
      }
      let isRacoon = (value: IAnimal) => value.species === 'racoon';
      let data: IAnimal[] = [
        { species: 'dog', name: 'spot' },
        { species: 'cat', name: 'fluffy' },
        { species: 'alligator', name: 'pocho' }
      ];
      expect(find(data, isRacoon)).to.equal(undefined);
    });
  });

  describe('min()', () => {
    it('should return the minimum value in an iterable', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 }
      ];
      let score = min(data, (a, b) => a.value - b.value);
      expect(score).to.equal(data[1]);
    });

    it('should not invoke the comparator for only one value', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [{ value: 19 }];
      let called = false;
      let score = min(data, (a, b) => {
        called = true;
        return a.value - b.value;
      });
      expect(score).to.equal(data[0]);
      expect(called).to.equal(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [];
      let score = min(data, (a, b) => a.value - b.value);
      expect(score).to.equal(undefined);
    });
  });

  describe('max()', () => {
    it('should return the maximum value in an iterable', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 }
      ];
      let score = max(data, (a, b) => a.value - b.value);
      expect(score).to.equal(data[3]);
    });

    it('should not invoke the comparator for only one value', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [{ value: 19 }];
      let called = false;
      let score = max(data, (a, b) => {
        called = true;
        return a.value - b.value;
      });
      expect(score).to.equal(data[0]);
      expect(called).to.equal(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [];
      let score = max(data, (a, b) => a.value - b.value);
      expect(score).to.equal(undefined);
    });
  });

  describe('minmax()', () => {
    it('should return the minimum and maximum value in an iterable', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 }
      ];
      let [rmin, rmax] = minmax(data, (a, b) => a.value - b.value)!;
      expect(rmin).to.equal(data[1]);
      expect(rmax).to.equal(data[3]);
    });

    it('should not invoke the comparator for only one value', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [{ value: 19 }];
      let called = false;
      let [rmin, rmax] = minmax(data, (a, b) => {
        called = true;
        return a.value - b.value;
      })!;
      expect(rmin).to.equal(data[0]);
      expect(rmax).to.equal(data[0]);
      expect(called).to.equal(false);
    });

    it('should return `undefined` if the iterable is empty', () => {
      interface IScore {
        value: number;
      }
      let data: IScore[] = [];
      let score = minmax(data, (a, b) => a.value - b.value);
      expect(score).to.equal(undefined);
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import './array.spec';
import './chain.spec';
import './empty.spec';
import './filter.spec';
import './find.spec';
import './iter.spec';
import './map.spec';
import './range.spec';
import './reduce.spec';
import './repeat.spec';
import './retro.spec';
import './sort.spec';
import './stride.spec';
import './string.spec';
import './take.spec';
import './zip.spec';
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { each, every, some, toArray, toObject, zip } from '@lumino/algorithm';

/**
 * A helper function to test the methods of an iterator.
 *
 * @param factory - A function which produces an iterator and the
 *   expected results of that iterator.
 */
export function testIterator<T>(
  factory: () => [IterableIterator<T>, T[]],
  name = ''
): void {
  describe(`yield ${name}`, () => {
    it('should return the same values in the iterator', () => {
      let [it, results] = factory();
      expect(Array.from(it)).to.deep.equal(results);
    });
  });
}

describe('@lumino/algorithm', () => {
  describe('toArray()', () => {
    it('should create an array from an iterable', () => {
      let data = [1, 2, 3, 4, 5, 6];
      let stream = data[Symbol.iterator]();
      let result = toArray(stream);
      expect(result).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('toObject()', () => {
    it('should create an object from a [key, value] iterable', () => {
      let keys = ['one', 'two', 'three'];
      let values = [1, 2, 3];
      let stream = zip<string | number>(keys, values);
      let result = toObject(stream as Iterable<[string, number]>);
      expect(result).to.deep.equal({ one: 1, two: 2, three: 3 });
    });
  });

  describe('each()', () => {
    it('should visit every item in an iterable', () => {
      let result = 0;
      let data = [1, 2, 3, 4, 5];
      each(data, x => {
        result += x;
      });
      expect(result).to.equal(15);
    });

    it('should break early if the callback returns `false`', () => {
      let result = 0;
      let data = [1, 2, 3, 4, 5];
      each(data, x => {
        if (x > 3) {
          return false;
        }
        result += x;
        return true;
      });
      expect(result).to.equal(6);
    });
  });

  describe('every()', () => {
    it('should verify all items in an iterable satisfy a condition', () => {
      let data = [1, 2, 3, 4, 5];
      let valid = every(data, x => x > 0);
      let invalid = every(data, x => x > 4);
      expect(valid).to.equal(true);
      expect(invalid).to.equal(false);
    });
  });

  describe('some()', () => {
    it('should verify some items in an iterable satisfy a condition', () => {
      let data = [1, 2, 3, 4, 5];
      let valid = some(data, x => x > 4);
      let invalid = some(data, x => x < 0);
      expect(valid).to.equal(true);
      expect(invalid).to.equal(false);
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { map } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('map()', () => {
    testIterator(() => {
      let result = [0, 1, 4, 9, 16, 25];
      let it = map([0, 1, 2, 3, 4, 5], x => x ** 2);
      return [it, result];
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { range } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('range()', () => {
    describe('single argument form', () => {
      testIterator(() => {
        return [range(3), [0, 1, 2]];
      });
    });

    describe('two argument form', () => {
      testIterator(() => {
        return [range(4, 7), [4, 5, 6]];
      });
    });

    describe('three argument form', () => {
      testIterator(() => {
        return [range(4, 11, 3), [4, 7, 10]];
      });
    });

    describe('negative step', () => {
      testIterator(() => {
        return [range(3, 0, -1), [3, 2, 1]];
      });
    });

    describe('zero effective length', () => {
      testIterator(() => {
        return [range(0, 10, -1), []];
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { reduce } from '@lumino/algorithm';

describe('@lumino/algorithm', () => {
  describe('reduce()', () => {
    it('should reduce items in an iterable into an accumulated value', () => {
      let sum = reduce([1, 2, 3, 4, 5], (a, x) => a + x, 0);
      expect(sum).to.equal(15);
    });

    it('should throw if iterable is empty and initial value is undefined', () => {
      let data: Array<number> = [];
      let reduced = () => reduce(data, (a, x) => a + x);
      expect(reduced).to.throw(TypeError);
    });

    it('should return the initial value if the iterable is empty', () => {
      let data: Array<number> = [];
      let result = reduce(data, (a, x) => a + x, 0);
      expect(result).to.equal(0);
    });

    it('should return the first item if the iterable has just one item with no initial value', () => {
      let data = [9];
      let result = reduce(data, (a, x) => a + x);
      expect(result).to.equal(9);
    });

    it('should invoke the reducer if the iterable has just one item with an initial value', () => {
      let data = [9];
      let result = reduce(data, (a, x) => a + x, 1);
      expect(result).to.equal(10);
    });

    it('should invoke the reducer if the iterable has just two items with no initial value', () => {
      let data = [1, 2];
      let result = reduce(data, (a, x) => a + x);
      expect(result).to.equal(3);
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { once, repeat } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('repeat()', () => {
    testIterator(() => {
      return [repeat('foo', 3), ['foo', 'foo', 'foo']];
    });
  });

  describe('once()', () => {
    testIterator(() => {
      return [once('foo'), ['foo']];
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { retro } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('retro()', () => {
    it('should create an iterator for an array-like object', () => {
      expect(Array.from(retro([0, 1, 2, 3]))).to.deep.equal([3, 2, 1, 0]);
    });

    it('should call `retro` on a retroable', () => {
      let data = [1, 2, 3, 4];
      let retroable = { retro: () => retro(data) };
      testIterator(() => [retro(retroable), data.slice().reverse()], 'retro');
    });

    it('should reverse an array', () => {
      testIterator(() => {
        return [retro([1, 2, 3]), [3, 2, 1]];
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { topologicSort } from '@lumino/algorithm';

describe('@lumino/algorithm', () => {
  describe('topologicSort()', () => {
    it('should correctly order the input', () => {
      let data: Array<[string, string]> = [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
        ['d', 'e']
      ];
      let result = topologicSort(data);
      expect(result).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
    });

    it('should correctly order shuffled input', () => {
      let data: Array<[string, string]> = [
        ['d', 'e'],
        ['c', 'd'],
        ['a', 'b'],
        ['b', 'c']
      ];
      let result = topologicSort(data);
      expect(result).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
    });

    it('should return an approximate order when a cycle is present', () => {
      let data: Array<[string, string]> = [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
        ['c', 'b'],
        ['d', 'e']
      ];
      let result = topologicSort(data);
      expect(result.indexOf('a')).to.equal(0);
      expect(result.indexOf('e')).to.equal(4);
      expect(result.indexOf('b')).to.be.greaterThan(0).lessThan(4);
      expect(result.indexOf('c')).to.be.greaterThan(0).lessThan(4);
      expect(result.indexOf('d')).to.be.greaterThan(0).lessThan(4);
    });

    it('should return a valid order when under-constrained', () => {
      let data: Array<[string, string]> = [
        ['a', 'b'],
        ['a', 'c'],
        ['a', 'd'],
        ['a', 'e']
      ];
      let result = topologicSort(data);
      expect(result.indexOf('a')).to.equal(0);
      expect(result.indexOf('b')).to.be.greaterThan(0);
      expect(result.indexOf('c')).to.be.greaterThan(0);
      expect(result.indexOf('d')).to.be.greaterThan(0);
      expect(result.indexOf('e')).to.be.greaterThan(0);
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { stride } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('stride() with an array', () => {
    testIterator(() => {
      return [stride([0, 1, 2, 3, 4, 5], 2), [0, 2, 4]];
    });
  });

  describe('stride() with an iterable iterator', () => {
    testIterator(() => {
      let it = [1, 2, 3, 4, 5, 6, 7][Symbol.iterator]();
      return [stride(it, 3), [1, 4, 7]];
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { expect } from 'chai';

import { StringExt } from '@lumino/algorithm';

describe('@lumino/algorithm', () => {
  describe('StringExt', () => {
    describe('findIndices()', () => {
      it('should find the indices of the matching characters', () => {
        let r1 = StringExt.findIndices('Foo Bar Baz', 'Faa')!;
        let r2 = StringExt.findIndices('Foo Bar Baz', 'oBz')!;
        let r3 = StringExt.findIndices('Foo Bar Baz', 'r B')!;
        expect(r1).to.deep.equal([0, 5, 9]);
        expect(r2).to.deep.equal([1, 4, 10]);
        expect(r3).to.deep.equal([6, 7, 8]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringExt.findIndices('Foo Bar Baz', 'faa');
        let r2 = StringExt.findIndices('Foo Bar Baz', 'obz');
        let r3 = StringExt.findIndices('Foo Bar Baz', 'raB');
        expect(r1).to.equal(null);
        expect(r2).to.equal(null);
        expect(r3).to.equal(null);
      });
    });

    describe('matchSumOfSquares()', () => {
      it('should score the match using the sum of squared distances', () => {
        let r1 = StringExt.matchSumOfSquares('Foo Bar Baz', 'Faa')!;
        let r2 = StringExt.matchSumOfSquares('Foo Bar Baz', 'oBz')!;
        let r3 = StringExt.matchSumOfSquares('Foo Bar Baz', 'r B')!;
        expect(r1.score).to.equal(106);
        expect(r1.indices).to.deep.equal([0, 5, 9]);
        expect(r2.score).to.equal(117);
        expect(r2.indices).to.deep.equal([1, 4, 10]);
        expect(r3.score).to.equal(149);
        expect(r3.indices).to.deep.equal([6, 7, 8]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringExt.matchSumOfSquares('Foo Bar Baz', 'faa');
        let r2 = StringExt.matchSumOfSquares('Foo Bar Baz', 'obz');
        let r3 = StringExt.matchSumOfSquares('Foo Bar Baz', 'raB');
        expect(r1).to.equal(null);
        expect(r2).to.equal(null);
        expect(r3).to.equal(null);
      });
    });

    describe('matchSumOfDeltas()', () => {
      it('should score the match using the sum of deltas distances', () => {
        let r1 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'Frz')!;
        let r2 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'rBa')!;
        let r3 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'oar')!;
        expect(r1.score).to.equal(8);
        expect(r1.indices).to.deep.equal([0, 6, 10]);
        expect(r2.score).to.equal(7);
        expect(r2.indices).to.deep.equal([6, 8, 9]);
        expect(r3.score).to.equal(4);
        expect(r3.indices).to.deep.equal([1, 5, 6]);
      });

      it('should return `null` if no match is found', () => {
        let r1 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'cce');
        let r2 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'ar3');
        let r3 = StringExt.matchSumOfDeltas('Foo Bar Baz', 'raB');
        expect(r1).to.equal(null);
        expect(r2).to.equal(null);
        expect(r3).to.equal(null);
      });
    });

    describe('highlight()', () => {
      it('should interpolate text with highlight results', () => {
        let mark = (chunk: string) => `<mark>${chunk}</mark>`;
        let r1 = StringExt.findIndices('Foo Bar Baz', 'Faa')!;
        let r2 = StringExt.findIndices('Foo Bar Baz', 'oBz')!;
        let r3 = StringExt.findIndices('Foo Bar Baz', 'r B')!;
        let h1 = StringExt.highlight('Foo Bar Baz', r1, mark).join('');
        let h2 = StringExt.highlight('Foo Bar Baz', r2, mark).join('');
        let h3 = StringExt.highlight('Foo Bar Baz', r3, mark).join('');
        expect(h1).to.equal(
          '<mark>F</mark>oo B<mark>a</mark>r B<mark>a</mark>z'
        );
        expect(h2).to.equal(
          'F<mark>o</mark>o <mark>B</mark>ar Ba<mark>z</mark>'
        );
        expect(h3).to.equal('Foo Ba<mark>r B</mark>az');
      });
    });
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { take } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('take() from an array', () => {
    testIterator(() => {
      return [take([1, 2, 3, 4, 5], 2), [1, 2]];
    });
  });

  describe('take() from an iterable iterator', () => {
    testIterator(() => {
      return [take([0, 1, 2, 3], 1), [0]];
    });
  });

  describe('take() with count=0', () => {
    testIterator(() => [take([0, 1, 2, 3], 0), []]);
  });

  describe('take() only takes as many as count or are left', () => {
    const it = [0, 1, 2, 3, 4, 5, 6][Symbol.iterator]();
    testIterator(() => [take(it, 2), [0, 1]]);
    testIterator(() => [take(it, 4), [2, 3, 4, 5]]);
    testIterator(() => [take(it, 25), [6]]);
  });
});
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { zip } from '@lumino/algorithm';

import { testIterator } from './iter.spec';

describe('@lumino/algorithm', () => {
  describe('zip() with same-length iterables', () => {
    testIterator(() => {
      return [
        zip([1, 2, 3], [4, 5, 6]),
        [
          [1, 4],
          [2, 5],
          [3, 6]
        ]
      ];
    });
  });

  describe('zip() with different-length iterables', () => {
    testIterator(() => {
      let i1 = ['one', 'two', 'three', 'four'];
      let i2 = [true, false, true];
      let i3 = [1, 2, 3, 4];
      type T = string | boolean | number;
      let it = zip<T>(i1, i2, i3);
      let results = [
        ['one', true, 1],
        ['two', false, 2],
        ['three', true, 3]
      ];
      return [it, results];
    });
  });
});
