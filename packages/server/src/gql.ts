export function graphqlHTTP(options: Options): Middleware {
  devAssertIsNonNullable(options, "GraphQL middleware requires options.")
  return async function middleware(ctx): Promise<void> {
    const req = ctx.req
    const request = ctx.req
    const response = ctx.res
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
      const o = await resolveOptions(params)
      const schema = o.schema
      const rootValue = o.rootValue
      const validationRules = o.validationRules ?? []
      const fieldResolver = o.fieldResolver
      const typeResolver = o.typeResolver
      const graphiql = o.graphiql ?? false
      const extensionsFn = o.extensions
      const context = o.context ?? ctx
      const parseFn = o.customParseFn ?? parse
      const executeFn = o.customExecuteFn ?? execute
      const validateFn = o.customValidateFn ?? validate
      pretty = o.pretty ?? false
      formatErrorFn = o.customFormatErrorFn ?? o.formatError ?? formatErrorFn
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
