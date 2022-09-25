import * as qi from "../../src/immer/index.js"
import * as qx from "../../src/redux/index.js"
import { AClockworkOrange, AnimalFarm, BookModel, TheGreatGatsby, TheHobbit } from "./fixtures/book.js"

describe("Entity utils", () => {
  describe(`selectIdValue()`, () => {
    const OLD_ENV = process.env
    beforeEach(() => {
      jest.resetModules() // this is important - it clears the cache
      process.env = { ...OLD_ENV, NODE_ENV: "development" }
    })
    afterEach(() => {
      process.env = OLD_ENV
      jest.resetAllMocks()
    })
    it("should not warn when key does exist", () => {
      const spy = jest.spyOn(console, "warn")
      qx.selectIdValue(AClockworkOrange, (book: any) => book.id)
      expect(spy).not.toHaveBeenCalled()
    })
    it("should warn when key does not exist in dev mode", () => {
      const spy = jest.spyOn(console, "warn")
      qx.selectIdValue(AClockworkOrange, (book: any) => book.foo)
      expect(spy).toHaveBeenCalled()
    })
    it("should warn when key is undefined in dev mode", () => {
      const spy = jest.spyOn(console, "warn")
      const undefinedAClockworkOrange = { ...AClockworkOrange, id: undefined }
      qx.selectIdValue(undefinedAClockworkOrange, (book: any) => book.id)
      expect(spy).toHaveBeenCalled()
    })
    it("should not warn when key does not exist in prod mode", () => {
      process.env["NODE_ENV"] = "production"
      const spy = jest.spyOn(console, "warn")
      qx.selectIdValue(AClockworkOrange, (book: any) => book.foo)
      expect(spy).not.toHaveBeenCalled()
    })
    it("should not warn when key is undefined in prod mode", () => {
      process.env["NODE_ENV"] = "production"
      const spy = jest.spyOn(console, "warn")
      const undefinedAClockworkOrange = { ...AClockworkOrange, id: undefined }
      qx.selectIdValue(undefinedAClockworkOrange, (book: any) => book.id)
      expect(spy).not.toHaveBeenCalled()
    })
  })
})

describe("Entity State", () => {
  let adapter: qx.EntityAdapter<BookModel>
  beforeEach(() => {
    adapter = qx.createEntityAdapter({
      selectId: (book: BookModel) => book.id,
    })
  })
  it("should let you get the initial state", () => {
    const initialState = adapter.getInitialState()
    expect(initialState).toEqual({
      ids: [],
      entities: {},
    })
  })
  it("should let you provide additional initial state properties", () => {
    const additionalProperties = { isHydrated: true }
    const initialState = adapter.getInitialState(additionalProperties)
    expect(initialState).toEqual({
      ...additionalProperties,
      ids: [],
      entities: {},
    })
  })
  it("should allow methods to be passed as reducers", () => {
    const upsertBook = qx.createAction<BookModel>("otherBooks/upsert")
    const booksSlice = qx.createSlice({
      name: "books",
      initialState: adapter.getInitialState(),
      reducers: {
        addOne: adapter.addOne,
        removeOne(state, action: qx.PayloadAction<string>) {
          const result = adapter.removeOne(state, action)
          return result
        },
      },
      extraReducers: builder => {
        builder.addCase(upsertBook, (state, action) => {
          return adapter.upsertOne(state, action)
        })
      },
    })
    const { addOne, removeOne } = booksSlice.actions
    const { reducer } = booksSlice
    const selectors = adapter.getSelectors()
    const book1: BookModel = { id: "a", title: "First" }
    const book1a: BookModel = { id: "a", title: "Second" }
    const afterAddOne = reducer(undefined, addOne(book1))
    expect(afterAddOne.entities[book1.id]).toBe(book1)
    const afterRemoveOne = reducer(afterAddOne, removeOne(book1.id))
    expect(afterRemoveOne.entities[book1.id]).toBeUndefined()
    expect(selectors.selectTotal(afterRemoveOne)).toBe(0)
    const afterUpsertFirst = reducer(afterRemoveOne, upsertBook(book1))
    const afterUpsertSecond = reducer(afterUpsertFirst, upsertBook(book1a))
    expect(afterUpsertSecond.entities[book1.id]).toEqual(book1a)
    expect(selectors.selectTotal(afterUpsertSecond)).toBe(1)
  })
})
describe("createStateOperator", () => {
  let adapter: qx.EntityAdapter<BookModel>
  beforeEach(() => {
    adapter = qx.createEntityAdapter({
      selectId: (book: BookModel) => book.id,
    })
  })
  it("Correctly mutates a draft state when inside `createNextState", () => {
    const booksSlice = qx.createSlice({
      name: "books",
      initialState: adapter.getInitialState(),
      reducers: {
        addOne(state, action: qx.PayloadAction<BookModel>) {
          const result = adapter.addOne(state, action)
          expect(result.ids.length).toBe(1)
        },
        addAnother: adapter.addOne,
      },
    })
    const { addOne, addAnother } = booksSlice.actions
    const store = qx.configureStore({
      reducer: {
        books: booksSlice.reducer,
      },
    })
    const book1: BookModel = { id: "a", title: "First" }
    store.dispatch(addOne(book1))
    const state1 = store.getState()
    expect(state1.books.ids.length).toBe(1)
    expect(state1.books.entities["a"]).toBe(book1)
    const book2: BookModel = { id: "b", title: "Second" }
    store.dispatch(addAnother(book2))
    const state2 = store.getState()
    expect(state2.books.ids.length).toBe(2)
    expect(state2.books.entities["b"]).toBe(book2)
  })
})

