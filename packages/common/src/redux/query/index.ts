import { buildCreateApi } from "./build.js"
import { coreModule } from "./module.js"

export const createApi = buildCreateApi(coreModule())

export * from "./build.js"
export * from "./fetch.js"
export * from "./middleware.js"
export * from "./module.js"
export * from "./react.js"
