/* eslint-disable @typescript-eslint/no-empty-function */
import {
  DisposableDelegate,
  DisposableSet,
  IDisposable,
  ObservableDisposableDelegate,
  ObservableDisposableSet,
} from "../../src/lumino/disposable.js"
class TestDisposable implements IDisposable {
  count = 0
  get isDisposed(): boolean {
    return this.count > 0
  }
  dispose(): void {
    this.count++
  }
}
describe("../../src/lumino/disposable", () => {
  describe("DisposableDelegate", () => {
    describe("#constructor()", () => {
      it("should accept a callback", () => {
        const delegate = new DisposableDelegate(() => {})
        expect(delegate).to.be.an.instanceof(DisposableDelegate)
      })
    })
    describe("#isDisposed", () => {
      it("should be `false` before object is disposed", () => {
        const delegate = new DisposableDelegate(() => {})
        expect(delegate.isDisposed).toEqual(false)
      })
      it("should be `true` after object is disposed", () => {
        const delegate = new DisposableDelegate(() => {})
        delegate.dispose()
        expect(delegate.isDisposed).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should invoke a callback when disposed", () => {
        let called = false
        const delegate = new DisposableDelegate(() => (called = true))
        expect(called).toEqual(false)
        delegate.dispose()
        expect(called).toEqual(true)
      })
      it("should ignore multiple calls to `dispose`", () => {
        let count = 0
        const delegate = new DisposableDelegate(() => count++)
        expect(count).toEqual(0)
        delegate.dispose()
        delegate.dispose()
        delegate.dispose()
        expect(count).toEqual(1)
      })
    })
  })
  describe("ObservableDisposableDelegate", () => {
    describe("#disposed", () => {
      it("should be emitted when the delegate is disposed", () => {
        let called = false
        const delegate = new ObservableDisposableDelegate(() => {})
        delegate.disposed.connect(() => {
          called = true
        })
        delegate.dispose()
        expect(called).toEqual(true)
      })
    })
  })
  describe("DisposableSet", () => {
    describe("#constructor()", () => {
      it("should accept no arguments", () => {
        const set = new DisposableSet()
        expect(set).to.be.an.instanceof(DisposableSet)
      })
    })
    describe("#isDisposed", () => {
      it("should be `false` before object is disposed", () => {
        const set = new DisposableSet()
        expect(set.isDisposed).toEqual(false)
      })
      it("should be `true` after object is disposed", () => {
        const set = new DisposableSet()
        set.dispose()
        expect(set.isDisposed).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose all items in the set", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = DisposableSet.from([item1, item2, item3])
        expect(item1.count).toEqual(0)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(0)
        set.dispose()
        expect(item1.count).toEqual(1)
        expect(item2.count).toEqual(1)
        expect(item3.count).toEqual(1)
      })
      it("should dipose items in the order they were added", () => {
        const values: number[] = []
        const item1 = new DisposableDelegate(() => values.push(0))
        const item2 = new DisposableDelegate(() => values.push(1))
        const item3 = new DisposableDelegate(() => values.push(2))
        const set = DisposableSet.from([item1, item2, item3])
        expect(values).to.deep.equal([])
        set.dispose()
        expect(values).to.deep.equal([0, 1, 2])
      })
      it("should ignore multiple calls to `dispose`", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = DisposableSet.from([item1, item2, item3])
        expect(item1.count).toEqual(0)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(0)
        set.dispose()
        set.dispose()
        set.dispose()
        expect(item1.count).toEqual(1)
        expect(item2.count).toEqual(1)
        expect(item3.count).toEqual(1)
      })
    })
    describe("#add()", () => {
      it("should add items to the set", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = new DisposableSet()
        set.add(item1)
        set.add(item2)
        set.add(item3)
        expect(item1.count).toEqual(0)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(0)
        set.dispose()
        expect(item1.count).toEqual(1)
        expect(item2.count).toEqual(1)
        expect(item3.count).toEqual(1)
      })
      it("should maintain insertion order", () => {
        const values: number[] = []
        const item1 = new DisposableDelegate(() => values.push(0))
        const item2 = new DisposableDelegate(() => values.push(1))
        const item3 = new DisposableDelegate(() => values.push(2))
        const set = DisposableSet.from([item1])
        set.add(item2)
        set.add(item3)
        expect(values).to.deep.equal([])
        set.dispose()
        expect(values).to.deep.equal([0, 1, 2])
      })
      it("should ignore duplicate items", () => {
        const values: number[] = []
        const item1 = new DisposableDelegate(() => values.push(0))
        const item2 = new DisposableDelegate(() => values.push(1))
        const item3 = new DisposableDelegate(() => values.push(2))
        const set = DisposableSet.from([item1])
        set.add(item2)
        set.add(item3)
        set.add(item3)
        set.add(item2)
        set.add(item1)
        expect(values).to.deep.equal([])
        set.dispose()
        expect(values).to.deep.equal([0, 1, 2])
      })
    })
    describe("#remove()", () => {
      it("should remove items from the set", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = DisposableSet.from([item1, item2, item3])
        expect(item1.count).toEqual(0)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(0)
        set.remove(item2)
        set.dispose()
        expect(item1.count).toEqual(1)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(1)
      })
      it("should maintain insertion order", () => {
        const values: number[] = []
        const item1 = new DisposableDelegate(() => values.push(0))
        const item2 = new DisposableDelegate(() => values.push(1))
        const item3 = new DisposableDelegate(() => values.push(2))
        const set = DisposableSet.from([item1, item2, item3])
        expect(values).to.deep.equal([])
        set.remove(item1)
        set.dispose()
        expect(values).to.deep.equal([1, 2])
      })
      it("should ignore missing items", () => {
        const values: number[] = []
        const item1 = new DisposableDelegate(() => values.push(0))
        const item2 = new DisposableDelegate(() => values.push(1))
        const item3 = new DisposableDelegate(() => values.push(2))
        const set = DisposableSet.from([item1, item2])
        expect(values).to.deep.equal([])
        set.remove(item3)
        set.dispose()
        expect(values).to.deep.equal([0, 1])
      })
    })
    describe("#clear()", () => {
      it("remove all items from the set", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = DisposableSet.from([item1, item2, item3])
        expect(item1.count).toEqual(0)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(0)
        set.clear()
        set.dispose()
        expect(item1.count).toEqual(0)
        expect(item2.count).toEqual(0)
        expect(item3.count).toEqual(0)
      })
    })
    describe(".from()", () => {
      it("should accept an iterable of disposable items", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = DisposableSet.from([item1, item2, item3])
        expect(set).to.be.an.instanceof(DisposableSet)
      })
    })
  })
  describe("ObservableDisposableSet", () => {
    describe("#disposed", () => {
      it("should be emitted when the set is disposed", () => {
        let called = false
        const set = new ObservableDisposableSet()
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        set.add(item1)
        set.add(item2)
        set.add(item3)
        set.disposed.connect(() => {
          expect(set.contains(item1)).toEqual(false)
          expect(set.contains(item2)).toEqual(false)
          expect(set.contains(item3)).toEqual(false)
          expect(item1.isDisposed).toEqual(true)
          expect(item2.isDisposed).toEqual(true)
          expect(item3.isDisposed).toEqual(true)
          called = true
        })
        set.dispose()
        expect(called).toEqual(true)
      })
    })
    describe(".from()", () => {
      it("should accept an iterable of disposable items", () => {
        const item1 = new TestDisposable()
        const item2 = new TestDisposable()
        const item3 = new TestDisposable()
        const set = ObservableDisposableSet.from([item1, item2, item3])
        expect(set).to.be.an.instanceof(ObservableDisposableSet)
      })
    })
  })
})
