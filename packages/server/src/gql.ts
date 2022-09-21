import type {
  ASTVisitor,
  DocumentNode,
  ExecutionArgs,
  ExecutionResult,
  FormattedExecutionResult,
  GraphQLSchema,
  GraphQLFieldResolver,
  GraphQLTypeResolver,
  GraphQLFormattedError,
  ValidationContext,
} from "graphql"
import type { GraphQLParams, RequestInfo } from "express-graphql"
import httpError from "http-errors"
import {
  Source,
  GraphQLError,
  validateSchema,
  parse,
  validate,
  execute,
  formatError,
  getOperationAST,
  specifiedRules,
} from "graphql"
import { getGraphQLParams } from "express-graphql"
import type { Context, Request, Response } from "koa"
import { renderGraphiQL } from "./renderGraphiQL"
import type { GraphiQLOptions, GraphiQLData } from "./renderGraphiQL"
type MaybePromise<T> = Promise<T> | T
export type Options =
  | ((
      request: Request,
      response: Response,
      ctx: Context,
      params?: GraphQLParams
    ) => OptionsResult)
  | OptionsResult
export type OptionsResult = MaybePromise<OptionsData>
export interface OptionsData {
  schema: GraphQLSchema
  context?: unknown
  rootValue?: unknown
  pretty?: boolean
  validationRules?: ReadonlyArray<(ctx: ValidationContext) => ASTVisitor>
  customValidateFn?: (
    schema: GraphQLSchema,
    documentAST: DocumentNode,
    rules: ReadonlyArray<any>
  ) => ReadonlyArray<GraphQLError>
  customExecuteFn?: (args: ExecutionArgs) => MaybePromise<ExecutionResult>
  customFormatErrorFn?: (error: GraphQLError) => GraphQLFormattedError
  customParseFn?: (source: Source) => DocumentNode
  formatError?: (error: GraphQLError, context?: any) => GraphQLFormattedError
  extensions?: (
    info: RequestInfo
  ) => MaybePromise<undefined | { [key: string]: unknown }>
  graphiql?: boolean | GraphiQLOptions
  fieldResolver?: GraphQLFieldResolver<unknown, unknown>
  typeResolver?: GraphQLTypeResolver<unknown, unknown>
}
type Middleware = (ctx: Context) => Promise<void>
export function graphqlHTTP(options: Options): Middleware {
  devAssertIsNonNullable(options, "GraphQL middleware requires options.")
  return async function middleware(ctx): Promise<void> {
    const req = ctx.req
    const request = ctx.request
    const response = ctx.response
    let params: GraphQLParams | undefined
    let showGraphiQL = false
    let graphiqlOptions: GraphiQLOptions | undefined
    let formatErrorFn = formatError
    let pretty = false
    let result: ExecutionResult
    try {
      try {
        const expressReq = req as any
        expressReq.body = expressReq.body ?? request.body
        params = await getGraphQLParams(expressReq)
      } catch (error: unknown) {
        const optionsData = await resolveOptions()
        pretty = optionsData.pretty ?? false
        formatErrorFn =
          optionsData.customFormatErrorFn ??
          optionsData.formatError ??
          formatErrorFn
        throw error
      }
      const optionsData = await resolveOptions(params)
      const schema = optionsData.schema
      const rootValue = optionsData.rootValue
      const validationRules = optionsData.validationRules ?? []
      const fieldResolver = optionsData.fieldResolver
      const typeResolver = optionsData.typeResolver
      const graphiql = optionsData.graphiql ?? false
      const extensionsFn = optionsData.extensions
      const context = optionsData.context ?? ctx
      const parseFn = optionsData.customParseFn ?? parse
      const executeFn = optionsData.customExecuteFn ?? execute
      const validateFn = optionsData.customValidateFn ?? validate
      pretty = optionsData.pretty ?? false
      formatErrorFn =
        optionsData.customFormatErrorFn ??
        optionsData.formatError ??
        formatErrorFn
      devAssertIsObject(
        schema,
        "GraphQL middleware options must contain a schema."
      )
      if (request.method !== "GET" && request.method !== "POST") {
        throw httpError(405, "GraphQL only supports GET and POST requests.", {
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
        throw httpError(400, "Must provide query string.")
      }
      const schemaValidationErrors = validateSchema(schema)
      if (schemaValidationErrors.length > 0) {
        throw httpError(500, "GraphQL schema validation error.", {
          graphqlErrors: schemaValidationErrors,
        })
      }
      let documentAST: DocumentNode
      try {
        documentAST = parseFn(new Source(query, "GraphQL request"))
      } catch (syntaxError: unknown) {
        throw httpError(400, "GraphQL syntax error.", {
          graphqlErrors: [syntaxError],
        })
      }
      const validationErrors = validateFn(schema, documentAST, [
        ...specifiedRules,
        ...validationRules,
      ])
      if (validationErrors.length > 0) {
        throw httpError(400, "GraphQL validation error.", {
          graphqlErrors: validationErrors,
        })
      }
      if (request.method === "GET") {
        const operationAST = getOperationAST(documentAST, operationName)
        if (operationAST && operationAST.operation !== "query") {
          if (showGraphiQL) {
            return respondWithGraphiQL(response, graphiqlOptions, params)
          }
          throw httpError(
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
        response.status = 200
      } catch (contextError: unknown) {
        throw httpError(400, "GraphQL execution context error.", {
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
    } catch (rawError: unknown) {
      const error = httpError(
        500,
        rawError instanceof Error ? rawError : String(rawError)
      )
      response.status = error.status
      const { headers } = error
      if (headers != null) {
        for (const [key, value] of Object.entries(headers)) {
          response.set(key, value)
        }
      }
      if (error.graphqlErrors == null) {
        const graphqlError = new GraphQLError(
          error.message,
          undefined,
          undefined,
          undefined,
          undefined,
          error
        )
        result = { data: undefined, errors: [graphqlError] }
      } else {
        result = { data: undefined, errors: error.graphqlErrors }
      }
    }
    if (response.status === 200 && result.data == null) {
      response.status = 500
    }
    const formattedResult: FormattedExecutionResult = {
      ...result,
      errors: result.errors?.map(formatErrorFn),
    }
    if (showGraphiQL) {
      return respondWithGraphiQL(
        response,
        graphiqlOptions,
        params,
        formattedResult
      )
    }
    const payload = pretty
      ? JSON.stringify(formattedResult, null, 2)
      : formattedResult
    response.type = "application/json"
    response.body = payload
    async function resolveOptions(
      requestParams?: GraphQLParams
    ): Promise<OptionsData> {
      const optionsResult = await Promise.resolve(
        typeof options === "function"
          ? options(request, response, ctx, requestParams)
          : options
      )
      devAssertIsObject(
        optionsResult,
        "GraphQL middleware option function must return an options object or a promise which will be resolved to an options object."
      )
      if (optionsResult.formatError) {
        console.warn(
          "`formatError` is deprecated and replaced by `customFormatErrorFn`. It will be removed in version 1.0.0."
        )
      }
      return optionsResult
    }
  }
}
function respondWithGraphiQL(
  response: Response,
  options?: GraphiQLOptions,
  params?: GraphQLParams,
  result?: FormattedExecutionResult
): void {
  const data: GraphiQLData = {
    query: params?.query,
    variables: params?.variables,
    operationName: params?.operationName,
    result,
  }
  const payload = renderGraphiQL(data, options)
  response.type = "text/html"
  response.body = payload
}
function canDisplayGraphiQL(request: Request, params: GraphQLParams): boolean {
  return !params.raw && request.accepts(["json", "html"]) === "html"
}
function devAssertIsObject(value: unknown, message: string): void {
  devAssert(value != null && typeof value === "object", message)
}
function devAssertIsNonNullable(value: unknown, message: string): void {
  devAssert(value != null, message)
}
function devAssert(condition: unknown, message: string): void {
  const booleanCondition = Boolean(condition)
  if (!booleanCondition) {
    throw new TypeError(message)
  }
}
import type { FormattedExecutionResult } from "graphql"
export interface GraphiQLData {
  query?: string | null
  variables?: { readonly [name: string]: unknown } | null
  operationName?: string | null
  result?: FormattedExecutionResult
}
export interface GraphiQLOptions {
  defaultQuery?: string
  headerEditorEnabled?: boolean
  shouldPersistHeaders?: boolean
  subscriptionEndpoint?: string
  websocketClient?: string
  editorTheme?: EditorThemeParam
}
type EditorThemeParam =
  | {
      name: string
      url: string
    }
  | string
type EditorTheme = {
  name: string
  link: string
}
const CODE_MIRROR_VERSION = "5.53.2"
function safeSerialize(data: string | boolean | null | undefined): string {
  return data != null ? JSON.stringify(data).replace(/\//g, "\\/") : "undefined"
}
declare function loadFileStaticallyFromNPM(npmPath: string): string
function getEditorThemeParams(
  editorTheme: EditorThemeParam | undefined | null
): EditorTheme | undefined {
  if (editorTheme == null) {
    return
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
      `{name: string, url: string} but provided is "${
        typeof editorTheme === "object"
          ? JSON.stringify(editorTheme)
          : editorTheme
      }"`
  )
}
export function renderGraphiQL(
  data: GraphiQLData,
  options?: GraphiQLOptions
): string {
  const queryString = data.query
  const variablesString =
    data.variables != null ? JSON.stringify(data.variables, null, 2) : null
  const resultString =
    data.result != null ? JSON.stringify(data.result, null, 2) : null
  const operationName = data.operationName
  const defaultQuery = options?.defaultQuery
  const headerEditorEnabled = options?.headerEditorEnabled
  const shouldPersistHeaders = options?.shouldPersistHeaders
  const subscriptionEndpoint = options?.subscriptionEndpoint
  const websocketClient = options?.websocketClient ?? "v0"
  const editorTheme = getEditorThemeParams(options?.editorTheme)
  let subscriptionScripts = ""
  if (subscriptionEndpoint != null) {
    if (websocketClient === "v1") {
      subscriptionScripts = `
      <script>
        ${loadFileStaticallyFromNPM("graphql-ws/umd/graphql-ws.js")}
      </script>
      <script>
      ${loadFileStaticallyFromNPM(
        "subscriptions-transport-ws/browser/client.js"
      )}
      </script>
      `
    } else {
      subscriptionScripts = `
      <script>
        ${loadFileStaticallyFromNPM(
          "subscriptions-transport-ws/browser/client.js"
        )}
      </script>
      <script>
        ${loadFileStaticallyFromNPM(
          "subscriptions-transport-ws/browser/client.js"
        )}
      </script>
      <script>
        ${loadFileStaticallyFromNPM(
          "graphiql-subscriptions-fetcher/browser/client.js"
        )}
      </script>
      `
    }
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
    /* graphiql/graphiql.css */
    ${loadFileStaticallyFromNPM("graphiql/graphiql.css")}
  </style>
  ${editorTheme ? editorTheme.link : ""}
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
        let client = null;
        let url = window.location.href;
        if('${typeof websocketClient}' == 'string' && '${websocketClient}' === 'v1') {
          client = window.graphqlWs.createClient({url: ${safeSerialize(
            subscriptionEndpoint
          )} });
          return window.GraphiQL.createFetcher({url, wsClient: client});
        } else {
          let clientClass = window.SubscriptionsTransportWs.SubscriptionClient;
          client = new clientClass(${safeSerialize(subscriptionEndpoint)}, {
            reconnect: true
          });
          return window.GraphiQL.createFetcher({url, legacyClient: client});
        }
      } else {
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
        fetcher: makeFetcher(),
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        editorTheme: ${safeSerialize(
          editorTheme ? editorTheme.name : undefined
        )},
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)},
        defaultQuery: ${safeSerialize(defaultQuery)},
        headerEditorEnabled: ${safeSerialize(headerEditorEnabled)},
        shouldPersistHeaders: ${safeSerialize(shouldPersistHeaders)}
      }),
      document.getElementById('graphiql')
    );
  </script>
</body>
</html>`
}