describe("Entity State Selectors", () => {
  describe("Composed Selectors", () => {
    interface State {
      books: qx.EntityState<BookModel>
    }
    let adapter: qx.EntityAdapter<BookModel>
    let selectors: qx.EntitySelectors<BookModel, State>
    let state: State
    beforeEach(() => {
      adapter = qx.createEntityAdapter({
        selectId: (book: BookModel) => book.id,
      })
      state = {
        books: adapter.setAll(adapter.getInitialState(), [AClockworkOrange, AnimalFarm, TheGreatGatsby]),
      }
      selectors = adapter.getSelectors((state: State) => state.books)
    })
    it("should create a selector for selecting the ids", () => {
      const ids = selectors.selectIds(state)
      expect(ids).toEqual(state.books.ids)
    })
    it("should create a selector for selecting the entities", () => {
      const entities = selectors.selectEntities(state)
      expect(entities).toEqual(state.books.entities)
    })
    it("should create a selector for selecting the list of models", () => {
      const models = selectors.selectAll(state)
      expect(models).toEqual([AClockworkOrange, AnimalFarm, TheGreatGatsby])
    })
    it("should create a selector for selecting the count of models", () => {
      const total = selectors.selectTotal(state)
      expect(total).toEqual(3)
    })
    it("should create a selector for selecting a single item by ID", () => {
      const first = selectors.selectById(state, AClockworkOrange.id)
      expect(first).toBe(AClockworkOrange)
      const second = selectors.selectById(state, AnimalFarm.id)
      expect(second).toBe(AnimalFarm)
    })
  })
  describe("Uncomposed Selectors", () => {
    type State = qx.EntityState<BookModel>
    let adapter: qx.EntityAdapter<BookModel>
    let selectors: qx.EntitySelectors<BookModel, qx.EntityState<BookModel>>
    let state: State
    beforeEach(() => {
      adapter = qx.createEntityAdapter({
        selectId: (book: BookModel) => book.id,
      })
      state = adapter.setAll(adapter.getInitialState(), [AClockworkOrange, AnimalFarm, TheGreatGatsby])
      selectors = adapter.getSelectors()
    })
    it("should create a selector for selecting the ids", () => {
      const ids = selectors.selectIds(state)
      expect(ids).toEqual(state.ids)
    })
    it("should create a selector for selecting the entities", () => {
      const entities = selectors.selectEntities(state)
      expect(entities).toEqual(state.entities)
    })
    it("should type single entity from Dictionary as entity type or undefined", () => {
      expectType<qx.Selector<qx.EntityState<BookModel>, BookModel | undefined>>(
        qx.createSelector(selectors.selectEntities, entities => entities[0])
      )
    })
    it("should create a selector for selecting the list of models", () => {
      const models = selectors.selectAll(state)
      expect(models).toEqual([AClockworkOrange, AnimalFarm, TheGreatGatsby])
    })
    it("should create a selector for selecting the count of models", () => {
      const total = selectors.selectTotal(state)
      expect(total).toEqual(3)
    })
    it("should create a selector for selecting a single item by ID", () => {
      const first = selectors.selectById(state, AClockworkOrange.id)
      expect(first).toBe(AClockworkOrange)
      const second = selectors.selectById(state, AnimalFarm.id)
      expect(second).toBe(AnimalFarm)
    })
  })
})
function expectType<T>(t: T) {
  return t
}

