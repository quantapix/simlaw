import { GraphiQLOptions, GraphiQLData, renderGraphiQL } from "./render.js"
import { parseBody } from "./parse.js"
import * as qg from "graphql"
import httpError from "http-errors"
import type { IncomingMessage, ServerResponse } from "http"
import type * as qt from "../types.js"

type Request = IncomingMessage & { url?: string | undefined; body?: unknown }
type Response = ServerResponse & { json?: (data: unknown) => void }
type Middleware = (ctx: qt.Context) => Promise<void>

export interface GraphQLParams {
  query: string | null
  variables: { readonly [name: string]: unknown } | null
  operationName: string | null
  raw: boolean
}

export type Options =
  | ((
      request: Request,
      response: Response,
      params?: GraphQLParams
    ) => qt.MaybePromise<OptionsData>)
  | qt.MaybePromise<OptionsData>

export interface RequestInfo {
  document: qg.DocumentNode
  variables: qt.Dict | null
  operationName: string | null
  result: qg.FormattedExecutionResult
  context?: unknown
}

export interface OptionsData {
  schema: qg.GraphQLSchema
  context?: qt.Context
  rootValue?: unknown
  pretty?: boolean
  validationRules?: ReadonlyArray<qg.ValidationRule>
  customValidateFn?: (
    x: qg.GraphQLSchema,
    n: qg.DocumentNode,
    rs: ReadonlyArray<qg.ValidationRule>
  ) => ReadonlyArray<qg.GraphQLError>
  customExecuteFn?: (
    xs: qg.ExecutionArgs
  ) => qt.MaybePromise<qg.ExecutionResult>
  customFormatErrorFn?: (x: qg.GraphQLError) => qg.GraphQLFormattedError
  customParseFn?: (x: qg.Source) => qg.DocumentNode
  formatError?: (x: qg.GraphQLError) => qg.GraphQLFormattedError
  extensions?: (x: RequestInfo) => qt.MaybePromise<undefined | qt.Dict>
  graphiql?: boolean | GraphiQLOptions
  fieldResolver?: qg.GraphQLFieldResolver<unknown, unknown>
  typeResolver?: qg.GraphQLTypeResolver<unknown, unknown>
}

