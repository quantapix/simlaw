import type { FormattedExecutionResult } from "graphql"

type EditorTheme = { name: string; link: string }
type EditorThemeParam = { name: string; url: string } | string

export interface GraphiQLData {
  query?: string | null | undefined
  variables?: { readonly [name: string]: unknown } | null | undefined
  operationName?: string | null | undefined
  result?: FormattedExecutionResult | undefined
  editorTheme?: EditorThemeParam | undefined
}

export interface GraphiQLOptions {
  defaultQuery?: string
  headerEditorEnabled?: boolean
  shouldPersistHeaders?: boolean
  subscriptionEndpoint?: string
  websocketClient?: string
  editorTheme?: EditorThemeParam
}

const CODE_MIRROR_VERSION = "5.53.2"

function getThemeParams(
  x: EditorThemeParam | undefined | null
): EditorTheme | undefined {
  if (x == null) return
  if (typeof x === "string") {
    return {
      name: x,
      link: `<link href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODE_MIRROR_VERSION}/theme/${x}.css" rel="stylesheet" />`,
    }
  }
  if (
    typeof x === "object" &&
    x.name &&
    typeof x.name === "string" &&
    x.url &&
    typeof x.url === "string"
  ) {
    return {
      link: `<link href="${x.url}" rel="stylesheet" />`,
      name: x.name,
    }
  }
  throw Error(
    'invalid parameter "editorTheme": should be undefined/null, string or ' +
      `{name: string, url: string} but provided is "${
        typeof x === "object" ? JSON.stringify(x) : x
      }"`
  )
}

declare function loadFileStaticallyFromNPM(x: string): string

function safeSerialize(x?: string | boolean | null) {
  return x != null ? JSON.stringify(x).replace(/\//g, "\\/") : "undefined"
}

export function renderGraphiQL(x: GraphiQLData, os?: GraphiQLOptions): string {
  const query = x.query
  const variables =
    x.variables != null ? JSON.stringify(x.variables, null, 2) : null
  const result = x.result != null ? JSON.stringify(x.result, null, 2) : null
  const operationName = x.operationName
  const defaultQuery = os?.defaultQuery
  const editorEnabled = os?.headerEditorEnabled
  const persistHeaders = os?.shouldPersistHeaders
  const endpoint = os?.subscriptionEndpoint
  const client = os?.websocketClient ?? "v0"
  const editorTheme = getThemeParams(os?.editorTheme)
  let scripts = ""
  if (endpoint != null) {
    if (client === "v1") {
      scripts = `
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
      scripts = `
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
    ${loadFileStaticallyFromNPM("promise-polyfill/dist/polyfill.min.js")}
  </script>
  <script>
    ${loadFileStaticallyFromNPM("unfetch/dist/unfetch.umd.js")}
  </script>
  <script>
    ${loadFileStaticallyFromNPM("react/umd/react.production.min.js")}
  </script>
  <script>
    ${loadFileStaticallyFromNPM("react-dom/umd/react-dom.production.min.js")}
  </script>
  <script>
    ${loadFileStaticallyFromNPM("graphiql/graphiql.min.js")}
  </script>
  ${scripts}
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script>
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    function locationQuery(params) {
      return '?' + Object.keys(params).filter(function (key) {
        return Boolean(params[key]);
      }).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
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
      if('${typeof endpoint}' == 'string') {
        let client = null;
        let url = window.location.href;
        if('${typeof client}' == 'string' && '${client}' === 'v1') {
          client = window.graphqlWs.createClient({url: ${safeSerialize(
            endpoint
          )} });
          return window.GraphiQL.createFetcher({url, wsClient: client});
        } else {
          let clientClass = window.SubscriptionsTransportWs.SubscriptionClient;
          client = new clientClass(${safeSerialize(endpoint)}, {
            reconnect: true
          });
          return window.GraphiQL.createFetcher({url, legacyClient: client});
        }
      }else{
        return graphQLFetcher;
      }
    }
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
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher:  makeFetcher(),
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        editorTheme: ${safeSerialize(
          editorTheme ? editorTheme.name : undefined
        )},
        query: ${safeSerialize(query)},
        response: ${safeSerialize(result)},
        variables: ${safeSerialize(variables)},
        operationName: ${safeSerialize(operationName)},
        defaultQuery: ${safeSerialize(defaultQuery)},
        headerEditorEnabled: ${safeSerialize(editorEnabled)},
        shouldPersistHeaders: ${safeSerialize(persistHeaders)}
      }),
      document.getElementById('graphiql')
    );
  </script>
</body>
</html>`
}
