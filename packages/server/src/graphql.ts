import * as qg from "graphql"
import { DefinitionNode, Location } from "graphql/language/ast"
import type {
  execute,
  formatError,
  getOperationAST,
  Source,
  specifiedRules,
  validate,
  validateSchema,
  ASTVisitor,
  DocumentNode,
  ExecutionArgs,
  ExecutionResult,
  FormattedExecutionResult,
  GraphQLError,
  GraphQLFieldResolver,
  GraphQLFormattedError,
  GraphQLSchema,
  GraphQLTypeResolver,
  ValidationContext,
  ValidationRule,
} from "graphql"
import type { Context, Request, Response } from "./types"
import type * as qt from "./types.js"
import * as accepts from "accepts"
import type { Inflate, Gunzip } from "zlib"
import * as zlib from "zlib"
import * as qstring from "querystring"
import * as getBody from "raw-body"
import HttpError from "http-errors"
import * as contentType from "content-type"
import type * as http from "http"
import { visit, visitInParallel, Kind } from `gatsby/graphql`
import _ = require(`lodash`)
import uuidv4 = require(`uuid/v4`)
import { buildSchema, printSchema } from `gatsby/graphql`
import { wrapSchema, introspectSchema, RenameTypes } from `@graphql-tools/wrap`
import { linkToExecutor } from `@graphql-tools/links`
import { createHttpLink } from `apollo-link-http`
import invariant = require(`invariant`)
import { GraphQLObjectType, GraphQLNonNull } from `gatsby/graphql`
import { mapSchema, MapperKind, addTypes, modifyObjectFields } from `@graphql-tools/utils`
import nodeFetch = require(`node-fetch`)
import DataLoader = require(`dataloader`)
import { ApolloLink, Observable } from `apollo-link`
import { print } from `gatsby/graphql`

declare function loadFileStaticallyFromNPM(npmPath: string): string

export namespace gql {
  const cache = new Map<string, DocumentNode>()
  const map = new Map<string, Set<string>>()
  let vars = false
  let warn = true
  export function resetCaches() {
    cache.clear()
    map.clear()
  }
  export function disableWarnings() {
    warn = false
  }
  export function enableFragVars() {
    vars = true
  }
  export function disableFragVars() {
    vars = false
  }
  export function gql(literals: string | readonly string[], ...xs: any[]) {
    if (typeof literals === "string") literals = [literals]
    let ys = literals[0]
    xs.forEach((x, i) => {
      if (x && x.kind === "Document") ys += x.loc.source.body
      else ys += x
      ys += literals[i + 1]
    })
    const normalize = (x: string) => {
      return x.replace(/[\s,]+/g, " ").trim()
    }
    const define = (d: DocumentNode) => {
      const definitions: DefinitionNode[] = []
      const done = new Set<string>()
      const key = (x: Location) => normalize(x.source.body.substring(x.start, x.end))
      d.definitions.forEach(x => {
        if (x.kind === "FragmentDefinition") {
          const n = x.name.value
          const k = key(x.loc!)
          let ks = map.get(n)!
          if (ks && !ks.has(k)) {
            if (warn) console.warn("Warning: fragment with name " + n + " already exists")
          } else if (!ks) map.set(n, (ks = new Set()))
          ks.add(k)
          if (!done.has(k)) {
            done.add(k)
            definitions.push(x)
          }
        } else definitions.push(x)
      })
      return { ...d, definitions }
    }
    const strip = (d: DocumentNode) => {
      const xs = new Set<Record<string, any>>(d.definitions)
      xs.forEach(x => {
        if (x.loc) delete x.loc
        Object.keys(x).forEach(k => {
          const v = x[k]
          if (v && typeof v === "object") xs.add(v)
        })
      })
      const x = d.loc as Record<string, any>
      if (x) {
        delete x.startToken
        delete x.endToken
      }
      return d
    }
    return ((x: string) => {
      const k = normalize(x)
      if (!cache.has(k)) {
        const y = qg.parse(x, { experimentalFragmentVariables: vars })
        if (y.kind !== "Document") throw new Error("Not valid GraphQL")
        cache.set(k, strip(define(y)))
      }
      return cache.get(k)!
    })(ys)
  }
}

type Request = http.IncomingMessage & { url: string; body?: unknown }
//type Response = ServerResponse & { json?: (data: unknown) => void }
//type Middleware = (request: Request, response: Response) => Promise<void>
//type Middleware = (ctx: Context) => Promise<void>

