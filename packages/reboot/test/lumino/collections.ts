import "./linkedlist.spec"
import { find, map } from "../../src/lumino/algorithm.js"
import { LinkedList } from "../../src/lumino/collections.js"
describe("../../src/lumino/collections", () => {
  describe("LinkedList", () => {
    describe("#constructor()", () => {
      const list = new LinkedList<number>()
      expect(list).to.be.an.instanceof(LinkedList)
    })
    describe("#isEmpty", () => {
      it("should be `true` for an empty list", () => {
        const list = new LinkedList<number>()
        expect(list.isEmpty).toEqual(true)
      })
      it("should be `false` for a non-empty list", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        expect(list.isEmpty).toEqual(false)
      })
    })
    describe("#length", () => {
      it("should be `0` for an empty list", () => {
        const list = new LinkedList<number>()
        expect(list.length).toEqual(0)
      })
      it("should equal the number of items in a list", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        expect(list.length).toEqual(data.length)
      })
    })
    describe("#first", () => {
      it("should be the first value in the list", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        expect(list.first).toEqual(data[0])
      })
      it("should be `undefined` if the list is empty", () => {
        const list = new LinkedList<number>()
        expect(list.first).toEqual(undefined)
      })
    })
    describe("#last", () => {
      it("should be the last value in the list", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        expect(list.last).toEqual(data[data.length - 1])
      })
      it("should be `undefined` if the list is empty", () => {
        const list = new LinkedList<number>()
        expect(list.last).toEqual(undefined)
      })
    })
    describe("#firstNode", () => {
      it("should be the first node in the list", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        expect(list.firstNode!.value).toEqual(data[0])
      })
      it("should be `null` if the list is empty", () => {
        const list = new LinkedList<number>()
        expect(list.firstNode).toEqual(null)
      })
    })
    describe("#lastNode", () => {
      it("should be the last node in the list", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        expect(list.lastNode!.value).toEqual(data[data.length - 1])
      })
      it("should be `null` if the list is empty", () => {
        const list = new LinkedList<number>()
        expect(list.lastNode).toEqual(null)
      })
    })
    describe("[Symbol.iterator]()", () => {
      it("should return an iterator over the list values", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        const it1 = list[Symbol.iterator]()
        const it2 = list[Symbol.iterator]()
        expect(it1[Symbol.iterator]()).toEqual(it1)
        expect(it2[Symbol.iterator]()).toEqual(it2)
        expect(it1).to.not.equal(it2)
        expect(Array.from(it1)).to.deep.equal(data)
        expect(Array.from(it2)).to.deep.equal(data)
      })
    })
    describe("#retro()", () => {
      it("should return a reverse iterator over the list values", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const reversed = data.slice().reverse()
        const list = LinkedList.from(data)
        const it1 = list.retro()
        const it2 = list.retro()
        expect(it1[Symbol.iterator]()).toEqual(it1)
        expect(it2[Symbol.iterator]()).toEqual(it2)
        expect(it1).to.not.equal(it2)
        expect(Array.from(it1)).to.deep.equal(reversed)
        expect(Array.from(it2)).to.deep.equal(reversed)
      })
    })
    describe("#nodes()", () => {
      it("should return an iterator over the list nodes", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const list = LinkedList.from(data)
        const it1 = list.nodes()
        const it2 = list.nodes()
        const v1 = map(it1, n => n.value)
        const v2 = map(it2, n => n.value)
        expect(it1[Symbol.iterator]()).toEqual(it1)
        expect(it2[Symbol.iterator]()).toEqual(it2)
        expect(it1).to.not.equal(it2)
        expect(Array.from(v1)).to.deep.equal(data)
        expect(Array.from(v2)).to.deep.equal(data)
      })
    })
    describe("#retroNodes()", () => {
      it("should return a reverse iterator over the list nodes", () => {
        const data = [0, 1, 2, 3, 4, 5]
        const reversed = data.slice().reverse()
        const list = LinkedList.from(data)
        const it1 = list.retroNodes()
        const it2 = list.retroNodes()
        const v1 = map(it1, n => n.value)
        const v2 = map(it2, n => n.value)
        expect(it1[Symbol.iterator]()).toEqual(it1)
        expect(it2[Symbol.iterator]()).toEqual(it2)
        expect(it1).to.not.equal(it2)
        expect(Array.from(v1)).to.deep.equal(reversed)
        expect(Array.from(v2)).to.deep.equal(reversed)
      })
    })
    describe("#addFirst()", () => {
      it("should add a value to the beginning of the list", () => {
        const list = new LinkedList<number>()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        const n1 = list.addFirst(99)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(1)
        expect(list.first).toEqual(99)
        expect(list.last).toEqual(99)
        const n2 = list.addFirst(42)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(2)
        expect(list.first).toEqual(42)
        expect(list.last).toEqual(99)
        const n3 = list.addFirst(7)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(3)
        expect(list.first).toEqual(7)
        expect(list.last).toEqual(99)
        expect(Array.from(list)).to.deep.equal([7, 42, 99])
        expect(n1.list).toEqual(list)
        expect(n1.next).toEqual(null)
        expect(n1.prev).toEqual(n2)
        expect(n1.value).toEqual(99)
        expect(n2.list).toEqual(list)
        expect(n2.next).toEqual(n1)
        expect(n2.prev).toEqual(n3)
        expect(n2.value).toEqual(42)
        expect(n3.list).toEqual(list)
        expect(n3.next).toEqual(n2)
        expect(n3.prev).toEqual(null)
        expect(n3.value).toEqual(7)
      })
    })
    describe("#addLast()", () => {
      it("should add a value to the end of the list", () => {
        const list = new LinkedList<number>()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        const n1 = list.addLast(99)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(1)
        expect(list.first).toEqual(99)
        expect(list.last).toEqual(99)
        const n2 = list.addLast(42)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(2)
        expect(list.first).toEqual(99)
        expect(list.last).toEqual(42)
        const n3 = list.addLast(7)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(3)
        expect(list.first).toEqual(99)
        expect(list.last).toEqual(7)
        expect(Array.from(list)).to.deep.equal([99, 42, 7])
        expect(n1.list).toEqual(list)
        expect(n1.next).toEqual(n2)
        expect(n1.prev).toEqual(null)
        expect(n1.value).toEqual(99)
        expect(n2.list).toEqual(list)
        expect(n2.next).toEqual(n3)
        expect(n2.prev).toEqual(n1)
        expect(n2.value).toEqual(42)
        expect(n3.list).toEqual(list)
        expect(n3.next).toEqual(null)
        expect(n3.prev).toEqual(n2)
        expect(n3.value).toEqual(7)
      })
    })
    describe("#insertBefore()", () => {
      it("should insert a value before the given reference node", () => {
        const list = LinkedList.from([0, 1, 2, 3])
        const n1 = find(list.nodes(), n => n.value === 2)!
        const n2 = list.insertBefore(7, n1)
        const n3 = list.insertBefore(8, n2)
        const n4 = list.insertBefore(9, null)
        const n5 = find(list.nodes(), n => n.value === 1)
        const n6 = find(list.nodes(), n => n.value === 0)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(7)
        expect(list.first).toEqual(9)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([9, 0, 1, 8, 7, 2, 3])
        expect(n1.list).toEqual(list)
        expect(n1.next).toEqual(list.lastNode)
        expect(n1.prev).toEqual(n2)
        expect(n1.value).toEqual(2)
        expect(n2.list).toEqual(list)
        expect(n2.next).toEqual(n1)
        expect(n2.prev).toEqual(n3)
        expect(n2.value).toEqual(7)
        expect(n3.list).toEqual(list)
        expect(n3.next).toEqual(n2)
        expect(n3.prev).toEqual(n5)
        expect(n3.value).toEqual(8)
        expect(n4.list).toEqual(list)
        expect(n4.next).toEqual(n6)
        expect(n4.prev).toEqual(null)
        expect(n4.value).toEqual(9)
      })
      it("should throw an error if the reference node is invalid", () => {
        const list1 = LinkedList.from([0, 1, 2, 3])
        const list2 = LinkedList.from([0, 1, 2, 3])
        const insert = () => {
          list2.insertBefore(4, list1.firstNode)
        }
        expect(insert).to.throw(Error)
      })
    })
    describe("#insertAfter()", () => {
      it("should insert a value after the given reference node", () => {
        const list = LinkedList.from([0, 1, 2, 3])
        const n1 = find(list.nodes(), n => n.value === 2)!
        const n2 = list.insertAfter(7, n1)
        const n3 = list.insertAfter(8, n2)
        const n4 = list.insertAfter(9, null)
        const n5 = find(list.nodes(), n => n.value === 1)
        const n6 = find(list.nodes(), n => n.value === 3)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(7)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(9)
        expect(Array.from(list)).to.deep.equal([0, 1, 2, 7, 8, 3, 9])
        expect(n1.list).toEqual(list)
        expect(n1.next).toEqual(n2)
        expect(n1.prev).toEqual(n5)
        expect(n1.value).toEqual(2)
        expect(n2.list).toEqual(list)
        expect(n2.next).toEqual(n3)
        expect(n2.prev).toEqual(n1)
        expect(n2.value).toEqual(7)
        expect(n3.list).toEqual(list)
        expect(n3.next).toEqual(n6)
        expect(n3.prev).toEqual(n2)
        expect(n3.value).toEqual(8)
        expect(n4.list).toEqual(list)
        expect(n4.next).toEqual(null)
        expect(n4.prev).toEqual(n6)
        expect(n4.value).toEqual(9)
      })
      it("should throw an error if the reference node is invalid", () => {
        const list1 = LinkedList.from([0, 1, 2, 3])
        const list2 = LinkedList.from([0, 1, 2, 3])
        const insert = () => {
          list2.insertAfter(4, list1.firstNode)
        }
        expect(insert).to.throw(Error)
      })
    })
    describe("#removeFirst()", () => {
      it("should remove the first value from the list", () => {
        const list = LinkedList.from([0, 1, 2, 3])
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(4)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([0, 1, 2, 3])
        const v1 = list.removeFirst()
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(3)
        expect(list.first).toEqual(1)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([1, 2, 3])
        const v2 = list.removeFirst()
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(2)
        expect(list.first).toEqual(2)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([2, 3])
        const v3 = list.removeFirst()
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(1)
        expect(list.first).toEqual(3)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([3])
        const v4 = list.removeFirst()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        expect(Array.from(list)).to.deep.equal([])
        const v5 = list.removeFirst()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        expect(Array.from(list)).to.deep.equal([])
        expect(v1).toEqual(0)
        expect(v2).toEqual(1)
        expect(v3).toEqual(2)
        expect(v4).toEqual(3)
        expect(v5).toEqual(undefined)
      })
    })
    describe("#removeLast()", () => {
      it("should remove the last value from the list", () => {
        const list = LinkedList.from([0, 1, 2, 3])
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(4)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([0, 1, 2, 3])
        const v1 = list.removeLast()
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(3)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(2)
        expect(Array.from(list)).to.deep.equal([0, 1, 2])
        const v2 = list.removeLast()
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(2)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(1)
        expect(Array.from(list)).to.deep.equal([0, 1])
        const v3 = list.removeLast()
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(1)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(0)
        expect(Array.from(list)).to.deep.equal([0])
        const v4 = list.removeLast()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        expect(Array.from(list)).to.deep.equal([])
        const v5 = list.removeLast()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        expect(Array.from(list)).to.deep.equal([])
        expect(v1).toEqual(3)
        expect(v2).toEqual(2)
        expect(v3).toEqual(1)
        expect(v4).toEqual(0)
        expect(v5).toEqual(undefined)
      })
    })
    describe("#removeNode()", () => {
      it("should remove the specified node from the list", () => {
        const list = LinkedList.from([0, 1, 2, 3])
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(4)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([0, 1, 2, 3])
        const n1 = find(list.nodes(), n => n.value === 2)!
        list.removeNode(n1)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(3)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([0, 1, 3])
        expect(n1.list).toEqual(null)
        expect(n1.next).toEqual(null)
        expect(n1.prev).toEqual(null)
        expect(n1.value).toEqual(2)
        const n2 = find(list.nodes(), n => n.value === 3)!
        list.removeNode(n2)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(2)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(1)
        expect(Array.from(list)).to.deep.equal([0, 1])
        expect(n2.list).toEqual(null)
        expect(n2.next).toEqual(null)
        expect(n2.prev).toEqual(null)
        expect(n2.value).toEqual(3)
        const n3 = find(list.nodes(), n => n.value === 0)!
        list.removeNode(n3)
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(1)
        expect(list.first).toEqual(1)
        expect(list.last).toEqual(1)
        expect(Array.from(list)).to.deep.equal([1])
        expect(n3.list).toEqual(null)
        expect(n3.next).toEqual(null)
        expect(n3.prev).toEqual(null)
        expect(n3.value).toEqual(0)
        const n4 = find(list.nodes(), n => n.value === 1)!
        list.removeNode(n4)
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        expect(Array.from(list)).to.deep.equal([])
        expect(n4.list).toEqual(null)
        expect(n4.next).toEqual(null)
        expect(n4.prev).toEqual(null)
        expect(n4.value).toEqual(1)
      })
    })
    describe("#clear()", () => {
      it("should remove all values from the list", () => {
        const list = LinkedList.from([0, 1, 2, 3])
        expect(list.isEmpty).toEqual(false)
        expect(list.length).toEqual(4)
        expect(list.first).toEqual(0)
        expect(list.last).toEqual(3)
        expect(Array.from(list)).to.deep.equal([0, 1, 2, 3])
        list.clear()
        expect(list.isEmpty).toEqual(true)
        expect(list.length).toEqual(0)
        expect(list.first).toEqual(undefined)
        expect(list.last).toEqual(undefined)
        expect(Array.from(list)).to.deep.equal([])
      })
    })
    describe(".from()", () => {
      it("should initialize a list from an iterable", () => {
        const list1 = LinkedList.from([0, 1, 2, 3])
        const list2 = LinkedList.from(list1)
        expect(list2.isEmpty).toEqual(false)
        expect(list2.length).toEqual(4)
        expect(list2.first).toEqual(0)
        expect(list2.last).toEqual(3)
        expect(Array.from(list2)).to.deep.equal([0, 1, 2, 3])
      })
    })
  })
})
