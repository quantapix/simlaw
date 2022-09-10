import type { EntityAdapter } from "../index"
import { createEntityAdapter } from "../index"
import type { PayloadAction } from "../../createAction"
import { configureStore } from "../../configureStore"
import { createSlice } from "../../createSlice"
import type { BookModel } from "./fixtures/book"
describe("createStateOperator", () => {
  let adapter: EntityAdapter<BookModel>
  beforeEach(() => {
    adapter = createEntityAdapter({
      selectId: (book: BookModel) => book.id,
    })
  })
  it("Correctly mutates a draft state when inside `createNextState", () => {
    const booksSlice = createSlice({
      name: "books",
      initialState: adapter.getInitialState(),
      reducers: {
        addOne(state, action: PayloadAction<BookModel>) {
          const result = adapter.addOne(state, action)
          expect(result.ids.length).toBe(1)
        },
        addAnother: adapter.addOne,
      },
    })
    const { addOne, addAnother } = booksSlice.actions
    const store = configureStore({
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
