import { ArrayExt } from "../../src/lumino/algorithm.js"
describe("Algorithm", () => {
  describe("ArrayExt", () => {
    describe("firstIndexOf()", () => {
      it("should find the index of the first matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "one")
        expect(i).to.equal(0)
      })
      it("should return `-1` if there is no matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "red")
        expect(i).to.equal(-1)
      })
      it("should return `-1` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.firstIndexOf(data, "one")
        expect(i).to.equal(-1)
      })
      it("should support searching from a start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "one", 2)
        expect(i).to.equal(4)
      })
      it("should support a negative start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "one", -2)
        expect(i).to.equal(4)
      })
      it("should support searching within a range", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "one", 1, 3)
        expect(i).to.equal(2)
      })
      it("should support a negative stop index", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "one", 1, -4)
        expect(i).to.equal(-1)
      })
      it("should wrap around if stop < start", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.firstIndexOf(data, "two", 3, 2)
        expect(i).to.equal(1)
      })
    })
    describe("lastIndexOf()", () => {
      it("should find the index of the last matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "one")
        expect(i).to.equal(4)
      })
      it("should return `-1` if there is no matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "red")
        expect(i).to.equal(-1)
      })
      it("should return `-1` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.lastIndexOf(data, "one")
        expect(i).to.equal(-1)
      })
      it("should support searching from a start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "one", 2)
        expect(i).to.equal(0)
      })
      it("should support a negative start index", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "one", -2)
        expect(i).to.equal(2)
      })
      it("should support searching within a range", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "one", 3, 1)
        expect(i).to.equal(2)
      })
      it("should support a negative stop index", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "one", 1, -4)
        expect(i).to.equal(-1)
      })
      it("should wrap around if start < stop", () => {
        const data = ["one", "two", "one", "four", "one"]
        const i = ArrayExt.lastIndexOf(data, "four", 2, 3)
        expect(i).to.equal(3)
      })
    })
    describe("findFirstIndex()", () => {
      it("should find the index of the first matching value", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0)
        expect(i).to.equal(1)
      })
      it("should return `-1` if there is no matching value", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 7 === 0)
        expect(i).to.equal(-1)
      })
      it("should return `-1` if the array is empty", () => {
        const data: number[] = []
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0)
        expect(i).to.equal(-1)
      })
      it("should support searching from a start index", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2)
        expect(i).to.equal(3)
      })
      it("should support a negative start index", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, -3)
        expect(i).to.equal(3)
      })
      it("should support searching within a range", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2, 4)
        expect(i).to.equal(3)
      })
      it("should support a negative stop index", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 2, -2)
        expect(i).to.equal(3)
      })
      it("should wrap around if stop < start", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findFirstIndex(data, v => v % 2 === 0, 4, 2)
        expect(i).to.equal(1)
      })
    })
    describe("findLastIndex()", () => {
      it("should find the index of the last matching value", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0)
        expect(i).to.equal(3)
      })
      it("should return `-1` if there is no matching value", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 7 === 0)
        expect(i).to.equal(-1)
      })
      it("should return `-1` if the array is empty", () => {
        const data: number[] = []
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0)
        expect(i).to.equal(-1)
      })
      it("should support searching from a start index", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 2)
        expect(i).to.equal(1)
      })
      it("should support a negative start index", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0, -3)
        expect(i).to.equal(1)
      })
      it("should support searching within a range", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 4, 2)
        expect(i).to.equal(3)
      })
      it("should support a negative stop index", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0, -3, 0)
        expect(i).to.equal(1)
      })
      it("should wrap around if start < stop", () => {
        const data = [1, 2, 3, 4, 5]
        const i = ArrayExt.findLastIndex(data, v => v % 2 === 0, 0, 2)
        expect(i).to.equal(3)
      })
    })
    describe("findFirstValue()", () => {
      it("should find the index of the first matching value", () => {
        const data = ["apple", "bottle", "cat", "dog", "egg", "blue"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "b")
        expect(i).to.equal("bottle")
      })
      it("should return `undefined` if there is no matching value", () => {
        const data = ["apple", "bottle", "cat", "dog", "egg", "fish"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "z")
        expect(i).to.equal(undefined)
      })
      it("should return `undefined` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.findFirstValue(data, v => v[0] === "b")
        expect(i).to.equal(undefined)
      })
      it("should support searching from a start index", () => {
        const data = ["apple", "eagle", "cat", "dog", "egg", "fish"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "e", 2)
        expect(i).to.equal("egg")
      })
      it("should support a negative start index", () => {
        const data = ["apple", "eagle", "cat", "dog", "egg", "fish"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "e", -3)
        expect(i).to.equal("egg")
      })
      it("should support searching within a range", () => {
        const data = ["dark", "bottle", "cat", "dog", "egg", "dodge"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "d", 2, 4)
        expect(i).to.equal("dog")
      })
      it("should support a negative stop index", () => {
        const data = ["dark", "bottle", "cat", "dog", "egg", "dodge"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "d", 2, -2)
        expect(i).to.equal("dog")
      })
      it("should wrap around if stop < start", () => {
        const data = ["dark", "bottle", "cat", "dog", "egg", "dodge"]
        const i = ArrayExt.findFirstValue(data, v => v[0] === "b", 4, 2)
        expect(i).to.equal("bottle")
      })
    })
    describe("findLastValue()", () => {
      it("should find the index of the last matching value", () => {
        const data = ["apple", "bottle", "cat", "dog", "egg", "blue"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "b")
        expect(i).to.equal("blue")
      })
      it("should return `undefined` if there is no matching value", () => {
        const data = ["apple", "bottle", "cat", "dog", "egg", "fish"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "z")
        expect(i).to.equal(undefined)
      })
      it("should return `undefined` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.findLastValue(data, v => v[0] === "b")
        expect(i).to.equal(undefined)
      })
      it("should support searching from a start index", () => {
        const data = ["apple", "eagle", "cat", "dog", "egg", "fish"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "e", 2)
        expect(i).to.equal("eagle")
      })
      it("should support a negative start index", () => {
        const data = ["apple", "eagle", "cat", "dog", "egg", "fish"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "e", -3)
        expect(i).to.equal("eagle")
      })
      it("should support searching within a range", () => {
        const data = ["dark", "bottle", "cat", "dog", "egg", "dodge"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "d", 4, 2)
        expect(i).to.equal("dog")
      })
      it("should support a negative stop index", () => {
        const data = ["dark", "bottle", "cat", "dog", "egg", "dodge"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "d", 4, -4)
        expect(i).to.equal("dog")
      })
      it("should wrap around if start < stop", () => {
        const data = ["dark", "bottle", "cat", "dog", "egg", "dodge"]
        const i = ArrayExt.findLastValue(data, v => v[0] === "e", 2, 4)
        expect(i).to.equal("egg")
      })
    })
    describe("lowerBound()", () => {
      it("should return the index of the first element `>=` a value", () => {
        const data = [1, 2, 2, 3, 3, 4, 5, 5]
        const cmp = (a: number, b: number) => a - b
        const r1 = ArrayExt.lowerBound(data, -5, cmp)
        const r2 = ArrayExt.lowerBound(data, 0, cmp)
        const r3 = ArrayExt.lowerBound(data, 3, cmp)
        const r4 = ArrayExt.lowerBound(data, 5, cmp)
        expect(r1).to.equal(0)
        expect(r2).to.equal(0)
        expect(r3).to.equal(3)
        expect(r4).to.equal(6)
      })
      it("should return `length` if there is no matching value", () => {
        const data = [1, 2, 2, 3, 3, 4, 5, 5]
        const cmp = (a: number, b: number) => a - b
        const r1 = ArrayExt.lowerBound(data, 9, cmp)
        const r2 = ArrayExt.lowerBound(data, 19, cmp)
        const r3 = ArrayExt.lowerBound(data, 29, cmp)
        expect(r1).to.equal(8)
        expect(r2).to.equal(8)
        expect(r3).to.equal(8)
      })
      it("should return `0` if the array is empty", () => {
        const data: number[] = []
        const cmp = (a: number, b: number) => a - b
        const i = ArrayExt.lowerBound(data, 0, cmp)
        expect(i).to.equal(0)
      })
      it("should support searching a range", () => {
        const data = [4, 5, 6, 4, 5, 6]
        const cmp = (a: number, b: number) => a - b
        const r = ArrayExt.lowerBound(data, 5, cmp, 3, 5)
        expect(r).to.equal(4)
      })
    })
    describe("upperBound()", () => {
      it("should return the index of the first element `>` a value", () => {
        const data = [1, 2, 2, 3, 3, 4, 5, 5]
        const cmp = (a: number, b: number) => a - b
        const r1 = ArrayExt.upperBound(data, -5, cmp)
        const r2 = ArrayExt.upperBound(data, 0, cmp)
        const r3 = ArrayExt.upperBound(data, 2, cmp)
        const r4 = ArrayExt.upperBound(data, 3, cmp)
        expect(r1).to.equal(0)
        expect(r2).to.equal(0)
        expect(r3).to.equal(3)
        expect(r4).to.equal(5)
      })
      it("should return `length` if there is no matching value", () => {
        const data = [1, 2, 2, 3, 3, 4, 5, 5]
        const cmp = (a: number, b: number) => a - b
        const r1 = ArrayExt.upperBound(data, 9, cmp)
        const r2 = ArrayExt.upperBound(data, 19, cmp)
        const r3 = ArrayExt.upperBound(data, 29, cmp)
        expect(r1).to.equal(8)
        expect(r2).to.equal(8)
        expect(r3).to.equal(8)
      })
      it("should return `0` if the array is empty", () => {
        const data: number[] = []
        const cmp = (a: number, b: number) => a - b
        const i = ArrayExt.upperBound(data, 0, cmp)
        expect(i).to.equal(0)
      })
      it("should support searching a range", () => {
        const data = [4, 5, 6, 4, 5, 6]
        const cmp = (a: number, b: number) => a - b
        const r = ArrayExt.upperBound(data, 5, cmp, 3, 5)
        expect(r).to.equal(5)
      })
    })
    describe("move()", () => {
      it("should move an element from one index to another", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.move(data, 1, 3)
        ArrayExt.move(data, 4, 0)
        expect(data).to.deep.equal([5, 1, 3, 4, 2])
      })
      it("should be a no-op for equal indices", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.move(data, 2, 2)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
      })
      it("should be a no-op for an array length `<= 1`", () => {
        const data1 = [1]
        const data2: any[] = []
        ArrayExt.move(data1, 0, 0)
        ArrayExt.move(data2, 0, 0)
        expect(data1).to.deep.equal([1])
        expect(data2).to.deep.equal([])
      })
    })
    describe("reverse()", () => {
      it("should reverse an array in-place", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.reverse(data)
        expect(data).to.deep.equal([5, 4, 3, 2, 1])
      })
      it("should support reversing a section of an array", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.reverse(data, 2)
        expect(data).to.deep.equal([1, 2, 5, 4, 3])
        ArrayExt.reverse(data, 0, 3)
        expect(data).to.deep.equal([4, 5, 2, 1, 3])
      })
      it("should be a no-op if `start >= stop`", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.reverse(data, 2, 2)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
        ArrayExt.reverse(data, 4, 2)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
      })
      it("should be a no-op for an array length `<= 1`", () => {
        const data1 = [1]
        const data2: any[] = []
        ArrayExt.reverse(data1)
        ArrayExt.reverse(data2)
        expect(data1).to.deep.equal([1])
        expect(data2).to.deep.equal([])
      })
    })
    describe("rotate()", () => {
      it("should rotate the elements left by a positive delta", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.rotate(data, 2)
        expect(data).to.deep.equal([3, 4, 5, 1, 2])
        ArrayExt.rotate(data, 12)
        expect(data).to.deep.equal([5, 1, 2, 3, 4])
      })
      it("should rotate the elements right by a negative delta", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.rotate(data, -2)
        expect(data).to.deep.equal([4, 5, 1, 2, 3])
        ArrayExt.rotate(data, -12)
        expect(data).to.deep.equal([2, 3, 4, 5, 1])
      })
      it("should be a no-op for a zero delta", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.rotate(data, 0)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
      })
      it("should be a no-op for a array length `<= 1`", () => {
        const data1 = [1]
        const data2: any[] = []
        ArrayExt.rotate(data1, 1)
        ArrayExt.rotate(data2, 1)
        expect(data1).to.deep.equal([1])
        expect(data2).to.deep.equal([])
      })
      it("should rotate a section of the array", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.rotate(data, 2, 1, 3)
        expect(data).to.deep.equal([1, 4, 2, 3, 5])
        ArrayExt.rotate(data, -2, 0, 3)
        expect(data).to.deep.equal([2, 3, 1, 4, 5])
      })
      it("should be a no-op if `start >= stop`", () => {
        const data = [1, 2, 3, 4, 5]
        ArrayExt.rotate(data, 2, 5, 4)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
      })
    })
    describe("fill()", () => {
      it("should fill an array with a static value", () => {
        const data = [0, 0, 0, 0, 0]
        ArrayExt.fill(data, 1)
        expect(data).to.deep.equal([1, 1, 1, 1, 1])
      })
      it("should fill a section of the array", () => {
        const data = [0, 0, 0, 0, 0]
        ArrayExt.fill(data, 1, 1, 3)
        expect(data).to.deep.equal([0, 1, 1, 1, 0])
      })
      it("should wrap around if `stop < start`", () => {
        const data = [0, 0, 0, 0, 0]
        ArrayExt.fill(data, 1, 3, 1)
        expect(data).to.deep.equal([1, 1, 0, 1, 1])
      })
    })
    describe("insert()", () => {
      it("should insert a value at the specified index", () => {
        const data: number[] = []
        ArrayExt.insert(data, 0, 9)
        expect(data).to.deep.equal([9])
        ArrayExt.insert(data, 0, 8)
        expect(data).to.deep.equal([8, 9])
        ArrayExt.insert(data, 0, 7)
        expect(data).to.deep.equal([7, 8, 9])
        ArrayExt.insert(data, -2, 6)
        expect(data).to.deep.equal([7, 6, 8, 9])
        ArrayExt.insert(data, 2, 5)
        expect(data).to.deep.equal([7, 6, 5, 8, 9])
        ArrayExt.insert(data, -5, 4)
        expect(data).to.deep.equal([4, 7, 6, 5, 8, 9])
      })
      it("should clamp the index to the bounds of the vector", () => {
        const data: number[] = []
        ArrayExt.insert(data, -10, 9)
        expect(data).to.deep.equal([9])
        ArrayExt.insert(data, -5, 8)
        expect(data).to.deep.equal([8, 9])
        ArrayExt.insert(data, -1, 7)
        expect(data).to.deep.equal([8, 7, 9])
        ArrayExt.insert(data, 13, 6)
        expect(data).to.deep.equal([8, 7, 9, 6])
        ArrayExt.insert(data, 8, 4)
        expect(data).to.deep.equal([8, 7, 9, 6, 4])
      })
    })
    describe("removeAt()", () => {
      it("should remove the value at a specified index", () => {
        const data = [7, 4, 8, 5, 9, 6]
        expect(ArrayExt.removeAt(data, 1)).to.equal(4)
        expect(data).to.deep.equal([7, 8, 5, 9, 6])
        expect(ArrayExt.removeAt(data, 2)).to.equal(5)
        expect(data).to.deep.equal([7, 8, 9, 6])
        expect(ArrayExt.removeAt(data, -2)).to.equal(9)
        expect(data).to.deep.equal([7, 8, 6])
        expect(ArrayExt.removeAt(data, 0)).to.equal(7)
        expect(data).to.deep.equal([8, 6])
        expect(ArrayExt.removeAt(data, -1)).to.equal(6)
        expect(data).to.deep.equal([8])
        expect(ArrayExt.removeAt(data, 0)).to.equal(8)
        expect(data).to.deep.equal([])
      })
      it("should return `undefined` if the index is out of range", () => {
        const data = [7, 4, 8, 5, 9, 6]
        expect(ArrayExt.removeAt(data, 10)).to.equal(undefined)
        expect(data).to.deep.equal([7, 4, 8, 5, 9, 6])
        expect(ArrayExt.removeAt(data, -12)).to.equal(undefined)
        expect(data).to.deep.equal([7, 4, 8, 5, 9, 6])
      })
    })
    describe("removeFirstOf()", () => {
      it("should remove the first occurrence of a value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeFirstOf(data, "one")
        expect(i).to.equal(0)
        expect(data).to.deep.equal(["two", "three", "four", "one"])
      })
      it("should return `-1` if there is no matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeFirstOf(data, "five")
        expect(i).to.equal(-1)
        expect(data).to.deep.equal(["one", "two", "three", "four", "one"])
      })
      it("should return `-1` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.removeFirstOf(data, "five")
        expect(i).to.equal(-1)
        expect(data).to.deep.equal([])
      })
      it("should support searching from a start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeFirstOf(data, "one", 2)
        expect(i).to.equal(4)
        expect(data).to.deep.equal(["one", "two", "three", "four"])
      })
      it("should support a negative start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeFirstOf(data, "one", -2)
        expect(i).to.equal(4)
        expect(data).to.deep.equal(["one", "two", "three", "four"])
      })
      it("should support searching within a range", () => {
        const data = ["three", "two", "three", "four", "one"]
        const i = ArrayExt.removeFirstOf(data, "three", 1, 3)
        expect(i).to.equal(2)
        expect(data).to.deep.equal(["three", "two", "four", "one"])
      })
      it("should support a negative stop index", () => {
        const data = ["three", "two", "three", "four", "three"]
        const i = ArrayExt.removeFirstOf(data, "three", 1, -2)
        expect(i).to.equal(2)
        expect(data).to.deep.equal(["three", "two", "four", "three"])
      })
      it("should wrap around if stop < start", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeFirstOf(data, "two", 3, 1)
        expect(i).to.equal(1)
        expect(data).to.deep.equal(["one", "three", "four", "one"])
      })
    })
    describe("removeLastOf()", () => {
      it("should remove the last occurrence of a value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeLastOf(data, "one")
        expect(i).to.equal(4)
        expect(data).to.deep.equal(["one", "two", "three", "four"])
      })
      it("should return `-1` if there is no matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeLastOf(data, "five")
        expect(i).to.equal(-1)
        expect(data).to.deep.equal(["one", "two", "three", "four", "one"])
      })
      it("should return `-1` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.removeLastOf(data, "five")
        expect(i).to.equal(-1)
        expect(data).to.deep.equal([])
      })
      it("should support searching from a start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeLastOf(data, "one", 2)
        expect(i).to.equal(0)
        expect(data).to.deep.equal(["two", "three", "four", "one"])
      })
      it("should support a negative start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeLastOf(data, "one", -2)
        expect(i).to.equal(0)
        expect(data).to.deep.equal(["two", "three", "four", "one"])
      })
      it("should support searching within a range", () => {
        const data = ["three", "two", "three", "four", "one"]
        const i = ArrayExt.removeLastOf(data, "three", 3, 1)
        expect(i).to.equal(2)
        expect(data).to.deep.equal(["three", "two", "four", "one"])
      })
      it("should support a negative stop index", () => {
        const data = ["three", "two", "three", "four", "three"]
        const i = ArrayExt.removeLastOf(data, "three", 3, -4)
        expect(i).to.equal(2)
        expect(data).to.deep.equal(["three", "two", "four", "three"])
      })
      it("should wrap around if start < stop", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeLastOf(data, "two", 3, 1)
        expect(i).to.equal(1)
        expect(data).to.deep.equal(["one", "three", "four", "one"])
      })
    })
    describe("removeAllOf()", () => {
      it("should remove all occurrences of a value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeAllOf(data, "one")
        expect(i).to.equal(2)
        expect(data).to.deep.equal(["two", "three", "four"])
      })
      it("should return `0` if there is no matching value", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeAllOf(data, "five")
        expect(i).to.equal(0)
        expect(data).to.deep.equal(["one", "two", "three", "four", "one"])
      })
      it("should return `0` if the array is empty", () => {
        const data: string[] = []
        const i = ArrayExt.removeAllOf(data, "five")
        expect(i).to.equal(0)
        expect(data).to.deep.equal([])
      })
      it("should support searching from a start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeAllOf(data, "one", 2)
        expect(i).to.equal(1)
        expect(data).to.deep.equal(["one", "two", "three", "four"])
      })
      it("should support a negative start index", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeAllOf(data, "one", -2)
        expect(i).to.equal(1)
        expect(data).to.deep.equal(["one", "two", "three", "four"])
      })
      it("should support searching within a range", () => {
        const data = ["three", "two", "three", "four", "one"]
        const i = ArrayExt.removeAllOf(data, "three", 1, 3)
        expect(i).to.equal(1)
        expect(data).to.deep.equal(["three", "two", "four", "one"])
      })
      it("should support a negative stop index", () => {
        const data = ["three", "two", "three", "four", "three"]
        const i = ArrayExt.removeAllOf(data, "three", 1, -2)
        expect(i).to.equal(1)
        expect(data).to.deep.equal(["three", "two", "four", "three"])
      })
      it("should wrap around if start < stop", () => {
        const data = ["one", "two", "three", "four", "one"]
        const i = ArrayExt.removeAllOf(data, "one", 3, 1)
        expect(i).to.equal(2)
        expect(data).to.deep.equal(["two", "three", "four"])
      })
    })
    describe("removeFirstWhere()", () => {
      it("should remove the first occurrence of a value", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0)
        expect(result.index).to.equal(1)
        expect(result.value).to.equal(2)
        expect(data).to.deep.equal([1, 3, 4, 5])
      })
      it("should return `-1` if there is no matching value", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 7 === 0)
        expect(result.index).to.equal(-1)
        expect(result.value).to.equal(undefined)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
      })
      it("should return `-1` if the array is empty", () => {
        const data: number[] = []
        const result = ArrayExt.removeFirstWhere(data, v => v % 7 === 0)
        expect(result.index).to.equal(-1)
        expect(result.value).to.equal(undefined)
        expect(data).to.deep.equal([])
      })
      it("should support searching from a start index", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should support a negative start index", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, -3)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should support searching within a range", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2, 4)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should support a negative stop index", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 2, -2)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should wrap around if stop < start", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeFirstWhere(data, v => v % 2 === 0, 4, 2)
        expect(result.index).to.equal(1)
        expect(result.value).to.equal(2)
        expect(data).to.deep.equal([1, 3, 4, 5])
      })
    })
    describe("removeLastWhere()", () => {
      it("should remove the last occurrence of a value", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 2 === 0)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should return `-1` if there is no matching value", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 7 === 0)
        expect(result.index).to.equal(-1)
        expect(result.value).to.equal(undefined)
        expect(data).to.deep.equal([1, 2, 3, 4, 5])
      })
      it("should return `-1` if the array is empty", () => {
        const data: number[] = []
        const result = ArrayExt.removeLastWhere(data, v => v % 7 === 0)
        expect(result.index).to.equal(-1)
        expect(result.value).to.equal(undefined)
        expect(data).to.deep.equal([])
      })
      it("should support searching from a start index", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 2)
        expect(result.index).to.equal(1)
        expect(result.value).to.equal(2)
        expect(data).to.deep.equal([1, 3, 4, 5])
      })
      it("should support a negative start index", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, -3)
        expect(result.index).to.equal(1)
        expect(result.value).to.equal(2)
        expect(data).to.deep.equal([1, 3, 4, 5])
      })
      it("should support searching within a range", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 4, 2)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should support a negative stop index", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 4, -4)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
      it("should wrap around if start < stop", () => {
        const data = [1, 2, 3, 4, 5]
        const result = ArrayExt.removeLastWhere(data, v => v % 2 === 0, 0, 2)
        expect(result.index).to.equal(3)
        expect(result.value).to.equal(4)
        expect(data).to.deep.equal([1, 2, 3, 5])
      })
    })
    describe("removeAllWhere()", () => {
      it("should remove all occurrences of a value", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 3 === 0)
        expect(count).to.equal(2)
        expect(data).to.deep.equal([1, 2, 4, 5, 1])
      })
      it("should return `0` if there is no matching value", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 7 === 0)
        expect(count).to.equal(0)
        expect(data).to.deep.equal([1, 2, 3, 4, 3, 5, 1])
      })
      it("should return `0` if the array is empty", () => {
        const data: number[] = []
        const count = ArrayExt.removeAllWhere(data, v => v % 7 === 0)
        expect(count).to.equal(0)
        expect(data).to.deep.equal([])
      })
      it("should support searching from a start index", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3)
        expect(count).to.equal(1)
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1])
      })
      it("should support a negative start index", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, -4)
        expect(count).to.equal(1)
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1])
      })
      it("should support searching within a range", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3, 5)
        expect(count).to.equal(1)
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1])
      })
      it("should support a negative stop index", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 3, -2)
        expect(count).to.equal(1)
        expect(data).to.deep.equal([1, 2, 3, 4, 5, 1])
      })
      it("should wrap around if start < stop", () => {
        const data = [1, 2, 3, 4, 3, 5, 1]
        const count = ArrayExt.removeAllWhere(data, v => v % 3 === 0, 5, 3)
        expect(count).to.equal(1)
        expect(data).to.deep.equal([1, 2, 4, 3, 5, 1])
      })
    })
  })
})
import { chain } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("chain()", () => {
    testIterator(() => {
      const it = chain([1, 2, 3], [4], [5, 6])
      const expected = [1, 2, 3, 4, 5, 6]
      return [it, expected]
    })
  })
  describe("ChainIterator", () => {
    testIterator(() => {
      const a = [1, 2, 3]
      const b = ["four", "five"]
      const c = [true, false][Symbol.iterator]()
      type T = number | string | boolean
      const it = chain<T>(a, b, c)
      const expected = [1, 2, 3, "four", "five", true, false]
      return [it, expected]
    })
  })
})
import { empty } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("empty()", () => {
    testIterator(() => {
      return [empty(), []]
    })
  })
})
import { filter } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("filter()", () => {
    testIterator(() => {
      const expected = [0, 2, 4]
      const data = [0, 1, 2, 3, 4, 5]
      const it = filter(data, n => n % 2 === 0)
      return [it, expected]
    })
  })
  describe("filter()", () => {
    testIterator(() => {
      const expected = [1, 3, 5]
      const data = [0, 1, 2, 3, 4, 5][Symbol.iterator]()
      const it = filter(data, n => n % 2 !== 0)
      return [it, expected]
    })
  })
})
import { expect } from "chai"
import { find, max, min, minmax } from "../../src/lumino/algorithm"
describe("../../src/lumino/algorithm", () => {
  describe("find()", () => {
    it("should find the first matching value", () => {
      interface IAnimal {
        species: string
        name: string
      }
      const isCat = (value: IAnimal) => value.species === "cat"
      const data: IAnimal[] = [
        { species: "dog", name: "spot" },
        { species: "cat", name: "fluffy" },
        { species: "alligator", name: "pocho" },
      ]
      expect(find(data, isCat)).to.equal(data[1])
    })
    it("should return `undefined` if there is no matching value", () => {
      interface IAnimal {
        species: string
        name: string
      }
      const isRacoon = (value: IAnimal) => value.species === "racoon"
      const data: IAnimal[] = [
        { species: "dog", name: "spot" },
        { species: "cat", name: "fluffy" },
        { species: "alligator", name: "pocho" },
      ]
      expect(find(data, isRacoon)).to.equal(undefined)
    })
  })
  describe("min()", () => {
    it("should return the minimum value in an iterable", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 },
      ]
      const score = min(data, (a, b) => a.value - b.value)
      expect(score).to.equal(data[1])
    })
    it("should not invoke the comparator for only one value", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = [{ value: 19 }]
      let called = false
      const score = min(data, (a, b) => {
        called = true
        return a.value - b.value
      })
      expect(score).to.equal(data[0])
      expect(called).to.equal(false)
    })
    it("should return `undefined` if the iterable is empty", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = []
      const score = min(data, (a, b) => a.value - b.value)
      expect(score).to.equal(undefined)
    })
  })
  describe("max()", () => {
    it("should return the maximum value in an iterable", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 },
      ]
      const score = max(data, (a, b) => a.value - b.value)
      expect(score).to.equal(data[3])
    })
    it("should not invoke the comparator for only one value", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = [{ value: 19 }]
      let called = false
      const score = max(data, (a, b) => {
        called = true
        return a.value - b.value
      })
      expect(score).to.equal(data[0])
      expect(called).to.equal(false)
    })
    it("should return `undefined` if the iterable is empty", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = []
      const score = max(data, (a, b) => a.value - b.value)
      expect(score).to.equal(undefined)
    })
  })
  describe("minmax()", () => {
    it("should return the minimum and maximum value in an iterable", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = [
        { value: 19 },
        { value: -2 },
        { value: 0 },
        { value: 42 },
      ]
      const [rmin, rmax] = minmax(data, (a, b) => a.value - b.value)!
      expect(rmin).to.equal(data[1])
      expect(rmax).to.equal(data[3])
    })
    it("should not invoke the comparator for only one value", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = [{ value: 19 }]
      let called = false
      const [rmin, rmax] = minmax(data, (a, b) => {
        called = true
        return a.value - b.value
      })!
      expect(rmin).to.equal(data[0])
      expect(rmax).to.equal(data[0])
      expect(called).to.equal(false)
    })
    it("should return `undefined` if the iterable is empty", () => {
      interface IScore {
        value: number
      }
      const data: IScore[] = []
      const score = minmax(data, (a, b) => a.value - b.value)
      expect(score).to.equal(undefined)
    })
  })
})
import "./array.spec"
import "./chain.spec"
import "./empty.spec"
import "./filter.spec"
import "./find.spec"
import "./iter.spec"
import "./map.spec"
import "./range.spec"
import "./reduce.spec"
import "./repeat.spec"
import "./retro.spec"
import "./sort.spec"
import "./stride.spec"
import "./string.spec"
import "./take.spec"
import "./zip.spec"
import { expect } from "chai"
import {
  each,
  every,
  some,
  toArray,
  toObject,
  zip,
} from "../../src/lumino/algorithm"
export function testIterator<T>(
  factory: () => [IterableIterator<T>, T[]],
  name = ""
): void {
  describe(`yield ${name}`, () => {
    it("should return the same values in the iterator", () => {
      const [it, results] = factory()
      expect(Array.from(it)).to.deep.equal(results)
    })
  })
}
describe("../../src/lumino/algorithm", () => {
  describe("toArray()", () => {
    it("should create an array from an iterable", () => {
      const data = [1, 2, 3, 4, 5, 6]
      const stream = data[Symbol.iterator]()
      const result = toArray(stream)
      expect(result).to.deep.equal([1, 2, 3, 4, 5, 6])
    })
  })
  describe("toObject()", () => {
    it("should create an object from a [key, value] iterable", () => {
      const keys = ["one", "two", "three"]
      const values = [1, 2, 3]
      const stream = zip<string | number>(keys, values)
      const result = toObject(stream as Iterable<[string, number]>)
      expect(result).to.deep.equal({ one: 1, two: 2, three: 3 })
    })
  })
  describe("each()", () => {
    it("should visit every item in an iterable", () => {
      let result = 0
      const data = [1, 2, 3, 4, 5]
      each(data, x => {
        result += x
      })
      expect(result).to.equal(15)
    })
    it("should break early if the callback returns `false`", () => {
      let result = 0
      const data = [1, 2, 3, 4, 5]
      each(data, x => {
        if (x > 3) {
          return false
        }
        result += x
        return true
      })
      expect(result).to.equal(6)
    })
  })
  describe("every()", () => {
    it("should verify all items in an iterable satisfy a condition", () => {
      const data = [1, 2, 3, 4, 5]
      const valid = every(data, x => x > 0)
      const invalid = every(data, x => x > 4)
      expect(valid).to.equal(true)
      expect(invalid).to.equal(false)
    })
  })
  describe("some()", () => {
    it("should verify some items in an iterable satisfy a condition", () => {
      const data = [1, 2, 3, 4, 5]
      const valid = some(data, x => x > 4)
      const invalid = some(data, x => x < 0)
      expect(valid).to.equal(true)
      expect(invalid).to.equal(false)
    })
  })
})
import { map } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("map()", () => {
    testIterator(() => {
      const result = [0, 1, 4, 9, 16, 25]
      const it = map([0, 1, 2, 3, 4, 5], x => x ** 2)
      return [it, result]
    })
  })
})
import { range } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("range()", () => {
    describe("single argument form", () => {
      testIterator(() => {
        return [range(3), [0, 1, 2]]
      })
    })
    describe("two argument form", () => {
      testIterator(() => {
        return [range(4, 7), [4, 5, 6]]
      })
    })
    describe("three argument form", () => {
      testIterator(() => {
        return [range(4, 11, 3), [4, 7, 10]]
      })
    })
    describe("negative step", () => {
      testIterator(() => {
        return [range(3, 0, -1), [3, 2, 1]]
      })
    })
    describe("zero effective length", () => {
      testIterator(() => {
        return [range(0, 10, -1), []]
      })
    })
  })
})
import { expect } from "chai"
import { reduce } from "../../src/lumino/algorithm"
describe("../../src/lumino/algorithm", () => {
  describe("reduce()", () => {
    it("should reduce items in an iterable into an accumulated value", () => {
      const sum = reduce([1, 2, 3, 4, 5], (a, x) => a + x, 0)
      expect(sum).to.equal(15)
    })
    it("should throw if iterable is empty and initial value is undefined", () => {
      const data: Array<number> = []
      const reduced = () => reduce(data, (a, x) => a + x)
      expect(reduced).to.throw(TypeError)
    })
    it("should return the initial value if the iterable is empty", () => {
      const data: Array<number> = []
      const result = reduce(data, (a, x) => a + x, 0)
      expect(result).to.equal(0)
    })
    it("should return the first item if the iterable has just one item with no initial value", () => {
      const data = [9]
      const result = reduce(data, (a, x) => a + x)
      expect(result).to.equal(9)
    })
    it("should invoke the reducer if the iterable has just one item with an initial value", () => {
      const data = [9]
      const result = reduce(data, (a, x) => a + x, 1)
      expect(result).to.equal(10)
    })
    it("should invoke the reducer if the iterable has just two items with no initial value", () => {
      const data = [1, 2]
      const result = reduce(data, (a, x) => a + x)
      expect(result).to.equal(3)
    })
  })
})
import { once, repeat } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("repeat()", () => {
    testIterator(() => {
      return [repeat("foo", 3), ["foo", "foo", "foo"]]
    })
  })
  describe("once()", () => {
    testIterator(() => {
      return [once("foo"), ["foo"]]
    })
  })
})
import { expect } from "chai"
import { retro } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("retro()", () => {
    it("should create an iterator for an array-like object", () => {
      expect(Array.from(retro([0, 1, 2, 3]))).to.deep.equal([3, 2, 1, 0])
    })
    it("should call `retro` on a retroable", () => {
      const data = [1, 2, 3, 4]
      const retroable = { retro: () => retro(data) }
      testIterator(() => [retro(retroable), data.slice().reverse()], "retro")
    })
    it("should reverse an array", () => {
      testIterator(() => {
        return [retro([1, 2, 3]), [3, 2, 1]]
      })
    })
  })
})
import { expect } from "chai"
import { topologicSort } from "../../src/lumino/algorithm"
describe("../../src/lumino/algorithm", () => {
  describe("topologicSort()", () => {
    it("should correctly order the input", () => {
      const data: Array<[string, string]> = [
        ["a", "b"],
        ["b", "c"],
        ["c", "d"],
        ["d", "e"],
      ]
      const result = topologicSort(data)
      expect(result).to.deep.equal(["a", "b", "c", "d", "e"])
    })
    it("should correctly order shuffled input", () => {
      const data: Array<[string, string]> = [
        ["d", "e"],
        ["c", "d"],
        ["a", "b"],
        ["b", "c"],
      ]
      const result = topologicSort(data)
      expect(result).to.deep.equal(["a", "b", "c", "d", "e"])
    })
    it("should return an approximate order when a cycle is present", () => {
      const data: Array<[string, string]> = [
        ["a", "b"],
        ["b", "c"],
        ["c", "d"],
        ["c", "b"],
        ["d", "e"],
      ]
      const result = topologicSort(data)
      expect(result.indexOf("a")).to.equal(0)
      expect(result.indexOf("e")).to.equal(4)
      expect(result.indexOf("b")).to.be.greaterThan(0).lessThan(4)
      expect(result.indexOf("c")).to.be.greaterThan(0).lessThan(4)
      expect(result.indexOf("d")).to.be.greaterThan(0).lessThan(4)
    })
    it("should return a valid order when under-constrained", () => {
      const data: Array<[string, string]> = [
        ["a", "b"],
        ["a", "c"],
        ["a", "d"],
        ["a", "e"],
      ]
      const result = topologicSort(data)
      expect(result.indexOf("a")).to.equal(0)
      expect(result.indexOf("b")).to.be.greaterThan(0)
      expect(result.indexOf("c")).to.be.greaterThan(0)
      expect(result.indexOf("d")).to.be.greaterThan(0)
      expect(result.indexOf("e")).to.be.greaterThan(0)
    })
  })
})
import { stride } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("stride() with an array", () => {
    testIterator(() => {
      return [stride([0, 1, 2, 3, 4, 5], 2), [0, 2, 4]]
    })
  })
  describe("stride() with an iterable iterator", () => {
    testIterator(() => {
      const it = [1, 2, 3, 4, 5, 6, 7][Symbol.iterator]()
      return [stride(it, 3), [1, 4, 7]]
    })
  })
})
import { expect } from "chai"
import { StringExt } from "../../src/lumino/algorithm"
describe("../../src/lumino/algorithm", () => {
  describe("StringExt", () => {
    describe("findIndices()", () => {
      it("should find the indices of the matching characters", () => {
        const r1 = StringExt.findIndices("Foo Bar Baz", "Faa")!
        const r2 = StringExt.findIndices("Foo Bar Baz", "oBz")!
        const r3 = StringExt.findIndices("Foo Bar Baz", "r B")!
        expect(r1).to.deep.equal([0, 5, 9])
        expect(r2).to.deep.equal([1, 4, 10])
        expect(r3).to.deep.equal([6, 7, 8])
      })
      it("should return `null` if no match is found", () => {
        const r1 = StringExt.findIndices("Foo Bar Baz", "faa")
        const r2 = StringExt.findIndices("Foo Bar Baz", "obz")
        const r3 = StringExt.findIndices("Foo Bar Baz", "raB")
        expect(r1).to.equal(null)
        expect(r2).to.equal(null)
        expect(r3).to.equal(null)
      })
    })
    describe("matchSumOfSquares()", () => {
      it("should score the match using the sum of squared distances", () => {
        const r1 = StringExt.matchSumOfSquares("Foo Bar Baz", "Faa")!
        const r2 = StringExt.matchSumOfSquares("Foo Bar Baz", "oBz")!
        const r3 = StringExt.matchSumOfSquares("Foo Bar Baz", "r B")!
        expect(r1.score).to.equal(106)
        expect(r1.indices).to.deep.equal([0, 5, 9])
        expect(r2.score).to.equal(117)
        expect(r2.indices).to.deep.equal([1, 4, 10])
        expect(r3.score).to.equal(149)
        expect(r3.indices).to.deep.equal([6, 7, 8])
      })
      it("should return `null` if no match is found", () => {
        const r1 = StringExt.matchSumOfSquares("Foo Bar Baz", "faa")
        const r2 = StringExt.matchSumOfSquares("Foo Bar Baz", "obz")
        const r3 = StringExt.matchSumOfSquares("Foo Bar Baz", "raB")
        expect(r1).to.equal(null)
        expect(r2).to.equal(null)
        expect(r3).to.equal(null)
      })
    })
    describe("matchSumOfDeltas()", () => {
      it("should score the match using the sum of deltas distances", () => {
        const r1 = StringExt.matchSumOfDeltas("Foo Bar Baz", "Frz")!
        const r2 = StringExt.matchSumOfDeltas("Foo Bar Baz", "rBa")!
        const r3 = StringExt.matchSumOfDeltas("Foo Bar Baz", "oar")!
        expect(r1.score).to.equal(8)
        expect(r1.indices).to.deep.equal([0, 6, 10])
        expect(r2.score).to.equal(7)
        expect(r2.indices).to.deep.equal([6, 8, 9])
        expect(r3.score).to.equal(4)
        expect(r3.indices).to.deep.equal([1, 5, 6])
      })
      it("should return `null` if no match is found", () => {
        const r1 = StringExt.matchSumOfDeltas("Foo Bar Baz", "cce")
        const r2 = StringExt.matchSumOfDeltas("Foo Bar Baz", "ar3")
        const r3 = StringExt.matchSumOfDeltas("Foo Bar Baz", "raB")
        expect(r1).to.equal(null)
        expect(r2).to.equal(null)
        expect(r3).to.equal(null)
      })
    })
    describe("highlight()", () => {
      it("should interpolate text with highlight results", () => {
        const mark = (chunk: string) => `<mark>${chunk}</mark>`
        const r1 = StringExt.findIndices("Foo Bar Baz", "Faa")!
        const r2 = StringExt.findIndices("Foo Bar Baz", "oBz")!
        const r3 = StringExt.findIndices("Foo Bar Baz", "r B")!
        const h1 = StringExt.highlight("Foo Bar Baz", r1, mark).join("")
        const h2 = StringExt.highlight("Foo Bar Baz", r2, mark).join("")
        const h3 = StringExt.highlight("Foo Bar Baz", r3, mark).join("")
        expect(h1).to.equal(
          "<mark>F</mark>oo B<mark>a</mark>r B<mark>a</mark>z"
        )
        expect(h2).to.equal(
          "F<mark>o</mark>o <mark>B</mark>ar Ba<mark>z</mark>"
        )
        expect(h3).to.equal("Foo Ba<mark>r B</mark>az")
      })
    })
  })
})
import { take } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("take() from an array", () => {
    testIterator(() => {
      return [take([1, 2, 3, 4, 5], 2), [1, 2]]
    })
  })
  describe("take() from an iterable iterator", () => {
    testIterator(() => {
      return [take([0, 1, 2, 3], 1), [0]]
    })
  })
  describe("take() with count=0", () => {
    testIterator(() => [take([0, 1, 2, 3], 0), []])
  })
  describe("take() only takes as many as count or are left", () => {
    const it = [0, 1, 2, 3, 4, 5, 6][Symbol.iterator]()
    testIterator(() => [take(it, 2), [0, 1]])
    testIterator(() => [take(it, 4), [2, 3, 4, 5]])
    testIterator(() => [take(it, 25), [6]])
  })
})
import { zip } from "../../src/lumino/algorithm"
import { testIterator } from "./iter.spec"
describe("../../src/lumino/algorithm", () => {
  describe("zip() with same-length iterables", () => {
    testIterator(() => {
      return [
        zip([1, 2, 3], [4, 5, 6]),
        [
          [1, 4],
          [2, 5],
          [3, 6],
        ],
      ]
    })
  })
  describe("zip() with different-length iterables", () => {
    testIterator(() => {
      const i1 = ["one", "two", "three", "four"]
      const i2 = [true, false, true]
      const i3 = [1, 2, 3, 4]
      type T = string | boolean | number
      const it = zip<T>(i1, i2, i3)
      const results = [
        ["one", true, 1],
        ["two", false, 2],
        ["three", true, 3],
      ]
      return [it, results]
    })
  })
})