export interface GraphQLParams {
  query: string | null
  variables: qt.Dict | null
  operationName: string | null
  raw: boolean
}
export interface GraphiQLOptions {
  defaultQuery?: string
  headerEditorEnabled?: boolean
  subscriptionEndpoint?: string
}
export interface RequestInfo {
  document: DocumentNode
  variables: { readonly [k: string]: unknown } | null
  operationName: string | null
  result: FormattedExecutionResult
  context?: unknown
}
export interface OptionsData {
  schema: GraphQLSchema
  context?: qt.Context
  rootValue?: unknown
  pretty?: boolean
  formatError?: (e: GraphQLError, context?: any) => GraphQLFormattedError
  validationRules?: ReadonlyArray<(ctx: ValidationContext) => ASTVisitor>
  extensions?: (info: RequestInfo) => qt.MaybePromise<undefined | qt.Dict>
  graphiql?: boolean | GraphiQLOptions
  fieldResolver?: GraphQLFieldResolver<unknown, unknown>
  customValidateFn?: (
    schema: GraphQLSchema,
    documentAST: DocumentNode,
    rules: ReadonlyArray<ValidationRule>
  ) => ReadonlyArray<GraphQLError>
  customExecuteFn?: (args: ExecutionArgs) => qt.MaybePromise<ExecutionResult>
  customFormatErrorFn?: (error: GraphQLError) => GraphQLFormattedError
  customParseFn?: (source: Source) => DocumentNode
  typeResolver?: GraphQLTypeResolver<unknown, unknown>
}
export type Options =
  | ((
      request: Request,
      response: Response,
      params?: GraphQLParams,
      ctx?: Context
    ) => qt.MaybePromise<OptionsData>)
  | qt.MaybePromise<OptionsData>

type EditorTheme = { name: string; link: string } | {}
type EditorThemeParam = { name: string; url: string } | string
export interface GraphiQLData {
  query?: string | null
  variables?: qt.Dict | null
  operationName?: string | null
  result?: FormattedExecutionResult
  editorTheme?: EditorThemeParam
}