describe("Sorted State Adapter", () => {
  let adapter: qx.EntityAdapter<BookModel>
  let state: qx.EntityState<BookModel>
  beforeAll(() => {
    Object.defineProperty(Array.prototype, "unwantedField", {
      enumerable: true,
      configurable: true,
      value: "This should not appear anywhere",
    })
  })
  afterAll(() => {
    delete (Array.prototype as any).unwantedField
  })
  beforeEach(() => {
    adapter = qx.createEntityAdapter({
      selectId: (book: BookModel) => book.id,
      sortComparer: (a, b) => {
        return a.title.localeCompare(b.title)
      },
    })
    state = { ids: [], entities: {} }
  })
  it("should let you add one entity to the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should let you add one entity to the state as an FSA", () => {
    const bookAction = qx.createAction<BookModel>("books/add")
    const withOneEntity = adapter.addOne(state, bookAction(TheGreatGatsby))
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should not change state if you attempt to re-add an entity", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const readded = adapter.addOne(withOneEntity, TheGreatGatsby)
    expect(readded).toBe(withOneEntity)
  })
  it("should let you add many entities to the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withManyMore = adapter.addMany(withOneEntity, [AClockworkOrange, AnimalFarm])
    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should let you add many entities to the state from a dictionary", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withManyMore = adapter.addMany(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm,
    })
    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should remove existing and add new ones on setAll", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withAll = adapter.setAll(withOneEntity, [AClockworkOrange, AnimalFarm])
    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should remove existing and add new ones on setAll when passing in a dictionary", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withAll = adapter.setAll(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm,
    })
    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should remove existing and add new ones on addAll (deprecated)", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withAll = adapter.setAll(withOneEntity, [AClockworkOrange, AnimalFarm])
    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should let you add remove an entity from the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withoutOne = adapter.removeOne(withOneEntity, TheGreatGatsby.id)
    expect(withoutOne).toEqual({
      ids: [],
      entities: {},
    })
  })
  it("should let you remove many entities by id from the state", () => {
    const withAll = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, AnimalFarm])
    const withoutMany = adapter.removeMany(withAll, [TheGreatGatsby.id, AClockworkOrange.id])
    expect(withoutMany).toEqual({
      ids: [AnimalFarm.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should let you remove all entities from the state", () => {
    const withAll = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, AnimalFarm])
    const withoutAll = adapter.removeAll(withAll)
    expect(withoutAll).toEqual({
      ids: [],
      entities: {},
    })
  })
  it("should let you update an entity in the state", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: "A New Hope" }
    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    })
  })
  it("should not change state if you attempt to update an entity that has not been added", () => {
    const withUpdates = adapter.updateOne(state, {
      id: TheGreatGatsby.id,
      changes: { title: "A New Title" },
    })
    expect(withUpdates).toBe(state)
  })
  it("Replaces an existing entity if you change the ID while updating", () => {
    const withAdded = adapter.setAll(state, [
      { id: "a", title: "First" },
      { id: "b", title: "Second" },
      { id: "c", title: "Third" },
    ])
    const withUpdated = adapter.updateOne(withAdded, {
      id: "b",
      changes: {
        id: "c",
      },
    })
    const { ids, entities } = withUpdated
    expect(ids.length).toBe(2)
    expect(entities.a).toBeTruthy()
    expect(entities.b).not.toBeTruthy()
    expect(entities.c).toBeTruthy()
    expect(entities.c!.id).toBe("c")
    expect(entities.c!.title).toBe("Second")
  })
  it("should not change ids state if you attempt to update an entity that does not impact sorting", () => {
    const withAll = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, AnimalFarm])
    const changes = { title: "The Great Gatsby II" }
    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withAll.ids).toBe(withUpdates.ids)
  })
  it("should let you update the id of entity", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { id: "A New Id" }
    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withUpdates).toEqual({
      ids: [changes.id],
      entities: {
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    })
  })
  it("should resort correctly if same id but sort key update", () => {
    const withAll = adapter.setAll(state, [TheGreatGatsby, AnimalFarm, AClockworkOrange])
    const changes = { title: "A New Hope" }
    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should resort correctly if the id and sort key update", () => {
    const withOne = adapter.setAll(state, [TheGreatGatsby, AnimalFarm, AClockworkOrange])
    const changes = { id: "A New Id", title: "A New Hope" }
    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, changes.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should maintain a stable sorting order when updating items", () => {
    interface OrderedEntity {
      id: string
      order: number
      ts: number
    }
    const sortedItemsAdapter = qx.createEntityAdapter<OrderedEntity>({
      sortComparer: (a, b) => a.order - b.order,
    })
    const withInitialItems = sortedItemsAdapter.setAll(sortedItemsAdapter.getInitialState(), [
      { id: "A", order: 1, ts: 0 },
      { id: "B", order: 2, ts: 0 },
      { id: "C", order: 3, ts: 0 },
      { id: "D", order: 3, ts: 0 },
      { id: "E", order: 3, ts: 0 },
    ])
    const updated = sortedItemsAdapter.updateOne(withInitialItems, {
      id: "C",
      changes: { ts: 5 },
    })
    expect(updated.ids).toEqual(["A", "B", "C", "D", "E"])
  })
  it("should let you update many entities by id in the state", () => {
    const firstChange = { title: "Zack" }
    const secondChange = { title: "Aaron" }
    const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange])
    const withUpdates = adapter.updateMany(withMany, [
      { id: TheGreatGatsby.id, changes: firstChange },
      { id: AClockworkOrange.id, changes: secondChange },
    ])
    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange,
        },
      },
    })
  })
  it("should let you add one entity to the state with upsert()", () => {
    const withOneEntity = adapter.upsertOne(state, TheGreatGatsby)
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should let you update an entity in the state with upsert()", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: "A New Hope" }
    const withUpdates = adapter.upsertOne(withOne, {
      ...TheGreatGatsby,
      ...changes,
    })
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    })
  })
  it("should let you upsert many entities in the state", () => {
    const firstChange = { title: "Zack" }
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const withUpserts = adapter.upsertMany(withMany, [{ ...TheGreatGatsby, ...firstChange }, AClockworkOrange])
    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("should do nothing when upsertMany is given an empty array", () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const withUpserts = adapter.upsertMany(withMany, [])
    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should throw when upsertMany is passed undefined or null", async () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const fakeRequest = (response: null | undefined) => new Promise(resolve => setTimeout(() => resolve(response), 50))
    const undefinedBooks = (await fakeRequest(undefined)) as BookModel[]
    expect(() => adapter.upsertMany(withMany, undefinedBooks)).toThrow()
    const nullBooks = (await fakeRequest(null)) as BookModel[]
    expect(() => adapter.upsertMany(withMany, nullBooks)).toThrow()
  })
  it("should let you upsert many entities in the state when passing in a dictionary", () => {
    const firstChange = { title: "Zack" }
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const withUpserts = adapter.upsertMany(withMany, {
      [TheGreatGatsby.id]: { ...TheGreatGatsby, ...firstChange },
      [AClockworkOrange.id]: AClockworkOrange,
    })
    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("should let you add a new entity in the state with setOne() and keep the sorting", () => {
    const withMany = adapter.setAll(state, [AnimalFarm, TheHobbit])
    const withOneMore = adapter.setOne(withMany, TheGreatGatsby)
    expect(withOneMore).toEqual({
      ids: [AnimalFarm.id, TheGreatGatsby.id, TheHobbit.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm,
        [TheHobbit.id]: TheHobbit,
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should let you replace an entity in the state with setOne()", () => {
    let withOne = adapter.setOne(state, TheHobbit)
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" }
    withOne = adapter.setOne(withOne, changeWithoutAuthor)
    expect(withOne).toEqual({
      ids: [TheHobbit.id],
      entities: {
        [TheHobbit.id]: changeWithoutAuthor,
      },
    })
  })
  it("should do nothing when setMany is given an empty array", () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const withUpserts = adapter.setMany(withMany, [])
    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should let you set many entities in the state", () => {
    const firstChange = { id: TheHobbit.id, title: "Silmarillion" }
    const withMany = adapter.setAll(state, [TheHobbit])
    const withSetMany = adapter.setMany(withMany, [firstChange, AClockworkOrange])
    expect(withSetMany).toEqual({
      ids: [AClockworkOrange.id, TheHobbit.id],
      entities: {
        [TheHobbit.id]: firstChange,
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("should let you set many entities in the state when passing in a dictionary", () => {
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" }
    const withMany = adapter.setAll(state, [TheHobbit])
    const withSetMany = adapter.setMany(withMany, {
      [TheHobbit.id]: changeWithoutAuthor,
      [AClockworkOrange.id]: AClockworkOrange,
    })
    expect(withSetMany).toEqual({
      ids: [AClockworkOrange.id, TheHobbit.id],
      entities: {
        [TheHobbit.id]: changeWithoutAuthor,
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("only returns one entry for that id in the id's array", () => {
    const book1: BookModel = { id: "a", title: "First" }
    const book2: BookModel = { id: "b", title: "Second" }
    const initialState = adapter.getInitialState()
    const withItems = adapter.addMany(initialState, [book1, book2])
    expect(withItems.ids).toEqual(["a", "b"])
    const withUpdate = adapter.updateOne(withItems, {
      id: "a",
      changes: { id: "b" },
    })
    expect(withUpdate.ids).toEqual(["b"])
    expect(withUpdate.entities["b"]!.title).toBe(book1.title)
  })
  describe("can be used mutably when wrapped in createNextState", () => {
    it("removeAll", () => {
      const withTwo = adapter.addMany(state, [TheGreatGatsby, AnimalFarm])
      const result = qi.produce(withTwo, draft => {
        adapter.removeAll(draft)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {},
          "ids": Array [],
        }
      `)
    })
    it("addOne", () => {
      const result = qi.produce(state, draft => {
        adapter.addOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("addMany", () => {
      const result = qi.produce(state, draft => {
        adapter.addMany(draft, [TheGreatGatsby, AnimalFarm])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "af",
            "tgg",
          ],
        }
      `)
    })
    it("setAll", () => {
      const result = qi.produce(state, draft => {
        adapter.setAll(draft, [TheGreatGatsby, AnimalFarm])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "af",
            "tgg",
          ],
        }
      `)
    })
    it("updateOne", () => {
      const withOne = adapter.addOne(state, TheGreatGatsby)
      const changes = { title: "A New Hope" }
      const result = qi.produce(withOne, draft => {
        adapter.updateOne(draft, {
          id: TheGreatGatsby.id,
          changes,
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("updateMany", () => {
      const firstChange = { title: "First Change" }
      const secondChange = { title: "Second Change" }
      const thirdChange = { title: "Third Change" }
      const fourthChange = { author: "Fourth Change" }
      const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, TheHobbit])
      const result = qi.produce(withMany, draft => {
        adapter.updateMany(draft, [
          { id: TheHobbit.id, changes: firstChange },
          { id: TheGreatGatsby.id, changes: secondChange },
          { id: AClockworkOrange.id, changes: thirdChange },
          { id: TheHobbit.id, changes: fourthChange },
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "aco": Object {
              "id": "aco",
              "title": "Third Change",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "Second Change",
            },
            "th": Object {
              "author": "Fourth Change",
              "id": "th",
              "title": "First Change",
            },
          },
          "ids": Array [
            "th",
            "tgg",
            "aco",
          ],
        }
      `)
    })
    it("upsertOne (insert)", () => {
      const result = qi.produce(state, draft => {
        adapter.upsertOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("upsertOne (update)", () => {
      const withOne = adapter.upsertOne(state, TheGreatGatsby)
      const result = qi.produce(withOne, draft => {
        adapter.upsertOne(draft, {
          id: TheGreatGatsby.id,
          title: "A New Hope",
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("upsertMany", () => {
      const withOne = adapter.upsertOne(state, TheGreatGatsby)
      const result = qi.produce(withOne, draft => {
        adapter.upsertMany(draft, [
          {
            id: TheGreatGatsby.id,
            title: "A New Hope",
          },
          AnimalFarm,
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
            "af",
          ],
        }
      `)
    })
    it("setOne (insert)", () => {
      const result = qi.produce(state, draft => {
        adapter.setOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("setOne (update)", () => {
      const withOne = adapter.setOne(state, TheHobbit)
      const result = qi.produce(withOne, draft => {
        adapter.setOne(draft, {
          id: TheHobbit.id,
          title: "Silmarillion",
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "th": Object {
              "id": "th",
              "title": "Silmarillion",
            },
          },
          "ids": Array [
            "th",
          ],
        }
      `)
    })
    it("setMany", () => {
      const withOne = adapter.setOne(state, TheHobbit)
      const result = qi.produce(withOne, draft => {
        adapter.setMany(draft, [
          {
            id: TheHobbit.id,
            title: "Silmarillion",
          },
          AnimalFarm,
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "th": Object {
              "id": "th",
              "title": "Silmarillion",
            },
          },
          "ids": Array [
            "af",
            "th",
          ],
        }
      `)
    })
    it("removeOne", () => {
      const withTwo = adapter.addMany(state, [TheGreatGatsby, AnimalFarm])
      const result = qi.produce(withTwo, draft => {
        adapter.removeOne(draft, TheGreatGatsby.id)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
          },
          "ids": Array [
            "af",
          ],
        }
      `)
    })
    it("removeMany", () => {
      const withThree = adapter.addMany(state, [TheGreatGatsby, AnimalFarm, AClockworkOrange])
      const result = qi.produce(withThree, draft => {
        adapter.removeMany(draft, [TheGreatGatsby.id, AnimalFarm.id])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "aco": Object {
              "id": "aco",
              "title": "A Clockwork Orange",
            },
          },
          "ids": Array [
            "aco",
          ],
        }
      `)
    })
  })
})

describe("Unsorted State Adapter", () => {
  let adapter: qx.EntityAdapter<BookModel>
  let state: qx.EntityState<BookModel>
  beforeAll(() => {
    Object.defineProperty(Array.prototype, "unwantedField", {
      enumerable: true,
      configurable: true,
      value: "This should not appear anywhere",
    })
  })
  afterAll(() => {
    delete (Array.prototype as any).unwantedField
  })
  beforeEach(() => {
    adapter = qx.createEntityAdapter({
      selectId: (book: BookModel) => book.id,
    })
    state = { ids: [], entities: {} }
  })
  it("should let you add one entity to the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should not change state if you attempt to re-add an entity", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const readded = adapter.addOne(withOneEntity, TheGreatGatsby)
    expect(readded).toBe(withOneEntity)
  })
  it("should let you add many entities to the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withManyMore = adapter.addMany(withOneEntity, [AClockworkOrange, AnimalFarm])
    expect(withManyMore).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should let you add many entities to the state from a dictionary", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withManyMore = adapter.addMany(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm,
    })
    expect(withManyMore).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should remove existing and add new ones on setAll", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withAll = adapter.setAll(withOneEntity, [AClockworkOrange, AnimalFarm])
    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should remove existing and add new ones on setAll when passing in a dictionary", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withAll = adapter.setAll(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm,
    })
    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should let you add remove an entity from the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)
    const withoutOne = adapter.removeOne(withOneEntity, TheGreatGatsby.id)
    expect(withoutOne).toEqual({
      ids: [],
      entities: {},
    })
  })
  it("should let you remove many entities by id from the state", () => {
    const withAll = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, AnimalFarm])
    const withoutMany = adapter.removeMany(withAll, [TheGreatGatsby.id, AClockworkOrange.id])
    expect(withoutMany).toEqual({
      ids: [AnimalFarm.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm,
      },
    })
  })
  it("should let you remove all entities from the state", () => {
    const withAll = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, AnimalFarm])
    const withoutAll = adapter.removeAll(withAll)
    expect(withoutAll).toEqual({
      ids: [],
      entities: {},
    })
  })
  it("should let you update an entity in the state", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: "A New Hope" }
    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    })
  })
  it("should not change state if you attempt to update an entity that has not been added", () => {
    const withUpdates = adapter.updateOne(state, {
      id: TheGreatGatsby.id,
      changes: { title: "A New Title" },
    })
    expect(withUpdates).toBe(state)
  })
  it("should not change ids state if you attempt to update an entity that has already been added", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: "A New Hope" }
    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withOne.ids).toBe(withUpdates.ids)
  })
  it("should let you update the id of entity", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { id: "A New Id" }
    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    })
    expect(withUpdates).toEqual({
      ids: [changes.id],
      entities: {
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    })
  })
  it("should let you update many entities by id in the state", () => {
    const firstChange = { title: "First Change" }
    const secondChange = { title: "Second Change" }
    const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange])
    const withUpdates = adapter.updateMany(withMany, [
      { id: TheGreatGatsby.id, changes: firstChange },
      { id: AClockworkOrange.id, changes: secondChange },
    ])
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange,
        },
      },
    })
  })
  it("doesn't break when multiple renames of one item occur", () => {
    const withA = adapter.addOne(state, { id: "a", title: "First" })
    const withUpdates = adapter.updateMany(withA, [
      { id: "a", changes: { id: "b" } },
      { id: "a", changes: { id: "c" } },
    ])
    const { ids, entities } = withUpdates
    expect(ids.length).toBe(1)
    expect(ids).toEqual(["c"])
    expect(entities.a).toBeFalsy()
    expect(entities.b).toBeFalsy()
    expect(entities.c).toBeTruthy()
  })
  it("should let you add one entity to the state with upsert()", () => {
    const withOneEntity = adapter.upsertOne(state, TheGreatGatsby)
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should let you update an entity in the state with upsert()", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: "A New Hope" }
    const withUpdates = adapter.upsertOne(withOne, {
      ...TheGreatGatsby,
      ...changes,
    })
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    })
  })
  it("should let you upsert many entities in the state", () => {
    const firstChange = { title: "First Change" }
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const withUpserts = adapter.upsertMany(withMany, [{ ...TheGreatGatsby, ...firstChange }, AClockworkOrange])
    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("should let you upsert many entities in the state when passing in a dictionary", () => {
    const firstChange = { title: "Zack" }
    const withMany = adapter.setAll(state, [TheGreatGatsby])
    const withUpserts = adapter.upsertMany(withMany, {
      [TheGreatGatsby.id]: { ...TheGreatGatsby, ...firstChange },
      [AClockworkOrange.id]: AClockworkOrange,
    })
    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("should let you add a new entity in the state with setOne()", () => {
    const withOne = adapter.setOne(state, TheGreatGatsby)
    expect(withOne).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
      },
    })
  })
  it("should let you replace an entity in the state with setOne()", () => {
    let withOne = adapter.setOne(state, TheHobbit)
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" }
    withOne = adapter.setOne(withOne, changeWithoutAuthor)
    expect(withOne).toEqual({
      ids: [TheHobbit.id],
      entities: {
        [TheHobbit.id]: changeWithoutAuthor,
      },
    })
  })
  it("should let you set many entities in the state", () => {
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" }
    const withMany = adapter.setAll(state, [TheHobbit])
    const withSetMany = adapter.setMany(withMany, [changeWithoutAuthor, AClockworkOrange])
    expect(withSetMany).toEqual({
      ids: [TheHobbit.id, AClockworkOrange.id],
      entities: {
        [TheHobbit.id]: changeWithoutAuthor,
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("should let you set many entities in the state when passing in a dictionary", () => {
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" }
    const withMany = adapter.setAll(state, [TheHobbit])
    const withSetMany = adapter.setMany(withMany, {
      [TheHobbit.id]: changeWithoutAuthor,
      [AClockworkOrange.id]: AClockworkOrange,
    })
    expect(withSetMany).toEqual({
      ids: [TheHobbit.id, AClockworkOrange.id],
      entities: {
        [TheHobbit.id]: changeWithoutAuthor,
        [AClockworkOrange.id]: AClockworkOrange,
      },
    })
  })
  it("only returns one entry for that id in the id's array", () => {
    const book1: BookModel = { id: "a", title: "First" }
    const book2: BookModel = { id: "b", title: "Second" }
    const initialState = adapter.getInitialState()
    const withItems = adapter.addMany(initialState, [book1, book2])
    expect(withItems.ids).toEqual(["a", "b"])
    const withUpdate = adapter.updateOne(withItems, {
      id: "a",
      changes: { id: "b" },
    })
    expect(withUpdate.ids).toEqual(["b"])
    expect(withUpdate.entities["b"]!.title).toBe(book1.title)
  })
  describe("can be used mutably when wrapped in createNextState", () => {
    it("removeAll", () => {
      const withTwo = adapter.addMany(state, [TheGreatGatsby, AnimalFarm])
      const result = qi.produce(withTwo, draft => {
        adapter.removeAll(draft)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {},
          "ids": Array [],
        }
      `)
    })
    it("addOne", () => {
      const result = qi.produce(state, draft => {
        adapter.addOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("addMany", () => {
      const result = qi.produce(state, draft => {
        adapter.addMany(draft, [TheGreatGatsby, AnimalFarm])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
            "af",
          ],
        }
      `)
    })
    it("setAll", () => {
      const result = qi.produce(state, draft => {
        adapter.setAll(draft, [TheGreatGatsby, AnimalFarm])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
            "af",
          ],
        }
      `)
    })
    it("updateOne", () => {
      const withOne = adapter.addOne(state, TheGreatGatsby)
      const changes = { title: "A New Hope" }
      const result = qi.produce(withOne, draft => {
        adapter.updateOne(draft, {
          id: TheGreatGatsby.id,
          changes,
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("updateMany", () => {
      const firstChange = { title: "First Change" }
      const secondChange = { title: "Second Change" }
      const thirdChange = { title: "Third Change" }
      const fourthChange = { author: "Fourth Change" }
      const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange, TheHobbit])
      const result = qi.produce(withMany, draft => {
        adapter.updateMany(draft, [
          { id: TheHobbit.id, changes: firstChange },
          { id: TheGreatGatsby.id, changes: secondChange },
          { id: AClockworkOrange.id, changes: thirdChange },
          { id: TheHobbit.id, changes: fourthChange },
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "aco": Object {
              "id": "aco",
              "title": "Third Change",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "Second Change",
            },
            "th": Object {
              "author": "Fourth Change",
              "id": "th",
              "title": "First Change",
            },
          },
          "ids": Array [
            "tgg",
            "aco",
            "th",
          ],
        }
      `)
    })
    it("upsertOne (insert)", () => {
      const result = qi.produce(state, draft => {
        adapter.upsertOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("upsertOne (update)", () => {
      const withOne = adapter.upsertOne(state, TheGreatGatsby)
      const result = qi.produce(withOne, draft => {
        adapter.upsertOne(draft, {
          id: TheGreatGatsby.id,
          title: "A New Hope",
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("upsertMany", () => {
      const withOne = adapter.upsertOne(state, TheGreatGatsby)
      const result = qi.produce(withOne, draft => {
        adapter.upsertMany(draft, [
          {
            id: TheGreatGatsby.id,
            title: "A New Hope",
          },
          AnimalFarm,
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
            "af",
          ],
        }
      `)
    })
    it("setOne (insert)", () => {
      const result = qi.produce(state, draft => {
        adapter.setOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })
    it("setOne (update)", () => {
      const withOne = adapter.setOne(state, TheHobbit)
      const result = qi.produce(withOne, draft => {
        adapter.setOne(draft, {
          id: TheHobbit.id,
          title: "Silmarillion",
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "th": Object {
              "id": "th",
              "title": "Silmarillion",
            },
          },
          "ids": Array [
            "th",
          ],
        }
      `)
    })
    it("setMany", () => {
      const withOne = adapter.setOne(state, TheHobbit)
      const result = qi.produce(withOne, draft => {
        adapter.setMany(draft, [
          {
            id: TheHobbit.id,
            title: "Silmarillion",
          },
          AnimalFarm,
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "th": Object {
              "id": "th",
              "title": "Silmarillion",
            },
          },
          "ids": Array [
            "th",
            "af",
          ],
        }
      `)
    })
    it("removeOne", () => {
      const withTwo = adapter.addMany(state, [TheGreatGatsby, AnimalFarm])
      const result = qi.produce(withTwo, draft => {
        adapter.removeOne(draft, TheGreatGatsby.id)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
          },
          "ids": Array [
            "af",
          ],
        }
      `)
    })
    it("removeMany", () => {
      const withThree = adapter.addMany(state, [TheGreatGatsby, AnimalFarm, AClockworkOrange])
      const result = qi.produce(withThree, draft => {
        adapter.removeMany(draft, [TheGreatGatsby.id, AnimalFarm.id])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "aco": Object {
              "id": "aco",
              "title": "A Clockwork Orange",
            },
          },
          "ids": Array [
            "aco",
          ],
        }
      `)
    })
  })
})

describe("Combined entity slice", () => {
  let adapter: qx.EntityAdapter<BookModel>
  beforeEach(() => {
    adapter = qx.createEntityAdapter({
      selectId: (book: BookModel) => book.id,
      sortComparer: (a, b) => a.title.localeCompare(b.title),
    })
  })
  it("Entity and async features all works together", async () => {
    const upsertBook = qx.createAction<BookModel>("otherBooks/upsert")
    type BooksState = ReturnType<typeof adapter.getInitialState> & {
      loading: "initial" | "pending" | "finished" | "failed"
      lastRequestId: string | null
    }
    const initialState: BooksState = adapter.getInitialState({
      loading: "initial",
      lastRequestId: null,
    })
    const fakeBooks: BookModel[] = [
      { id: "b", title: "Second" },
      { id: "a", title: "First" },
    ]
    const fetchBooksTAC = qx.createAsyncThunk<
      BookModel[],
      void,
      {
        state: { books: BooksState }
      }
    >("books/fetch", async (arg, { getState, dispatch, extra, requestId, signal }) => {
      const state = getState()
      return fakeBooks
    })
    const booksSlice = qx.createSlice({
      name: "books",
      initialState,
      reducers: {
        addOne: adapter.addOne,
        removeOne(state, action: qx.PayloadAction<string>) {
          const sizeBefore = state.ids.length
          const result = adapter.removeOne(state, action)
          const sizeAfter = state.ids.length
          if (sizeBefore > 0) {
            expect(sizeAfter).toBe(sizeBefore - 1)
          }
        },
      },
      extraReducers: builder => {
        builder.addCase(upsertBook, (state, action) => {
          return adapter.upsertOne(state, action)
        })
        builder.addCase(fetchBooksTAC.pending, (state, action) => {
          state.loading = "pending"
          state.lastRequestId = action.meta.requestId
        })
        builder.addCase(fetchBooksTAC.fulfilled, (state, action) => {
          if (state.loading === "pending" && action.meta.requestId === state.lastRequestId) {
            adapter.setAll(state, action.payload)
            state.loading = "finished"
            state.lastRequestId = null
          }
        })
      },
    })
    const { addOne, removeOne } = booksSlice.actions
    const { reducer } = booksSlice
    const store = qx.configureStore({
      reducer: {
        books: reducer,
      },
    })
    await store.dispatch(fetchBooksTAC())
    const { books: booksAfterLoaded } = store.getState()
    expect(booksAfterLoaded.ids).toEqual(["a", "b"])
    expect(booksAfterLoaded.lastRequestId).toBe(null)
    expect(booksAfterLoaded.loading).toBe("finished")
    store.dispatch(addOne({ id: "d", title: "Remove Me" }))
    store.dispatch(removeOne("d"))
    store.dispatch(addOne({ id: "c", title: "Middle" }))
    const { books: booksAfterAddOne } = store.getState()
    expect(booksAfterAddOne.ids).toEqual(["a", "c", "b"])
    store.dispatch(upsertBook({ id: "c", title: "Zeroth" }))
    const { books: booksAfterUpsert } = store.getState()
    expect(booksAfterUpsert.ids).toEqual(["a", "b", "c"])
  })
})
