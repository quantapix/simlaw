import { buildCreateApi, CreateApi } from "../createApi"
import { coreModule, coreModuleName } from "./module.js"

const createApi = buildCreateApi(coreModule())

export { createApi, coreModule }
