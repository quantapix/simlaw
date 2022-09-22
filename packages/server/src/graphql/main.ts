import {
  DocumentNode,
  ValidationRule,
  ExecutionArgs,
  ExecutionResult,
  FormattedExecutionResult,
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  GraphQLFormattedError,
  Source,
  GraphQLError,
  parse,
  validate,
  execute,
  formatError,
  validateSchema,
  getOperationAST,
  specifiedRules,
} from "graphql"
import httpError from "http-errors"
import { parseBody } from "./parse.js"
import { GraphiQLOptions, GraphiQLData, renderGraphiQL } from "./render.js"
import type { Context, MaybePromise } from "../types.js"
import type { IncomingMessage, ServerResponse } from "http"

type Request = IncomingMessage & { url?: string | undefined; body?: unknown }
type Response = ServerResponse & { json?: (data: unknown) => void }
type Middleware = (ctx: Context) => Promise<void>

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
    ) => MaybePromise<OptionsData>)
  | MaybePromise<OptionsData>

export interface RequestInfo {
  document: DocumentNode
  variables: { readonly [k: string]: unknown } | null
  operationName: string | null
  result: FormattedExecutionResult
  context?: unknown
}

export interface OptionsData {
  schema: GraphQLSchema
  context?: Context
  rootValue?: unknown
  pretty?: boolean
  validationRules?: ReadonlyArray<ValidationRule>
  customValidateFn?: (
    x: GraphQLSchema,
    n: DocumentNode,
    rs: ReadonlyArray<ValidationRule>
  ) => ReadonlyArray<GraphQLError>
  customExecuteFn?: (xs: ExecutionArgs) => MaybePromise<ExecutionResult>
  customFormatErrorFn?: (x: GraphQLError) => GraphQLFormattedError
  customParseFn?: (x: Source) => DocumentNode
  formatError?: (x: GraphQLError) => GraphQLFormattedError
  extensions?: (
    x: RequestInfo
  ) => MaybePromise<undefined | { [k: string]: unknown }>
  graphiql?: boolean | GraphiQLOptions
  fieldResolver?: GraphQLFieldResolver<unknown, unknown>
  typeResolver?: GraphQLTypeResolver<unknown, unknown>
}

