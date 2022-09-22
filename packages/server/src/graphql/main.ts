import type {
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
import type { Context, Request, Response, MaybePromise } from "../types.js"

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
  context?: unknown
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

type Middleware = (request: Request, response: Response) => Promise<void>

export function graphqlHTTP(options: Options): Middleware {
  devAssertIsNonNullable(options, "GraphQL middleware requires options.")

  return async function graphqlMiddleware(
    request: Request,
    response: Response
  ): Promise<void> {
    // Higher scoped variables are referred to at various stages in the asynchronous state machine below.
    let params: GraphQLParams | undefined
    let showGraphiQL = false
    let graphiqlOptions: GraphiQLOptions | undefined
    let formatErrorFn = formatError
    let pretty = false
    let result: ExecutionResult

    try {
      // Parse the Request to get GraphQL request parameters.
      try {
        params = await getGraphQLParams(request)
      } catch (error: unknown) {
        // When we failed to parse the GraphQL parameters, we still need to get
        // the options object, so make an options call to resolve just that.
        const optionsData = await resolveOptions()
        pretty = optionsData.pretty ?? false
        formatErrorFn =
          optionsData.customFormatErrorFn ??
          optionsData.formatError ??
          formatErrorFn
        throw error
      }

      // Then, resolve the Options to get OptionsData.
      const optionsData = await resolveOptions(params)

      // Collect information from the options data object.
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
      formatErrorFn =
        optionsData.customFormatErrorFn ??
        optionsData.formatError ??
        formatErrorFn

      devAssertIsObject(
        schema,
        "GraphQL middleware options must contain a schema."
      )

      // GraphQL HTTP only supports GET and POST methods.
      if (request.method !== "GET" && request.method !== "POST") {
        throw httpError(405, "GraphQL only supports GET and POST requests.", {
          headers: { Allow: "GET, POST" },
        })
      }

      // Get GraphQL params from the request and POST body data.
      const { query, variables, operationName } = params
      showGraphiQL = canDisplayGraphiQL(request, params) && graphiql !== false
      if (typeof graphiql !== "boolean") {
        graphiqlOptions = graphiql
      }

      // If there is no query, but GraphiQL will be displayed, do not produce
      // a result, otherwise return a 400: Bad Request.
      if (query == null) {
        if (showGraphiQL) {
          return respondWithGraphiQL(response, graphiqlOptions)
        }
        throw httpError(400, "Must provide query string.")
      }

      // Validate Schema
      const schemaValidationErrors = validateSchema(schema)
      if (schemaValidationErrors.length > 0) {
        // Return 500: Internal Server Error if invalid schema.
        throw httpError(500, "GraphQL schema validation error.", {
          graphqlErrors: schemaValidationErrors,
        })
      }

      // Parse source to AST, reporting any syntax error.
      let documentAST: DocumentNode
      try {
        documentAST = parseFn(new Source(query, "GraphQL request"))
      } catch (syntaxError: unknown) {
        // Return 400: Bad Request if any syntax errors errors exist.
        throw httpError(400, "GraphQL syntax error.", {
          graphqlErrors: [syntaxError],
        })
      }

      // Validate AST, reporting any errors.
      const validationErrors = validateFn(schema, documentAST, [
        ...specifiedRules,
        ...validationRules,
      ])

      if (validationErrors.length > 0) {
        // Return 400: Bad Request if any validation errors exist.
        throw httpError(400, "GraphQL validation error.", {
          graphqlErrors: validationErrors,
        })
      }

      // Only query operations are allowed on GET requests.
      if (request.method === "GET") {
        // Determine if this GET request will perform a non-query.
        const operationAST = getOperationAST(documentAST, operationName)
        if (operationAST && operationAST.operation !== "query") {
          // If GraphiQL can be shown, do not perform this query, but
          // provide it to GraphiQL so that the requester may perform it
          // themselves if desired.
          if (showGraphiQL) {
            return respondWithGraphiQL(response, graphiqlOptions, params)
          }

          // Otherwise, report a 405: Method Not Allowed error.
          throw httpError(
            405,
            `Can only perform a ${operationAST.operation} operation from a POST request.`,
            { headers: { Allow: "POST" } }
          )
        }
      }

      // Perform the execution, reporting any errors creating the context.
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
        // Return 400: Bad Request if any execution context errors exist.
        throw httpError(400, "GraphQL execution context error.", {
          graphqlErrors: [contextError],
        })
      }

      // Collect and apply any metadata extensions if a function was provided.
      // https://graphql.github.io/graphql-spec/#sec-Response-Format
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
      // If an error was caught, report the httpError status, or 500.
      const error = httpError(
        500,
        /* istanbul ignore next: Thrown by underlying library. */
        rawError instanceof Error ? rawError : String(rawError)
      )

      response.statusCode = error.status

      const { headers } = error
      if (headers != null) {
        for (const [key, value] of Object.entries(headers)) {
          response.setHeader(key, String(value))
        }
      }

      if (error["graphqlErrors"] == null) {
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
        result = { data: undefined, errors: error["graphqlErrors"] }
      }
    }

    // If no data was included in the result, that indicates a runtime query
    // error, indicate as such with a generic status code.
    // Note: Information about the error itself will still be contained in
    // the resulting JSON payload.
    // https://graphql.github.io/graphql-spec/#sec-Data
    if (response.statusCode === 200 && result.data == null) {
      response.statusCode = 500
    }

    // Format any encountered errors.
    const formattedResult: FormattedExecutionResult = {
      ...result,
      errors: result.errors?.map(formatErrorFn),
    }

    // If allowed to show GraphiQL, present it instead of JSON.
    if (showGraphiQL) {
      return respondWithGraphiQL(
        response,
        graphiqlOptions,
        params,
        formattedResult
      )
    }

    // If "pretty" JSON isn't requested, and the server provides a
    // response.json method (express), use that directly.
    // Otherwise use the simplified sendResponse method.
    if (!pretty && typeof response.json === "function") {
      response.json(formattedResult)
    } else {
      const payload = JSON.stringify(formattedResult, null, pretty ? 2 : 0)
      sendResponse(response, "application/json", payload)
    }

    async function resolveOptions(
      requestParams?: GraphQLParams
    ): Promise<OptionsData> {
      const optionsResult = await Promise.resolve(
        typeof options === "function"
          ? options(request, response, requestParams)
          : options
      )

      devAssertIsObject(
        optionsResult,
        "GraphQL middleware option function must return an options object or a promise which will be resolved to an options object."
      )

      if (optionsResult.formatError) {
        // eslint-disable-next-line no-console
        console.warn(
          "`formatError` is deprecated and replaced by `customFormatErrorFn`. It will be removed in version 1.0.0."
        )
      }

      return optionsResult
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
function devAssert(x: unknown, m: string) {
  const y = Boolean(x)
  if (!y) throw new TypeError(m)
}
function devAssertIsObject(x: unknown, m: string) {
  devAssert(x != null && typeof x === "object", m)
}
function devAssertIsNonNullable(x: unknown, m: string) {
  devAssert(x != null, m)
}

function sendResponse(response: Response, type: string, data: string): void {
  const chunk = Buffer.from(data, "utf8")
  response.setHeader("Content-Type", type + "; charset=utf-8")
  response.setHeader("Content-Length", String(chunk.length))
  response.end(chunk)
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
