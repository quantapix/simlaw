import { buildCreateApi } from "./create.js"
import { coreModule } from "./module.js"

const createApi = buildCreateApi(coreModule())

export { createApi, coreModule }