export function graphqlHTTP(xs: Options): Middleware {
  if (xs == null) throw new TypeError("GraphQL needs options")
  return async (ctx: qt.Context): Promise<void> => {
    const inp = ctx.inp
    const req = ctx.req
    const res = ctx.res
    async function getOptions(x?: GraphQLParams): Promise<OptionsData> {
      const y = await Promise.resolve(
        typeof xs === "function" ? xs(inp, res, x) : xs
      )
      if (typeof y !== "object")
        throw new TypeError("GraphQL options need an object")
      return y
    }
    let ps: GraphQLParams | undefined
    let gios: GraphiQLOptions | undefined
    let show = false
    let pretty = false
    let errFn = qg.formatError
    let y: qg.ExecutionResult
    try {
      try {
        ps = await getParams(inp)
      } catch (e: unknown) {
        const os = await getOptions()
        pretty = os.pretty ?? pretty
        errFn = os.customFormatErrorFn ?? os.formatError ?? errFn
        throw e
      }
      const os = await getOptions(ps)
      pretty = os.pretty ?? pretty
      errFn = os.customFormatErrorFn ?? os.formatError ?? errFn
      const schema = os.schema
      if (typeof schema !== "object")
        throw new TypeError("GraphQL options need a schema")
      const fieldResolver = os.fieldResolver
      const typeResolver = os.typeResolver
      const ctx2 = os.context ?? ctx
      if (req.method !== "GET" && req.method !== "POST") {
        throw httpError(405, "GraphQL only supports GET and POST", {
          headers: { Allow: "GET, POST" },
        })
      }
      const graphiql = os.graphiql ?? false
      show = canDisplayGraphiQL(inp, ps) && graphiql !== false
      if (typeof graphiql !== "boolean") gios = graphiql
      if (ps.query == null) {
        if (show) return respondWithGraphiQL(res, gios)
        throw httpError(400, "GraphQL must provide query string")
      }
      const se = qg.validateSchema(schema)
      if (se.length > 0) {
        throw httpError(500, "GraphQL schema error", { gqlErrors: se })
      }
      let ast: qg.DocumentNode
      try {
        ast = (os.customParseFn ?? qg.parse)(
          new qg.Source(ps.query, "GraphQL request")
        )
      } catch (e: unknown) {
        throw httpError(400, "GraphQL syntax error", { gqlErrors: [e] })
      }
      const ve = (os.customValidateFn ?? qg.validate)(schema, ast, [
        ...qg.specifiedRules,
        ...(os.validationRules ?? []),
      ])
      if (ve.length > 0) {
        throw httpError(400, "GraphQL validation error", { gqlErrors: ve })
      }
      if (req.method === "GET") {
        const x = qg.getOperationAST(ast, ps.operationName)
        if (x && x.operation !== "query") {
          if (show) return respondWithGraphiQL(res, gios, ps)
          throw httpError(405, `GraphQL can only perform a ${x.operation}`, {
            headers: { Allow: "POST" },
          })
        }
      }
      try {
        y = await (os.customExecuteFn ?? qg.execute)({
          schema,
          document: ast,
          rootValue: os.rootValue,
          contextValue: ctx2,
          variableValues: ps.variables,
          operationName: ps.operationName,
          fieldResolver,
          typeResolver,
        })
      } catch (e: unknown) {
        throw httpError(400, "GraphQL context error", { gqlErrors: [e] })
      }
      if (os.extensions) {
        const es = await os.extensions({
          document: ast,
          variables: ps.variables,
          operationName: ps.operationName,
          result: y,
          context: ctx2,
        })
        if (es != null) y = { ...y, extensions: es }
      }
    } catch (e: unknown) {
      const e2 = httpError(500, e instanceof Error ? e : String(e))
      res.status = e2.status
      const { headers } = e2
      if (headers != null) {
        for (const [k, v] of Object.entries(headers)) {
          res.setHeader(k, String(v))
        }
      }
      if (e2["gqlErrors"] == null) {
        const e3 = new qg.GraphQLError(
          e2.message,
          undefined,
          undefined,
          undefined,
          undefined,
          e2
        )
        y = { data: null, errors: [e3] }
      } else y = { data: null, errors: e2["gqlErrors"] }
    }
    if (res.status === 200 && y.data == null) res.status = 500
    const y2: qg.FormattedExecutionResult = {
      ...y,
      errors: y.errors?.map(errFn),
    }
    if (show) return respondWithGraphiQL(res, gios, ps, y2)
    if (!pretty && typeof res.json === "function") res.json(y2)
    else {
      const y3 = JSON.stringify(y2, null, pretty ? 2 : 0)
      sendResponse(res, "application/json", y3)
    }
  }
}

async function getParams(x: Request): Promise<GraphQLParams> {
  const url = new URLSearchParams(x.url?.split("?")[1])
  const body = await parseBody(x)
  const query = url.get("query") ?? (body["query"] as string | null)
  let vs = (url.get("variables") ?? body["variables"]) as qt.Dict | null
  if (typeof vs === "string") {
    try {
      vs = JSON.parse(vs)
    } catch {
      throw httpError(400, "GraphQL variables are invalid JSON")
    }
  } else if (typeof vs !== "object") vs = null
  const n = url.get("operationName") ?? (body["operationName"] as string | null)
  const y = url.get("raw") != null || body["raw"] !== undefined
  return { query, variables: vs, operationName: n, raw: y }
}

function canDisplayGraphiQL(x: Request, ps: GraphQLParams) {
  return !ps.raw && x.accepts(["json", "html"]) === "html"
}

function sendResponse(x: Response, type: string, data: string) {
  const y = Buffer.from(data, "utf8")
  x.setHeader("Content-Type", type + "; charset=utf-8")
  x.setHeader("Content-Length", String(y.length))
  x.end(y)
}

function respondWithGraphiQL(
  x: Response,
  os?: GraphiQLOptions,
  ps?: GraphQLParams,
  result?: qg.FormattedExecutionResult
) {
  const y: GraphiQLData = {
    query: ps?.query,
    variables: ps?.variables,
    operationName: ps?.operationName,
    result,
  }
  return sendResponse(x, "text/html", renderGraphiQL(y, os))
}
