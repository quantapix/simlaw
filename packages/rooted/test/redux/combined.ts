import type { PayloadAction } from "@reduxjs/toolkit"
import {
  createAsyncThunk,
  createAction,
  createSlice,
  configureStore,
  createEntityAdapter,
} from "../../src/redux/index.js"
import type { EntityAdapter } from "@internal/entities/models"
import type { BookModel } from "./entities/fixtures/book.js"
describe("Combined entity slice", () => {
  let adapter: EntityAdapter<BookModel>
  beforeEach(() => {
    adapter = createEntityAdapter({
      selectId: (book: BookModel) => book.id,
      sortComparer: (a, b) => a.title.localeCompare(b.title),
    })
  })
  it("Entity and async features all works together", async () => {
    const upsertBook = createAction<BookModel>("otherBooks/upsert")
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
    const fetchBooksTAC = createAsyncThunk<
      BookModel[],
      void,
      {
        state: { books: BooksState }
      }
    >(
      "books/fetch",
      async (arg, { getState, dispatch, extra, requestId, signal }) => {
        const state = getState()
        return fakeBooks
      }
    )
    const booksSlice = createSlice({
      name: "books",
      initialState,
      reducers: {
        addOne: adapter.addOne,
        removeOne(state, action: PayloadAction<string>) {
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
          if (
            state.loading === "pending" &&
            action.meta.requestId === state.lastRequestId
          ) {
            adapter.setAll(state, action.payload)
            state.loading = "finished"
            state.lastRequestId = null
          }
        })
      },
    })
    const { addOne, removeOne } = booksSlice.actions
    const { reducer } = booksSlice
    const store = configureStore({
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
