import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query"
{
  createApi({
    baseQuery: fetchBaseQuery(),
    endpoints: build => ({
      getDummy: build.query<null, undefined>({
        query: () => "dummy",
        onCacheEntryAdded: async (arg, { cacheDataLoaded }) => {
          const { meta } = await cacheDataLoaded
          const { request, response } = meta!
        },
      }),
    }),
  })
  const baseQuery = retry(fetchBaseQuery())
  createApi({
    baseQuery,
    endpoints: build => ({
      getDummy: build.query<null, undefined>({
        query: () => "dummy",
        onCacheEntryAdded: async (arg, { cacheDataLoaded }) => {
          const { meta } = await cacheDataLoaded
          const { request, response } = meta!
        },
      }),
    }),
  })
}