export async function getParams(req: Request): Promise<GraphQLParams> {
  const u = new URLSearchParams(req.url.split("?")[1])
  async function parseBody(): Promise<qt.Dict> {
    const { body } = req
    if (typeof body === "object" && !(body instanceof Buffer)) return body as qt.Dict
    if (req.headers["content-type"] === undefined) return {}
    const t = contentType.parse(req)
    if (typeof body === "string" && t.type === "application/graphql") return { query: body }
    if (body != null) return {}
    async function readBody(): Promise<string> {
      const cs = t.parameters.charset?.toLowerCase() ?? "utf-8"
      if (!cs.startsWith("utf-")) throw HttpError(415, `Unsupported charset "${cs.toUpperCase()}"`)
      const x = req.headers["content-encoding"]
      const e = typeof x === "string" ? x.toLowerCase() : "identity"
      const decompressed = (): Request | Inflate | Gunzip => {
        switch (e) {
          case "identity":
            return req
          case "deflate":
            return req.pipe(zlib.createInflate())
          case "gzip":
            return req.pipe(zlib.createGunzip())
        }
        throw HttpError(415, `Unsupported content-encoding "${e}"`)
      }
      const length = e === "identity" ? req.headers["content-length"] ?? null : null
      const limit = 100 * 1024
      try {
        return await getBody(decompressed(), { encoding: cs, length, limit })
      } catch (e: unknown) {
        const e2 = HttpError(400, e instanceof Error ? e : String(e))
        e2.message =
          e2.type === "encoding.unsupported"
            ? `Unsupported charset "${cs.toUpperCase()}"`
            : `Invalid body: ${e2.message}`
        throw e2
      }
    }
    const b = await readBody()
    switch (t.type) {
      case "application/graphql":
        return { query: b }
      case "application/json":
        const re = /^[ \t\n\r]*\{/
        if (re.test(b)) {
          try {
            return JSON.parse(b)
          } catch {}
        }
        throw HttpError(400, "POST body sent invalid JSON")
      case "application/x-www-form-urlencoded":
        return qstring.parse(b)
    }
    return {}
  }
  const b = await parseBody()
  let query = u.get("query") ?? (b.query as string | null)
  if (typeof query !== "string") query = null
  let variables = (u.get("variables") ?? b.variables) as qt.Dict | null
  if (typeof variables === "string") {
    try {
      variables = JSON.parse(variables)
    } catch {
      throw HttpError(400, "Variables are invalid JSON")
    }
  } else if (typeof variables !== "object") variables = null
  let operationName = u.get("operationName") ?? (b.operationName as string | null)
  if (typeof operationName !== "string") operationName = null
  const raw = u.get("raw") != null || b.raw !== undefined
  return { query, variables, operationName, raw }
}

export namespace graphqlHTTP {
  function canDisplayGraphiQL(x: Request, ps: GraphQLParams) {
    return !ps.raw && x.accepts(["json", "html"]) === "html"
  }
  export function graphqlHTTP(options: Options): Middleware {
    if (!options) throw new Error("Middleware requires options")
    return async (ctx: qt.Context): Promise<void> => {
      const inp = ctx.inp
      const req = ctx.req
      const res = ctx.res
      let pretty: boolean | undefined
      let graphiql: boolean | GraphiQLOptions | undefined
      let format: Function | undefined
      let show = false
      let y
      try {
        if (req.method !== "GET" && req.method !== "POST") {
          res.set("Allow", "GET, POST")
          throw HttpError(405, "GraphQL only supports GET and POST requests")
        }
        const ops = await (typeof options === "function" ? options(req, res, ctx) : options)
        if (!ops || typeof ops !== "object") throw new Error("Option function must return options")
        if (!ops.schema) throw new Error("Options must contain a schema")
        ctx = ops.context || ctx
        pretty = ops.pretty
        graphiql = ops.graphiql
        format = ops.formatError
        let ast: qg.DocumentNode
        let rules = qg.specifiedRules
        if (ops.validationRules) rules = rules.concat(ops.validationRules)
        inp.body = inp.body || req.body
        const ps: GraphQLParams = await getParams(inp)
        show = (graphiql && canDisplayGraphiQL(inp, ps)) ?? false
        y = await new Promise(resolve => {
          if (!ps.query) {
            if (show) return resolve(null)
            throw HttpError(400, "Must provide query string")
          }
          let es = validateSchema(ops.schema)
          if (es.length > 0) {
            res.status = 500
            return resolve({ errors: es })
          }
          try {
            ast = qg.parse(new Source(ps.query, "GraphQL request"))
          } catch (e) {
            res.status = 400
            return resolve({ errors: [e] })
          }
          es = validate(ops.schema, ast, rules)
          if (es.length > 0) {
            res.status = 400
            return resolve({ errors: es })
          }
          if (req.method === "GET") {
            const x = getOperationAST(ast, ps.operationName)
            if (x && x.operation !== "query") {
              if (show) return resolve(null)
              res.set("Allow", "POST")
              throw HttpError(405, `Can only perform a ${x.operation} ` + "from a POST")
            }
          }
          try {
            resolve(
              execute(
                ops.schema,
                ast,
                ops.rootValue,
                ctx,
                ps.variables,
                ps.operationName,
                ops.fieldResolver
              )
            )
            res.status = 200
          } catch (e) {
            res.status = 400
            resolve({ errors: [e] })
          }
        })
        if (y && ops.extensions) {
          y = await Promise.resolve(
            ops.extensions({
              document: ast,
              variables: ps.variables,
              operationName: ps.operationName,
              result: y,
              context: ctx,
            })
          ).then(x => {
            if (x && typeof x === "object") y.extensions = x
            return y
          })
        }
      } catch (e) {
        res.status = e.status || 500
        y = { errors: [e] }
      }
      if (res.status === 200 && y && !y.data) res.status = 500
      if (y.errors) y.errors = y.errors.map(x => (format ? format(x, ctx) : formatError(x)))
      if (show) {
        res.type = "text/html"
        res.body = renderGraphiQL(
          Object.assign(
            {
              query: ps.query,
              variables: ps.variables,
              operationName: ps.operationName,
              result: y,
            },
            graphiql
          )
        )
      } else {
        res.type = "application/json"
        res.body = pretty ? JSON.stringify(y, null, 2) : y
      }
    }
  }
}
function safeSerialize(x?: string | boolean | null): string {
  return x != null ? JSON.stringify(x).replace(/\//g, "\\/") : "undefined"
}
export namespace graphqlHTTP2 {
  const canDisplayGraphiQL = (x: Request, ps: GraphQLParams) => {
    return !ps.raw && accepts(x).types(["json", "html"]) === "html"
  }
  const sendResponse = (x: Response, type: string, data: string) => {
    const chunk = Buffer.from(data, "utf8")
    x.setHeader("Content-Type", type + "; charset=utf-8")
    x.setHeader("Content-Length", String(chunk.length))
    x.end(chunk)
  }
  function respondWithGraphiQL(
    x: Response,
    opts?: GraphiQLOptions,
    ps?: GraphQLParams,
    y?: FormattedExecutionResult
  ) {
    const data: GraphiQLData = {
      query: ps?.query,
      variables: ps?.variables,
      operationName: ps?.operationName,
      result: y,
    }
    return sendResponse(x, "text/html", renderGraphiQL(data, opts))
  }
  export function graphqlHTTP(opts: Options) {
    const devAssert = (x: unknown, m: string) => {
      if (!Boolean(x)) throw new TypeError(m)
    }
    const devAssertIsNonNullable = (x: unknown, m: string) => {
      devAssert(x != null, m)
    }
    const devAssertIsObject = (x: unknown, m: string) => {
      devAssert(x != null && typeof x === "object", m)
    }
    devAssertIsNonNullable(opts, "GraphQL middleware requires options.")
    return async (request: Request, response: Response): Promise<void> => {
      let params: GraphQLParams | undefined
      let showGraphiQL = false
      let graphiqlOptions
      let formatErrorFn = formatError
      let pretty = false
      let result: ExecutionResult
      try {
        try {
          params = await getParams(request)
        } catch (error: unknown) {
          const optionsData = await resolveOptions()
          pretty = optionsData.pretty ?? false
          formatErrorFn =
            optionsData.customFormatErrorFn ?? optionsData.formatError ?? formatErrorFn
          throw error
        }
        const optionsData: OptionsData = await resolveOptions(params)
        const schema = optionsData.schema
        const rootValue = optionsData.rootValue
        const validationRules = optionsData.validationRules ?? []
        const fieldResolver = optionsData.fieldResolver
        const typeResolver = optionsData.typeResolver
        const graphiql = optionsData.graphiql ?? false
        const extensionsFn = optionsData.extensions
        const context = optionsData.context ?? request
        const parseFn = optionsData.customParseFn ?? parse
        const executeFn = optionsData.customExecuteFn ?? execute
        const validateFn = optionsData.customValidateFn ?? validate
        pretty = optionsData.pretty ?? false
        formatErrorFn = optionsData.customFormatErrorFn ?? optionsData.formatError ?? formatErrorFn
        devAssertIsObject(schema, "GraphQL middleware options must contain a schema.")
        if (request.method !== "GET" && request.method !== "POST") {
          throw HttpError(405, "GraphQL only supports GET and POST requests.", {
            headers: { Allow: "GET, POST" },
          })
        }
        const { query, variables, operationName } = params
        showGraphiQL = canDisplayGraphiQL(request, params) && graphiql !== false
        if (typeof graphiql !== "boolean") {
          graphiqlOptions = graphiql
        }
        if (query == null) {
          if (showGraphiQL) {
            return respondWithGraphiQL(response, graphiqlOptions)
          }
          throw HttpError(400, "Must provide query string.")
        }
        const schemaValidationErrors = validateSchema(schema)
        if (schemaValidationErrors.length > 0) {
          throw HttpError(500, "GraphQL schema validation error.", {
            graphqlErrors: schemaValidationErrors,
          })
        }
        let documentAST
        try {
          documentAST = parseFn(new Source(query, "GraphQL request"))
        } catch (syntaxError: unknown) {
          throw HttpError(400, "GraphQL syntax error.", {
            graphqlErrors: [syntaxError],
          })
        }
        const validationErrors = validateFn(schema, documentAST, [
          ...specifiedRules,
          ...validationRules,
        ])
        if (validationErrors.length > 0) {
          throw HttpError(400, "GraphQL validation error.", {
            graphqlErrors: validationErrors,
          })
        }
        if (request.method === "GET") {
          const operationAST = getOperationAST(documentAST, operationName)
          if (operationAST && operationAST.operation !== "query") {
            if (showGraphiQL) {
              return respondWithGraphiQL(response, graphiqlOptions, params)
            }
            throw HttpError(
              405,
              `Can only perform a ${operationAST.operation} operation from a POST request.`,
              { headers: { Allow: "POST" } }
            )
          }
        }
        try {
          result = await executeFn({
            schema,
            document: documentAST,
            rootValue,
            contextValue: context,
            variableValues: variables,
            operationName,
            fieldResolver,
            typeResolver,
          })
        } catch (contextError: unknown) {
          throw HttpError(400, "GraphQL execution context error.", {
            graphqlErrors: [contextError],
          })
        }
        if (extensionsFn) {
          const extensions = await extensionsFn({
            document: documentAST,
            variables,
            operationName,
            result,
            context,
          })
          if (extensions != null) {
            result = { ...result, extensions }
          }
        }
      } catch (e: unknown) {
        const e2: HttpError = HttpError(500, e instanceof Error ? e : String(e))
        response.statusCode = e2.status
        const { headers } = e2
        if (headers != null) {
          for (const [key, value] of Object.entries(headers)) {
            response.setHeader(key, String(value))
          }
        }
        if (e2.graphqlErrors == null) {
          const graphqlError = new GraphQLError(
            e2.message,
            undefined,
            undefined,
            undefined,
            undefined,
            e2
          )
          result = { data: undefined, errors: [graphqlError] }
        } else {
          result = { data: undefined, errors: e2.graphqlErrors }
        }
      }
      if (response.statusCode === 200 && result.data == null) {
        response.statusCode = 500
      }
      const formattedResult: FormattedExecutionResult = {
        ...result,
        errors: result.errors?.map(formatErrorFn),
      }
      if (showGraphiQL) {
        return respondWithGraphiQL(response, graphiqlOptions, params, formattedResult)
      }
      if (!pretty && typeof response.json === "function") {
        response.json(formattedResult)
      } else {
        const payload = JSON.stringify(formattedResult, null, pretty ? 2 : 0)
        sendResponse(response, "application/json", payload)
      }
      async function resolveOptions(ps?: GraphQLParams): Promise<OptionsData> {
        const y = await Promise.resolve(
          typeof opts === "function" ? opts(request, response, ps) : opts
        )
        devAssertIsObject(
          y,
          "GraphQL middleware option function must return an options object or a promise which will be resolved to an options object."
        )
        if (y.formatError) {
          console.warn(
            "`formatError` is deprecated and replaced by `customFormatErrorFn`. It will be removed in version 1.0.0."
          )
        }
        return y
      }
    }
  }
}

export function renderGraphiQL(data: GraphiQLData): string {
  const queryString = data.query
  const variablesString = data.variables ? JSON.stringify(data.variables, null, 2) : null
  const resultString = data.result ? JSON.stringify(data.result, null, 2) : null
  const operationName = data.operationName
  function getEditorThemeParams(editorTheme: EditorThemeParam): EditorTheme {
    if (!editorTheme) {
      return {}
    }
    if (typeof editorTheme === "string") {
      return {
        name: editorTheme,
        link: `<link href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODE_MIRROR_VERSION}/theme/${editorTheme}.css" rel="stylesheet" />`,
      }
    }
    if (
      typeof editorTheme === "object" &&
      editorTheme.name &&
      typeof editorTheme.name === "string" &&
      editorTheme.url &&
      typeof editorTheme.url === "string"
    ) {
      return {
        link: `<link href="${editorTheme.url}" rel="stylesheet" />`,
        name: editorTheme.name,
      }
    }
    throw Error(
      'invalid parameter "editorTheme": should be undefined/null, string or ' +
        `{name: string, url: string} but provided is "${editorTheme}"`
    )
  }
  const editorTheme = getEditorThemeParams(data.editorTheme)
  return `<!--
The request to this GraphQL server provided the header "Accept: text/html"
and as a result has been presented GraphiQL - an in-browser IDE for
exploring GraphQL.
If you wish to receive JSON, provide the header "Accept: application/json" or
add "&raw" to the end of the URL within a browser.
-->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <meta name="referrer" content="origin" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      overflow: hidden;
    }
    #graphiql {
      height: 100vh;
    }
  </style>
  <link href="//cdn.jsdelivr.net/npm/graphiql@${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
  ${editorTheme.link || ""}
  <script src="//cdn.jsdelivr.net/es6-promise/4.0.5/es6-promise.auto.min.js"></script>
  <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/15.4.2/react.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/15.4.2/react-dom.min.js"></script>
  <script src="//cdn.jsdelivr.net/npm/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js"></script>
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).filter(function (key) {
        return Boolean(params[key]);
      }).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };
    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);
    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.json();
      });
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }
    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      updateURL();
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        editorTheme: ${editorTheme.name && safeSerialize(editorTheme.name)},
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)},
      }),
      document.getElementById('graphiql')
    );
  </script>
</body>
</html>`
}

export function renderGraphiQL(data: GraphiQLData, options?: GraphiQLOptions): string {
  const queryString = data.query
  const variablesString = data.variables != null ? JSON.stringify(data.variables, null, 2) : null
  const resultString = data.result != null ? JSON.stringify(data.result, null, 2) : null
  const operationName = data.operationName
  const defaultQuery = options?.defaultQuery
  const headerEditorEnabled = options?.headerEditorEnabled
  const subscriptionEndpoint = options?.subscriptionEndpoint
  let subscriptionScripts = ""
  if (subscriptionEndpoint != null) {
    subscriptionScripts = `
    <script>
      ${loadFileStaticallyFromNPM("subscriptions-transport-ws/browser/client.js")}
    </script>
    <script>
      ${loadFileStaticallyFromNPM("graphiql-subscriptions-fetcher/browser/client.js")}
    </script>
    `
  }
  return `<!--
The request to this GraphQL server provided the header "Accept: text/html"
and as a result has been presented GraphiQL - an in-browser IDE for
exploring GraphQL.
If you wish to receive JSON, provide the header "Accept: application/json" or
add "&raw" to the end of the URL within a browser.
-->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <meta name="referrer" content="origin" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      overflow: hidden;
    }
    #graphiql {
      height: 100vh;
    }
  </style>
  <style>
    ${loadFileStaticallyFromNPM("graphiql/graphiql.css")}
  </style>
  <script>
    // promise-polyfill/dist/polyfill.min.js
    ${loadFileStaticallyFromNPM("promise-polyfill/dist/polyfill.min.js")}
  </script>
  <script>
    // unfetch/dist/unfetch.umd.js
    ${loadFileStaticallyFromNPM("unfetch/dist/unfetch.umd.js")}
  </script>
  <script>
    // react/umd/react.production.min.js
    ${loadFileStaticallyFromNPM("react/umd/react.production.min.js")}
  </script>
  <script>
    // react-dom/umd/react-dom.production.min.js
    ${loadFileStaticallyFromNPM("react-dom/umd/react-dom.production.min.js")}
  </script>
  <script>
    // graphiql/graphiql.min.js
    ${loadFileStaticallyFromNPM("graphiql/graphiql.min.js")}
  </script>
  ${subscriptionScripts}
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).filter(function (key) {
        return Boolean(params[key]);
      }).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };
    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);
    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams, opts) {
      return fetch(fetchURL, {
        method: 'post',
        headers: Object.assign(
          {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          opts && opts.headers,
        ),
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.json();
      });
    }
    function makeFetcher() {
      if('${typeof subscriptionEndpoint}' == 'string') {
        let clientClass = window.SubscriptionsTransportWs.SubscriptionClient;
        let client = new clientClass(${safeSerialize(subscriptionEndpoint)}, {
           reconnect: true
        });
        return window.GraphiQLSubscriptionsFetcher.graphQLFetcher(client, graphQLFetcher);
      }else{
        return graphQLFetcher;
      }
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }
    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      updateURL();
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher:  makeFetcher(),
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)},
        defaultQuery: ${safeSerialize(defaultQuery)},
        headerEditorEnabled: ${safeSerialize(headerEditorEnabled)},
      }),
      document.getElementById('graphiql')
    );
  </script>
</body>
</html>`
}
export namespace other {
  export class NamespaceUnderFieldTransform {
    constructor({ typeName, fieldName, resolver }) {
      this.typeName = typeName
      this.fieldName = fieldName
      this.resolver = resolver
    }
    transformSchema(schema) {
      const queryConfig = schema.getQueryType().toConfig()
      const nestedQuery = new GraphQLObjectType({
        ...queryConfig,
        name: this.typeName,
      })
      let newSchema = addTypes(schema, [nestedQuery])
      const newRootFieldConfigMap = {
        [this.fieldName]: {
          type: new GraphQLNonNull(nestedQuery),
          resolve: (parent, args, context, info) => {
            if (this.resolver != null) {
              return this.resolver(parent, args, context, info)
            }
            return {}
          },
        },
      }
      ;[newSchema] = modifyObjectFields(
        newSchema,
        queryConfig.name,
        () => true,
        newRootFieldConfigMap
      )
      return newSchema
    }
  }
  export class StripNonQueryTransform {
    transformSchema(schema) {
      return mapSchema(schema, {
        [MapperKind.MUTATION]() {
          return null
        },
        [MapperKind.SUBSCRIPTION]() {
          return null
        },
      })
    }
  }
  const Prefix = {
    create: index => `gatsby${index}_`,
    parseKey: prefixedKey => {
      const match = /^gatsby([\d]+)_(.*)$/.exec(prefixedKey)
      if (!match || match.length !== 3 || isNaN(Number(match[1])) || !match[2]) {
        throw new Error(`Unexpected data key: ${prefixedKey}`)
      }
      return { index: Number(match[1]), originalKey: match[2] }
    },
  }
  export async function sourceNodes(
    { actions, createNodeId, cache, createContentDigest },
    options
  ) {
    const { addThirdPartySchema, createNode } = actions
    async function fetchWrapper(uri, options) {
      const response = await nodeFetch(uri, options)
      if (response.status >= 400) {
        throw new Error(`Source GraphQL API: HTTP error ${response.status} ${response.statusText}`)
      }
      return response
    }
    const {
      url,
      typeName,
      fieldName,
      headers = {},
      fetch = fetchWrapper,
      fetchOptions = {},
      createLink,
      createSchema,
      refetchInterval,
      batch = false,
      transformSchema,
    } = options
    invariant(
      typeName && typeName.length > 0,
      `gatsby-source-graphql requires option \`typeName\` to be specified`
    )
    invariant(
      fieldName && fieldName.length > 0,
      `gatsby-source-graphql requires option \`fieldName\` to be specified`
    )
    invariant(
      (url && url.length > 0) || createLink,
      `gatsby-source-graphql requires either option \`url\` or \`createLink\` callback`
    )
    let link
    if (createLink) {
      link = await createLink(options)
    } else {
      const options = {
        uri: url,
        fetch,
        fetchOptions,
        headers: typeof headers === `function` ? await headers() : headers,
      }
      function createDataloaderLink(options) {
        const load = async keys => {
          const query = merge(keys)
          async function request(query, options) {
            const { uri, headers = {}, fetch, fetchOptions } = options
            const body = JSON.stringify({
              query: print(query.query),
              variables: query.variables,
            })
            const response = await fetch(uri, {
              method: `POST`,
              ...fetchOptions,
              headers: Object.assign({ "Content-Type": `application/json` }, headers),
              body,
            })
            return response.json()
          }
          const result = await request(query, options)
          function isValidGraphQLResult(response) {
            return response && response.data && (!response.errors || response.errors.length === 0)
          }
          function formatErrors(result) {
            if (result?.errors?.length > 0) {
              return result.errors
                .map(error => {
                  const { message, path = [] } = error
                  return path.length > 0 ? `${message} (path: ${JSON.stringify(path)})` : message
                })
                .join(`\n`)
            }
            return `Unexpected GraphQL result`
          }
          if (!isValidGraphQLResult(result)) {
            const error = new Error(`Failed to load query batch:\n${formatErrors(result)}`)
            error.name = `GraphQLError`
            error.originalResult = result
            throw error
          }
          function resolveResult(mergedQueryResult) {
            const data = mergedQueryResult.data
            return Object.keys(data).reduce((acc, prefixedKey) => {
              const { index, originalKey } = Prefix.parseKey(prefixedKey)
              if (!acc[index]) acc[index] = { data: {} }
              acc[index].data[originalKey] = data[prefixedKey]
              return acc
            }, [])
          }
          return resolveResult(result)
        }
        const concurrency = Number(process.env.GATSBY_EXPERIMENTAL_QUERY_CONCURRENCY) || 4
        const maxBatchSize = Math.min(4, Math.round(concurrency / 5))
        const dataloader = new DataLoader(load, {
          cache: false,
          maxBatchSize,
          batchScheduleFn: callback => setTimeout(callback, 50),
          ...options.dataLoaderOptions,
        })
        return new ApolloLink(
          operation =>
            new Observable(observer => {
              const { query, variables } = operation
              dataloader
                .load({ query, variables })
                .then(response => {
                  operation.setContext({ response })
                  observer.next(response)
                  observer.complete()
                  return response
                })
                .catch(err => {
                  if (err.name === `AbortError`) {
                    return
                  }
                  observer.error(err)
                })
            })
        )
      }
      link = batch ? createDataloaderLink(options) : createHttpLink(options)
    }
    let introspectionSchema
    if (createSchema) {
      introspectionSchema = await createSchema(options)
    } else {
      const cacheKey = `gatsby-source-graphql-schema-${typeName}-${fieldName}`
      let sdl = await cache.get(cacheKey)
      if (!sdl) {
        introspectionSchema = await introspectSchema(linkToExecutor(link))
        sdl = printSchema(introspectionSchema)
      } else {
        introspectionSchema = buildSchema(sdl)
      }
      await cache.set(cacheKey, sdl)
    }
    const nodeId = createNodeId(`gatsby-source-graphql-${typeName}`)
    function createSchemaNode({ id, typeName, fieldName, createContentDigest }) {
      const nodeContent = uuidv4()
      const nodeContentDigest = createContentDigest(nodeContent)
      return {
        id,
        typeName: typeName,
        fieldName: fieldName,
        parent: null,
        children: [],
        internal: {
          type: `GraphQLSource`,
          contentDigest: nodeContentDigest,
          ignoreType: true,
        },
      }
    }
    const node = createSchemaNode({
      id: nodeId,
      typeName,
      fieldName,
      createContentDigest,
    })
    createNode(node)
    const resolver = (parent, args, context) => {
      context.nodeModel.createPageDependency({
        path: context.path,
        nodeId: nodeId,
      })
      return {}
    }
    const defaultTransforms = [
      new StripNonQueryTransform(),
      new RenameTypes(name => `${typeName}_${name}`),
      new NamespaceUnderFieldTransform({
        typeName,
        fieldName,
        resolver,
      }),
    ]
    const schema = transformSchema
      ? transformSchema({
          schema: introspectionSchema,
          link,
          resolver,
          defaultTransforms,
          options,
        })
      : wrapSchema({
          schema: introspectionSchema,
          executor: linkToExecutor(link),
          transforms: defaultTransforms,
        })
    addThirdPartySchema({ schema })
    if (process.env.NODE_ENV !== `production`) {
      if (refetchInterval) {
        const msRefetchInterval = refetchInterval * 1000
        const refetcher = () => {
          createNode(
            createSchemaNode({
              id: nodeId,
              typeName,
              fieldName,
              createContentDigest,
            })
          )
          setTimeout(refetcher, msRefetchInterval)
        }
        setTimeout(refetcher, msRefetchInterval)
      }
    }
  }
  function merge(queries) {
    const mergedVariables = {}
    const mergedVariableDefinitions = []
    const mergedSelections = []
    const mergedFragmentMap = new Map()
    function prefixNodeName(n, pre) {
      return { ...n, name: { ...n.name, value: pre + n.name.value } }
    }
    const Visitors = {
      detectFragmentsWithVariables: fragmentsWithVariables => {
        let currentFragmentName
        return {
          [Kind.FRAGMENT_DEFINITION]: {
            enter: def => {
              currentFragmentName = def.name.value
            },
            leave: () => {
              currentFragmentName = null
            },
          },
          [Kind.VARIABLE]: () => {
            if (currentFragmentName) {
              fragmentsWithVariables.add(currentFragmentName)
            }
          },
        }
      },
      prefixVariables: prefix => {
        return {
          [Kind.VARIABLE]: variable => prefixNodeName(variable, prefix),
        }
      },
      prefixFragmentNames: (prefix, fragmentNames) => {
        return {
          [Kind.FRAGMENT_DEFINITION]: def =>
            fragmentNames.has(def.name.value) ? prefixNodeName(def, prefix) : def,
          [Kind.FRAGMENT_SPREAD]: def =>
            fragmentNames.has(def.name.value) ? prefixNodeName(def, prefix) : def,
        }
      },
    }
    queries.forEach((query, index) => {
      function prefixQueryParts(prefix, query) {
        function inlineFragmentSpread(spread, document) {
          const fragment = document.definitions.find(
            def => def.kind === Kind.FRAGMENT_DEFINITION && def.name.value === spread.name.value
          )
          if (!fragment) {
            throw new Error(`Fragment ${spread.name.value} does not exist`)
          }
          const { typeCondition, selectionSet } = fragment
          return {
            kind: Kind.INLINE_FRAGMENT,
            typeCondition,
            selectionSet,
            directives: spread.directives,
          }
        }
        function addSkipDirective(node) {
          const skipDirective = {
            kind: Kind.DIRECTIVE,
            name: { kind: Kind.NAME, value: `skip` },
            arguments: [
              {
                kind: Kind.ARGUMENT,
                name: { kind: Kind.NAME, value: `if` },
                value: { kind: Kind.BOOLEAN, value: true },
              },
            ],
          }
          return {
            ...node,
            directives: [skipDirective],
          }
        }
        function aliasField(field, aliasPrefix) {
          const aliasNode = field.alias ? field.alias : field.name
          return {
            ...field,
            alias: {
              ...aliasNode,
              value: aliasPrefix + aliasNode.value,
            },
          }
        }
        function aliasFieldsInSelection(prefix, selections, document) {
          return _.flatMap(selections, selection => {
            switch (selection.kind) {
              case Kind.INLINE_FRAGMENT:
                return [aliasFieldsInInlineFragment(prefix, selection, document)]
              case Kind.FRAGMENT_SPREAD: {
                const inlineFragment = inlineFragmentSpread(selection, document)
                return [
                  addSkipDirective(selection),
                  aliasFieldsInInlineFragment(prefix, inlineFragment, document),
                ]
              }
              case Kind.FIELD:
              default:
                return [aliasField(selection, prefix)]
            }
          })
        }
        function aliasTopLevelFields(prefix, doc) {
          const transformer = {
            [Kind.OPERATION_DEFINITION]: def => {
              const { selections } = def.selectionSet
              return {
                ...def,
                selectionSet: {
                  ...def.selectionSet,
                  selections: aliasFieldsInSelection(prefix, selections, doc),
                },
              }
            },
          }
          return visit(doc, transformer, { [Kind.DOCUMENT]: [`definitions`] })
        }
        let document = aliasTopLevelFields(prefix, query.query)
        const variableNames = Object.keys(query.variables)
        if (variableNames.length === 0) {
          return { ...query, query: document }
        }
        const fragmentsWithVariables = new Set()
        document = visit(
          document,
          visitInParallel([
            Visitors.detectFragmentsWithVariables(fragmentsWithVariables),
            Visitors.prefixVariables(prefix),
          ])
        )
        if (fragmentsWithVariables.size > 0) {
          document = visit(document, Visitors.prefixFragmentNames(prefix, fragmentsWithVariables), {
            [Kind.DOCUMENT]: [`definitions`],
            [Kind.OPERATION_DEFINITION]: [`selectionSet`],
            [Kind.FRAGMENT_DEFINITION]: [`selectionSet`],
            [Kind.INLINE_FRAGMENT]: [`selectionSet`],
            [Kind.FIELD]: [`selectionSet`],
            [Kind.SELECTION_SET]: [`selections`],
          })
        }
        const prefixedVariables = variableNames.reduce((acc, name) => {
          acc[prefix + name] = query.variables[name]
          return acc
        }, {})
        return {
          query: document,
          variables: prefixedVariables,
        }
      }
      const prefixedQuery = prefixQueryParts(Prefix.create(index), query)
      prefixedQuery.query.definitions.forEach(def => {
        function isQueryDefinition(def) {
          return def.kind === Kind.OPERATION_DEFINITION && def.operation === `query`
        }
        if (isQueryDefinition(def)) {
          mergedSelections.push(...def.selectionSet.selections)
          mergedVariableDefinitions.push(...(def.variableDefinitions ?? []))
        }
        function isFragmentDefinition(def) {
          return def.kind === Kind.FRAGMENT_DEFINITION
        }
        if (isFragmentDefinition(def)) {
          mergedFragmentMap.set(def.name.value, def)
        }
      })
      Object.assign(mergedVariables, prefixedQuery.variables)
    })
    const mergedQueryDefinition = {
      kind: Kind.OPERATION_DEFINITION,
      operation: `query`,
      variableDefinitions: mergedVariableDefinitions,
      selectionSet: {
        kind: Kind.SELECTION_SET,
        selections: mergedSelections,
      },
    }
    return {
      query: {
        kind: Kind.DOCUMENT,
        definitions: [mergedQueryDefinition, ...mergedFragmentMap.values()],
      },
      variables: mergedVariables,
    }
  }
}