export function graphqlHTTP(xs: Options): Middleware {
  if (xs == null) throw new TypeError("GraphQL needs options.")
  return async (ctx: Context): Promise<void> => {
    const inp = ctx.inp
    const req = ctx.req
    const res = ctx.res
    async function options(x?: GraphQLParams): Promise<OptionsData> {
      const y = await Promise.resolve(
        typeof xs === "function" ? xs(inp, res, x) : xs
      )
      if (typeof y !== "object")
        throw new TypeError("GraphQL options need an object.")
      return y
    }
    let ps: GraphQLParams | undefined
    let ios: GraphiQLOptions | undefined
    let show = false
    let pretty = false
    let errFn = formatError
    let y: ExecutionResult
    try {
      try {
        ps = await getGraphQLParams(inp)
      } catch (e: unknown) {
        const os = await options()
        pretty = os.pretty ?? pretty
        errFn = os.customFormatErrorFn ?? os.formatError ?? errFn
        throw e
      }
      const os = await options(ps)
      pretty = os.pretty ?? pretty
      errFn = os.customFormatErrorFn ?? os.formatError ?? errFn
      const schema = os.schema
      if (typeof schema !== "object")
        throw new TypeError("GraphQL options need a schema.")
      const fieldResolver = os.fieldResolver
      const typeResolver = os.typeResolver
      const graphiql = os.graphiql ?? false
      const context = os.context ?? ctx
      if (req.method !== "GET" && req.method !== "POST") {
        throw httpError(405, "GraphQL only supports GET and POST.", {
          headers: { Allow: "GET, POST" },
        })
      }
      const { query, variables, operationName } = ps
      show = canDisplayGraphiQL(inp, ps) && graphiql !== false
      if (typeof graphiql !== "boolean") ios = graphiql
      if (query == null) {
        if (show) return respondWithGraphiQL(res, ios)
        throw httpError(400, "Must provide query string.")
      }
      const se = validateSchema(schema)
      if (se.length > 0) {
        throw httpError(500, "GraphQL schema error.", {
          graphqlErrors: se,
        })
      }
      let ast: DocumentNode
      try {
        ast = (os.customParseFn ?? parse)(new Source(query, "GraphQL request"))
      } catch (e: unknown) {
        throw httpError(400, "GraphQL syntax error.", {
          graphqlErrors: [e],
        })
      }
      const ve = (os.customValidateFn ?? validate)(schema, ast, [
        ...specifiedRules,
        ...(os.validationRules ?? []),
      ])
      if (ve.length > 0) {
        throw httpError(400, "GraphQL validation error.", {
          graphqlErrors: ve,
        })
      }
      if (req.method === "GET") {
        const op = getOperationAST(ast, operationName)
        if (op && op.operation !== "query") {
          if (show) return respondWithGraphiQL(res, ios, ps)
          throw httpError(
            405,
            `Can only perform a ${op.operation} operation from a POST request.`,
            { headers: { Allow: "POST" } }
          )
        }
      }
      try {
        y = await (os.customExecuteFn ?? execute)({
          schema,
          document: ast,
          rootValue: os.rootValue,
          contextValue: context,
          variableValues: variables,
          operationName,
          fieldResolver,
          typeResolver,
        })
      } catch (e: unknown) {
        throw httpError(400, "GraphQL context error.", {
          graphqlErrors: [e],
        })
      }
      if (os.extensions) {
        const es = await os.extensions({
          document: ast,
          variables,
          operationName,
          result: y,
          context,
        })
        if (es != null) y = { ...y, extensions: es }
      }
    } catch (e: unknown) {
      const e2 = httpError(500, e instanceof Error ? e : String(e))
      res.statusCode = e2.status
      const { headers } = e2
      if (headers != null) {
        for (const [k, v] of Object.entries(headers)) {
          res.setHeader(k, String(v))
        }
      }
      if (e2["graphqlErrors"] == null) {
        const e3 = new GraphQLError(
          e2.message,
          undefined,
          undefined,
          undefined,
          undefined,
          e2
        )
        y = { data: null, errors: [e3] }
      } else y = { data: null, errors: e2["graphqlErrors"] }
    }
    if (res.statusCode === 200 && y.data == null) res.statusCode = 500
    const y2: FormattedExecutionResult = { ...y, errors: y.errors!.map(errFn) }
    if (show) return respondWithGraphiQL(res, ios, ps, y2)
    if (!pretty && typeof res.json === "function") res.json(y2)
    else {
      const y3 = JSON.stringify(y2, null, pretty ? 2 : 0)
      sendResponse(res, "application/json", y3)
    }
  }
}

async function getGraphQLParams(x: Request): Promise<GraphQLParams> {
  const url = new URLSearchParams(x.url?.split("?")[1])
  const body = await parseBody(x)
  let query = url.get("query") ?? (body["query"] as string | null)
  if (typeof query !== "string") query = null
  let variables = (url.get("variables") ?? body["variables"]) as {
    readonly [name: string]: unknown
  } | null
  if (typeof variables === "string") {
    try {
      variables = JSON.parse(variables)
    } catch {
      throw httpError(400, "Variables are invalid JSON.")
    }
  } else if (typeof variables !== "object") variables = null
  let operationName =
    url.get("operationName") ?? (body["operationName"] as string | null)
  if (typeof operationName !== "string") operationName = null
  const raw = url.get("raw") != null || body["raw"] !== undefined
  return { query, variables, operationName, raw }
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
  result?: FormattedExecutionResult
) {
  const data: GraphiQLData = {
    query: ps?.query,
    variables: ps?.variables,
    operationName: ps?.operationName,
    result,
  }
  const y = renderGraphiQL(data, os)
  return sendResponse(x, "text/html", y)
}
