import { AjaxRequest, AjaxResponseType } from './types';
import { getXHRResponse } from './getXHRResponse';

/**
 * A normalized response from an AJAX request. To get the data from the response,
 * you will want to read the `response` property.
 *
 * - DO NOT create instances of this class directly.
 * - DO NOT subclass this class.
 *
 * It is advised not to hold this object in memory, as it has a reference to
 * the original XHR used to make the request, as well as properties containing
 * request and response data.
 *
 * @see {@link ajax}
 * @see {@link AjaxConfig}
 */
export class AjaxResponse<T> {
  /** The HTTP status code */
  readonly status: number;

  /**
   * The response data, if any. Note that this will automatically be converted to the proper type
   */
  readonly response: T;

  /**
   * The responseType set on the request. (For example: `""`, `"arraybuffer"`, `"blob"`, `"document"`, `"json"`, or `"text"`)
   * @deprecated There isn't much reason to examine this. It's the same responseType set (or defaulted) on the ajax config.
   * If you really need to examine this value, you can check it on the `request` or the `xhr`. Will be removed in v8.
   */
  readonly responseType: XMLHttpRequestResponseType;

  /**
   * The total number of bytes loaded so far. To be used with {@link total} while
   * calculating progress. (You will want to set {@link includeDownloadProgress} or
   * {@link includeDownloadProgress})
   */
  readonly loaded: number;

  /**
   * The total number of bytes to be loaded. To be used with {@link loaded} while
   * calculating progress. (You will want to set {@link includeDownloadProgress} or
   * {@link includeDownloadProgress})
   */
  readonly total: number;

  /**
   * A dictionary of the response headers.
   */
  readonly responseHeaders: Record<string, string>;

  /**
   * A normalized response from an AJAX request. To get the data from the response,
   * you will want to read the `response` property.
   *
   * - DO NOT create instances of this class directly.
   * - DO NOT subclass this class.
   *
   * @param originalEvent The original event object from the XHR `onload` event.
   * @param xhr The `XMLHttpRequest` object used to make the request. This is useful for examining status code, etc.
   * @param request The request settings used to make the HTTP request.
   * @param type The type of the event emitted by the {@link ajax} Observable
   */
  constructor(
    /**
     * The original event object from the raw XHR event.
     */
    public readonly originalEvent: ProgressEvent,
    /**
     * The XMLHttpRequest object used to make the request.
     * NOTE: It is advised not to hold this in memory, as it will retain references to all of it's event handlers
     * and many other things related to the request.
     */
    public readonly xhr: XMLHttpRequest,
    /**
     * The request parameters used to make the HTTP request.
     */
    public readonly request: AjaxRequest,
    /**
     * The event type. This can be used to discern between different events
     * if you're using progress events with {@link includeDownloadProgress} or
     * {@link includeUploadProgress} settings in {@link AjaxConfig}.
     *
     * The event type consists of two parts: the {@link AjaxDirection} and the
     * the event type. Merged with `_`, they form the `type` string. The
     * direction can be an `upload` or a `download` direction, while an event can
     * be `loadstart`, `progress` or `load`.
     *
     * `download_load` is the type of event when download has finished and the
     * response is available.
     */
    public readonly type: AjaxResponseType = 'download_load'
  ) {
    const { status, responseType } = xhr;
    this.status = status ?? 0;
    this.responseType = responseType ?? '';

    // Parse the response headers in advance for the user. There's really
    // not a great way to get all of them. So we need to parse the header string
    // we get back. It comes in a simple enough format:
    //
    // header-name: value here
    // content-type: application/json
    // other-header-here: some, other, values, or, whatever
    const allHeaders = xhr.getAllResponseHeaders();
    this.responseHeaders = allHeaders
      ? // Split the header text into lines
        allHeaders.split('\n').reduce((headers: Record<string, string>, line) => {
          // Split the lines on the first ": " as
          // "key: value". Note that the value could
          // technically have a ": " in it.
          const index = line.indexOf(': ');
          headers[line.slice(0, index)] = line.slice(index + 2);
          return headers;
        }, {})
      : {};

    this.response = getXHRResponse(xhr);
    const { loaded, total } = originalEvent;
    this.loaded = loaded;
    this.total = total;
  }
}
import { map } from '../operators/map';
import { Observable } from '../Observable';
import { AjaxConfig, AjaxRequest, AjaxDirection, ProgressEventType } from './types';
import { AjaxResponse } from './AjaxResponse';
import { AjaxTimeoutError, AjaxError } from './errors';

export interface AjaxCreationMethod {
  /**
   * Creates an observable that will perform an AJAX request using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default.
   *
   * This is the most configurable option, and the basis for all other AJAX calls in the library.
   *
   * ## Example
   *
   * ```ts
   * import { ajax } from 'rxjs/ajax';
   * import { map, catchError, of } from 'rxjs';
   *
   * const obs$ = ajax({
   *   method: 'GET',
   *   url: 'https://api.github.com/users?per_page=5',
   *   responseType: 'json'
   * }).pipe(
   *   map(userResponse => console.log('users: ', userResponse)),
   *   catchError(error => {
   *     console.log('error: ', error);
   *     return of(error);
   *   })
   * );
   * ```
   */
  <T>(config: AjaxConfig): Observable<AjaxResponse<T>>;

  /**
   * Perform an HTTP GET using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope. Defaults to a `responseType` of `"json"`.
   *
   * ## Example
   *
   * ```ts
   * import { ajax } from 'rxjs/ajax';
   * import { map, catchError, of } from 'rxjs';
   *
   * const obs$ = ajax('https://api.github.com/users?per_page=5').pipe(
   *   map(userResponse => console.log('users: ', userResponse)),
   *   catchError(error => {
   *     console.log('error: ', error);
   *     return of(error);
   *   })
   * );
   * ```
   */
  <T>(url: string): Observable<AjaxResponse<T>>;

  /**
   * Performs an HTTP GET using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default, and a `responseType` of `"json"`.
   *
   * @param url The URL to get the resource from
   * @param headers Optional headers. Case-Insensitive.
   */
  get<T>(url: string, headers?: Record<string, string>): Observable<AjaxResponse<T>>;

  /**
   * Performs an HTTP POST using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default, and a `responseType` of `"json"`.
   *
   * Before sending the value passed to the `body` argument, it is automatically serialized
   * based on the specified `responseType`. By default, a JavaScript object will be serialized
   * to JSON. A `responseType` of `application/x-www-form-urlencoded` will flatten any provided
   * dictionary object to a url-encoded string.
   *
   * @param url The URL to get the resource from
   * @param body The content to send. The body is automatically serialized.
   * @param headers Optional headers. Case-Insensitive.
   */
  post<T>(url: string, body?: any, headers?: Record<string, string>): Observable<AjaxResponse<T>>;

  /**
   * Performs an HTTP PUT using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default, and a `responseType` of `"json"`.
   *
   * Before sending the value passed to the `body` argument, it is automatically serialized
   * based on the specified `responseType`. By default, a JavaScript object will be serialized
   * to JSON. A `responseType` of `application/x-www-form-urlencoded` will flatten any provided
   * dictionary object to a url-encoded string.
   *
   * @param url The URL to get the resource from
   * @param body The content to send. The body is automatically serialized.
   * @param headers Optional headers. Case-Insensitive.
   */
  put<T>(url: string, body?: any, headers?: Record<string, string>): Observable<AjaxResponse<T>>;

  /**
   * Performs an HTTP PATCH using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default, and a `responseType` of `"json"`.
   *
   * Before sending the value passed to the `body` argument, it is automatically serialized
   * based on the specified `responseType`. By default, a JavaScript object will be serialized
   * to JSON. A `responseType` of `application/x-www-form-urlencoded` will flatten any provided
   * dictionary object to a url-encoded string.
   *
   * @param url The URL to get the resource from
   * @param body The content to send. The body is automatically serialized.
   * @param headers Optional headers. Case-Insensitive.
   */
  patch<T>(url: string, body?: any, headers?: Record<string, string>): Observable<AjaxResponse<T>>;

  /**
   * Performs an HTTP DELETE using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default, and a `responseType` of `"json"`.
   *
   * @param url The URL to get the resource from
   * @param headers Optional headers. Case-Insensitive.
   */
  delete<T>(url: string, headers?: Record<string, string>): Observable<AjaxResponse<T>>;

  /**
   * Performs an HTTP GET using the
   * [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) in
   * global scope by default, and returns the hydrated JavaScript object from the
   * response.
   *
   * @param url The URL to get the resource from
   * @param headers Optional headers. Case-Insensitive.
   */
  getJSON<T>(url: string, headers?: Record<string, string>): Observable<T>;
}

function ajaxGet<T>(url: string, headers?: Record<string, string>): Observable<AjaxResponse<T>> {
  return ajax({ method: 'GET', url, headers });
}

function ajaxPost<T>(url: string, body?: any, headers?: Record<string, string>): Observable<AjaxResponse<T>> {
  return ajax({ method: 'POST', url, body, headers });
}

function ajaxDelete<T>(url: string, headers?: Record<string, string>): Observable<AjaxResponse<T>> {
  return ajax({ method: 'DELETE', url, headers });
}

function ajaxPut<T>(url: string, body?: any, headers?: Record<string, string>): Observable<AjaxResponse<T>> {
  return ajax({ method: 'PUT', url, body, headers });
}

function ajaxPatch<T>(url: string, body?: any, headers?: Record<string, string>): Observable<AjaxResponse<T>> {
  return ajax({ method: 'PATCH', url, body, headers });
}

const mapResponse = map((x: AjaxResponse<any>) => x.response);

function ajaxGetJSON<T>(url: string, headers?: Record<string, string>): Observable<T> {
  return mapResponse(
    ajax<T>({
      method: 'GET',
      url,
      headers,
    })
  );
}

/**
 * There is an ajax operator on the Rx object.
 *
 * It creates an observable for an Ajax request with either a request object with
 * url, headers, etc or a string for a URL.
 *
 * ## Examples
 *
 * Using `ajax()` to fetch the response object that is being returned from API
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const obs$ = ajax('https://api.github.com/users?per_page=5').pipe(
 *   map(userResponse => console.log('users: ', userResponse)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * obs$.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 *
 * Using `ajax.getJSON()` to fetch data from API
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const obs$ = ajax.getJSON('https://api.github.com/users?per_page=5').pipe(
 *   map(userResponse => console.log('users: ', userResponse)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * obs$.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 *
 * Using `ajax()` with object as argument and method POST with a two seconds delay
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const users = ajax({
 *   url: 'https://httpbin.org/delay/2',
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'rxjs-custom-header': 'Rxjs'
 *   },
 *   body: {
 *     rxjs: 'Hello World!'
 *   }
 * }).pipe(
 *   map(response => console.log('response: ', response)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * users.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 *
 * Using `ajax()` to fetch. An error object that is being returned from the request
 *
 * ```ts
 * import { ajax } from 'rxjs/ajax';
 * import { map, catchError, of } from 'rxjs';
 *
 * const obs$ = ajax('https://api.github.com/404').pipe(
 *   map(userResponse => console.log('users: ', userResponse)),
 *   catchError(error => {
 *     console.log('error: ', error);
 *     return of(error);
 *   })
 * );
 *
 * obs$.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err)
 * });
 * ```
 */
export const ajax: AjaxCreationMethod = (() => {
  const create = <T>(urlOrConfig: string | AjaxConfig) => {
    const config: AjaxConfig =
      typeof urlOrConfig === 'string'
        ? {
            url: urlOrConfig,
          }
        : urlOrConfig;
    return fromAjax<T>(config);
  };

  create.get = ajaxGet;
  create.post = ajaxPost;
  create.delete = ajaxDelete;
  create.put = ajaxPut;
  create.patch = ajaxPatch;
  create.getJSON = ajaxGetJSON;

  return create;
})();

const UPLOAD = 'upload';
const DOWNLOAD = 'download';
const LOADSTART = 'loadstart';
const PROGRESS = 'progress';
const LOAD = 'load';

export function fromAjax<T>(init: AjaxConfig): Observable<AjaxResponse<T>> {
  return new Observable((destination) => {
    const config = {
      // Defaults
      async: true,
      crossDomain: false,
      withCredentials: false,
      method: 'GET',
      timeout: 0,
      responseType: 'json' as XMLHttpRequestResponseType,

      ...init,
    };

    const { queryParams, body: configuredBody, headers: configuredHeaders } = config;

    let url = config.url;
    if (!url) {
      throw new TypeError('url is required');
    }

    if (queryParams) {
      let searchParams: URLSearchParams;
      if (url.includes('?')) {
        // If the user has passed a URL with a querystring already in it,
        // we need to combine them. So we're going to split it. There
        // should only be one `?` in a valid URL.
        const parts = url.split('?');
        if (2 < parts.length) {
          throw new TypeError('invalid url');
        }
        // Add the passed queryParams to the params already in the url provided.
        searchParams = new URLSearchParams(parts[1]);
        // queryParams is converted to any because the runtime is *much* more permissive than
        // the types are.
        new URLSearchParams(queryParams as any).forEach((value, key) => searchParams.set(key, value));
        // We have to do string concatenation here, because `new URL(url)` does
        // not like relative URLs like `/this` without a base url, which we can't
        // specify, nor can we assume `location` will exist, because of node.
        url = parts[0] + '?' + searchParams;
      } else {
        // There is no pre-existing querystring, so we can just use URLSearchParams
        // to convert the passed queryParams into the proper format and encodings.
        // queryParams is converted to any because the runtime is *much* more permissive than
        // the types are.
        searchParams = new URLSearchParams(queryParams as any);
        url = url + '?' + searchParams;
      }
    }

    // Normalize the headers. We're going to make them all lowercase, since
    // Headers are case insensitive by design. This makes it easier to verify
    // that we aren't setting or sending duplicates.
    const headers: Record<string, any> = {};
    if (configuredHeaders) {
      for (const key in configuredHeaders) {
        if (configuredHeaders.hasOwnProperty(key)) {
          headers[key.toLowerCase()] = configuredHeaders[key];
        }
      }
    }

    const crossDomain = config.crossDomain;

    // Set the x-requested-with header. This is a non-standard header that has
    // come to be a de facto standard for HTTP requests sent by libraries and frameworks
    // using XHR. However, we DO NOT want to set this if it is a CORS request. This is
    // because sometimes this header can cause issues with CORS. To be clear,
    // None of this is necessary, it's only being set because it's "the thing libraries do"
    // Starting back as far as JQuery, and continuing with other libraries such as Angular 1,
    // Axios, et al.
    if (!crossDomain && !('x-requested-with' in headers)) {
      headers['x-requested-with'] = 'XMLHttpRequest';
    }

    // Allow users to provide their XSRF cookie name and the name of a custom header to use to
    // send the cookie.
    const { withCredentials, xsrfCookieName, xsrfHeaderName } = config;
    if ((withCredentials || !crossDomain) && xsrfCookieName && xsrfHeaderName) {
      const xsrfCookie = document?.cookie.match(new RegExp(`(^|;\\s*)(${xsrfCookieName})=([^;]*)`))?.pop() ?? '';
      if (xsrfCookie) {
        headers[xsrfHeaderName] = xsrfCookie;
      }
    }

    // Examine the body and determine whether or not to serialize it
    // and set the content-type in `headers`, if we're able.
    const body = extractContentTypeAndMaybeSerializeBody(configuredBody, headers);

    // The final request settings.
    const _request: Readonly<AjaxRequest> = {
      ...config,

      // Set values we ensured above
      url,
      headers,
      body,
    };

    let xhr: XMLHttpRequest;

    // Create our XHR so we can get started.
    xhr = init.createXHR ? init.createXHR() : new XMLHttpRequest();

    {
      ///////////////////////////////////////////////////
      // set up the events before open XHR
      // https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
      // You need to add the event listeners before calling open() on the request.
      // Otherwise the progress events will not fire.
      ///////////////////////////////////////////////////

      const { progressSubscriber, includeDownloadProgress = false, includeUploadProgress = false } = init;

      /**
       * Wires up an event handler that will emit an error when fired. Used
       * for timeout and abort events.
       * @param type The type of event we're treating as an error
       * @param errorFactory A function that creates the type of error to emit.
       */
      const addErrorEvent = (type: string, errorFactory: () => any) => {
        xhr.addEventListener(type, () => {
          const error = errorFactory();
          progressSubscriber?.error?.(error);
          destination.error(error);
        });
      };

      // If the request times out, handle errors appropriately.
      addErrorEvent('timeout', () => new AjaxTimeoutError(xhr, _request));

      // If the request aborts (due to a network disconnection or the like), handle
      // it as an error.
      addErrorEvent('abort', () => new AjaxError('aborted', xhr, _request));

      /**
       * Creates a response object to emit to the consumer.
       * @param direction the direction related to the event. Prefixes the event `type` in the
       * `AjaxResponse` object with "upload_" for events related to uploading and "download_"
       * for events related to downloading.
       * @param event the actual event object.
       */
      const createResponse = (direction: AjaxDirection, event: ProgressEvent) =>
        new AjaxResponse<T>(event, xhr, _request, `${direction}_${event.type as ProgressEventType}` as const);

      /**
       * Wires up an event handler that emits a Response object to the consumer, used for
       * all events that emit responses, loadstart, progress, and load.
       * Note that download load handling is a bit different below, because it has
       * more logic it needs to run.
       * @param target The target, either the XHR itself or the Upload object.
       * @param type The type of event to wire up
       * @param direction The "direction", used to prefix the response object that is
       * emitted to the consumer. (e.g. "upload_" or "download_")
       */
      const addProgressEvent = (target: any, type: string, direction: AjaxDirection) => {
        target.addEventListener(type, (event: ProgressEvent) => {
          destination.next(createResponse(direction, event));
        });
      };

      if (includeUploadProgress) {
        [LOADSTART, PROGRESS, LOAD].forEach((type) => addProgressEvent(xhr.upload, type, UPLOAD));
      }

      if (progressSubscriber) {
        [LOADSTART, PROGRESS].forEach((type) => xhr.upload.addEventListener(type, (e: any) => progressSubscriber?.next?.(e)));
      }

      if (includeDownloadProgress) {
        [LOADSTART, PROGRESS].forEach((type) => addProgressEvent(xhr, type, DOWNLOAD));
      }

      const emitError = (status?: number) => {
        const msg = 'ajax error' + (status ? ' ' + status : '');
        destination.error(new AjaxError(msg, xhr, _request));
      };

      xhr.addEventListener('error', (e) => {
        progressSubscriber?.error?.(e);
        emitError();
      });

      xhr.addEventListener(LOAD, (event) => {
        const { status } = xhr;
        // 4xx and 5xx should error (https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)
        if (status < 400) {
          progressSubscriber?.complete?.();

          let response: AjaxResponse<T>;
          try {
            // This can throw in IE, because we end up needing to do a JSON.parse
            // of the response in some cases to produce object we'd expect from
            // modern browsers.
            response = createResponse(DOWNLOAD, event);
          } catch (err) {
            destination.error(err);
            return;
          }

          destination.next(response);
          destination.complete();
        } else {
          progressSubscriber?.error?.(event);
          emitError(status);
        }
      });
    }

    const { user, method, async } = _request;
    // open XHR
    if (user) {
      xhr.open(method, url, async, user, _request.password);
    } else {
      xhr.open(method, url, async);
    }

    // timeout, responseType and withCredentials can be set once the XHR is open
    if (async) {
      xhr.timeout = _request.timeout;
      xhr.responseType = _request.responseType;
    }

    if ('withCredentials' in xhr) {
      xhr.withCredentials = _request.withCredentials;
    }

    // set headers
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    // finally send the request
    if (body) {
      xhr.send(body);
    } else {
      xhr.send();
    }

    return () => {
      if (xhr && xhr.readyState !== 4 /*XHR done*/) {
        xhr.abort();
      }
    };
  });
}

/**
 * Examines the body to determine if we need to serialize it for them or not.
 * If the body is a type that XHR handles natively, we just allow it through,
 * otherwise, if the body is something that *we* can serialize for the user,
 * we will serialize it, and attempt to set the `content-type` header, if it's
 * not already set.
 * @param body The body passed in by the user
 * @param headers The normalized headers
 */
function extractContentTypeAndMaybeSerializeBody(body: any, headers: Record<string, string>) {
  if (
    !body ||
    typeof body === 'string' ||
    isFormData(body) ||
    isURLSearchParams(body) ||
    isArrayBuffer(body) ||
    isFile(body) ||
    isBlob(body) ||
    isReadableStream(body)
  ) {
    // The XHR instance itself can handle serializing these, and set the content-type for us
    // so we don't need to do that. https://xhr.spec.whatwg.org/#the-send()-method
    return body;
  }

  if (isArrayBufferView(body)) {
    // This is a typed array (e.g. Float32Array or Uint8Array), or a DataView.
    // XHR can handle this one too: https://fetch.spec.whatwg.org/#concept-bodyinit-extract
    return body.buffer;
  }

  if (typeof body === 'object') {
    // If we have made it here, this is an object, probably a POJO, and we'll try
    // to serialize it for them. If this doesn't work, it will throw, obviously, which
    // is okay. The workaround for users would be to manually set the body to their own
    // serialized string (accounting for circular references or whatever), then set
    // the content-type manually as well.
    headers['content-type'] = headers['content-type'] ?? 'application/json;charset=utf-8';
    return JSON.stringify(body);
  }

  // If we've gotten past everything above, this is something we don't quite know how to
  // handle. Throw an error. This will be caught and emitted from the observable.
  throw new TypeError('Unknown body type');
}

const _toString = Object.prototype.toString;

function toStringCheck(obj: any, name: string): boolean {
  return _toString.call(obj) === `[object ${name}]`;
}

function isArrayBuffer(body: any): body is ArrayBuffer {
  return toStringCheck(body, 'ArrayBuffer');
}

function isFile(body: any): body is File {
  return toStringCheck(body, 'File');
}

function isBlob(body: any): body is Blob {
  return toStringCheck(body, 'Blob');
}

function isArrayBufferView(body: any): body is ArrayBufferView {
  return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
}

function isFormData(body: any): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isURLSearchParams(body: any): body is URLSearchParams {
  return typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
}

function isReadableStream(body: any): body is ReadableStream {
  return typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
}
import { AjaxRequest } from './types';
import { getXHRResponse } from './getXHRResponse';
import { createErrorClass } from '../util/createErrorClass';

/**
 * A normalized AJAX error.
 *
 * @see {@link ajax}
 *
 * @class AjaxError
 */
export interface AjaxError extends Error {
  /**
   * The XHR instance associated with the error.
   */
  xhr: XMLHttpRequest;

  /**
   * The AjaxRequest associated with the error.
   */
  request: AjaxRequest;

  /**
   * The HTTP status code, if the request has completed. If not,
   * it is set to `0`.
   */
  status: number;

  /**
   * The responseType (e.g. 'json', 'arraybuffer', or 'xml').
   */
  responseType: XMLHttpRequestResponseType;

  /**
   * The response data.
   */
  response: any;
}

export interface AjaxErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (message: string, xhr: XMLHttpRequest, request: AjaxRequest): AjaxError;
}

/**
 * Thrown when an error occurs during an AJAX request.
 * This is only exported because it is useful for checking to see if an error
 * is an `instanceof AjaxError`. DO NOT create new instances of `AjaxError` with
 * the constructor.
 *
 * @class AjaxError
 * @see {@link ajax}
 */
export const AjaxError: AjaxErrorCtor = createErrorClass(
  (_super) =>
    function AjaxErrorImpl(this: any, message: string, xhr: XMLHttpRequest, request: AjaxRequest) {
      this.message = message;
      this.name = 'AjaxError';
      this.xhr = xhr;
      this.request = request;
      this.status = xhr.status;
      this.responseType = xhr.responseType;
      let response: any;
      try {
        // This can throw in IE, because we have to do a JSON.parse of
        // the response in some cases to get the expected response property.
        response = getXHRResponse(xhr);
      } catch (err) {
        response = xhr.responseText;
      }
      this.response = response;
    }
);

export interface AjaxTimeoutError extends AjaxError {}

export interface AjaxTimeoutErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (xhr: XMLHttpRequest, request: AjaxRequest): AjaxTimeoutError;
}

/**
 * Thrown when an AJAX request times out. Not to be confused with {@link TimeoutError}.
 *
 * This is exported only because it is useful for checking to see if errors are an
 * `instanceof AjaxTimeoutError`. DO NOT use the constructor to create an instance of
 * this type.
 *
 * @class AjaxTimeoutError
 * @see {@link ajax}
 */
export const AjaxTimeoutError: AjaxTimeoutErrorCtor = (() => {
  function AjaxTimeoutErrorImpl(this: any, xhr: XMLHttpRequest, request: AjaxRequest) {
    AjaxError.call(this, 'ajax timeout', xhr, request);
    this.name = 'AjaxTimeoutError';
    return this;
  }
  AjaxTimeoutErrorImpl.prototype = Object.create(AjaxError.prototype);
  return AjaxTimeoutErrorImpl;
})() as any;
/**
 * Gets what should be in the `response` property of the XHR. However,
 * since we still support the final versions of IE, we need to do a little
 * checking here to make sure that we get the right thing back. Conquentally,
 * we need to do a JSON.parse() in here, which *could* throw if the response
 * isn't valid JSON.
 *
 * This is used both in creating an AjaxResponse, and in creating certain errors
 * that we throw, so we can give the user whatever was in the response property.
 *
 * @param xhr The XHR to examine the response of
 */
export function getXHRResponse(xhr: XMLHttpRequest) {
  switch (xhr.responseType) {
    case 'json': {
      if ('response' in xhr) {
        return xhr.response;
      } else {
        // IE
        const ieXHR: any = xhr;
        return JSON.parse(ieXHR.responseText);
      }
    }
    case 'document':
      return xhr.responseXML;
    case 'text':
    default: {
      if ('response' in xhr) {
        return xhr.response;
      } else {
        // IE
        const ieXHR: any = xhr;
        return ieXHR.responseText;
      }
    }
  }
}
import { PartialObserver } from '../types';

/**
 * Valid Ajax direction types. Prefixes the event `type` in the
 * {@link AjaxResponse} object with "upload_" for events related
 * to uploading and "download_" for events related to downloading.
 */
export type AjaxDirection = 'upload' | 'download';

export type ProgressEventType = 'loadstart' | 'progress' | 'load';

export type AjaxResponseType = `${AjaxDirection}_${ProgressEventType}`;

/**
 * The object containing values RxJS used to make the HTTP request.
 *
 * This is provided in {@link AjaxError} instances as the `request`
 * object.
 */
export interface AjaxRequest {
  /**
   * The URL requested.
   */
  url: string;

  /**
   * The body to send over the HTTP request.
   */
  body?: any;

  /**
   * The HTTP method used to make the HTTP request.
   */
  method: string;

  /**
   * Whether or not the request was made asynchronously.
   */
  async: boolean;

  /**
   * The headers sent over the HTTP request.
   */
  headers: Readonly<Record<string, any>>;

  /**
   * The timeout value used for the HTTP request.
   * Note: this is only honored if the request is asynchronous (`async` is `true`).
   */
  timeout: number;

  /**
   * The user credentials user name sent with the HTTP request.
   */
  user?: string;

  /**
   * The user credentials password sent with the HTTP request.
   */
  password?: string;

  /**
   * Whether or not the request was a CORS request.
   */
  crossDomain: boolean;

  /**
   * Whether or not a CORS request was sent with credentials.
   * If `false`, will also ignore cookies in the CORS response.
   */
  withCredentials: boolean;

  /**
   * The [`responseType`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType) set before sending the request.
   */
  responseType: XMLHttpRequestResponseType;
}

/**
 * Configuration for the {@link ajax} creation function.
 */
export interface AjaxConfig {
  /** The address of the resource to request via HTTP. */
  url: string;

  /**
   * The body of the HTTP request to send.
   *
   * This is serialized, by default, based off of the value of the `"content-type"` header.
   * For example, if the `"content-type"` is `"application/json"`, the body will be serialized
   * as JSON. If the `"content-type"` is `"application/x-www-form-urlencoded"`, whatever object passed
   * to the body will be serialized as URL, using key-value pairs based off of the keys and values of the object.
   * In all other cases, the body will be passed directly.
   */
  body?: any;

  /**
   * Whether or not to send the request asynchronously. Defaults to `true`.
   * If set to `false`, this will block the thread until the AJAX request responds.
   */
  async?: boolean;

  /**
   * The HTTP Method to use for the request. Defaults to "GET".
   */
  method?: string;

  /**
   * The HTTP headers to apply.
   *
   * Note that, by default, RxJS will add the following headers under certain conditions:
   *
   * 1. If the `"content-type"` header is **NOT** set, and the `body` is [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData),
   *    a `"content-type"` of `"application/x-www-form-urlencoded; charset=UTF-8"` will be set automatically.
   * 2. If the `"x-requested-with"` header is **NOT** set, and the `crossDomain` configuration property is **NOT** explicitly set to `true`,
   *    (meaning it is not a CORS request), a `"x-requested-with"` header with a value of `"XMLHttpRequest"` will be set automatically.
   *    This header is generally meaningless, and is set by libraries and frameworks using `XMLHttpRequest` to make HTTP requests.
   */
  headers?: Readonly<Record<string, any>>;

  /**
   * The time to wait before causing the underlying XMLHttpRequest to timeout. This is only honored if the
   * `async` configuration setting is unset or set to `true`. Defaults to `0`, which is idiomatic for "never timeout".
   */
  timeout?: number;

  /** The user credentials user name to send with the HTTP request */
  user?: string;

  /** The user credentials password to send with the HTTP request*/
  password?: string;

  /**
   * Whether or not to send the HTTP request as a CORS request.
   * Defaults to `false`.
   *
   * @deprecated Will be removed in version 8. Cross domain requests and what creates a cross
   * domain request, are dictated by the browser, and a boolean that forces it to be cross domain
   * does not make sense. If you need to force cross domain, make sure you're making a secure request,
   * then add a custom header to the request or use `withCredentials`. For more information on what
   * triggers a cross domain request, see the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials).
   * In particular, the section on [Simple Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests) is useful
   * for understanding when CORS will not be used.
   */
  crossDomain?: boolean;

  /**
   * To send user credentials in a CORS request, set to `true`. To exclude user credentials from
   * a CORS request, _OR_ when cookies are to be ignored by the CORS response, set to `false`.
   *
   * Defaults to `false`.
   */
  withCredentials?: boolean;

  /**
   * The name of your site's XSRF cookie.
   */
  xsrfCookieName?: string;

  /**
   * The name of a custom header that you can use to send your XSRF cookie.
   */
  xsrfHeaderName?: string;

  /**
   * Can be set to change the response type.
   * Valid values are `"arraybuffer"`, `"blob"`, `"document"`, `"json"`, and `"text"`.
   * Note that the type of `"document"` (such as an XML document) is ignored if the global context is
   * not `Window`.
   *
   * Defaults to `"json"`.
   */
  responseType?: XMLHttpRequestResponseType;

  /**
   * An optional factory used to create the XMLHttpRequest object used to make the AJAX request.
   * This is useful in environments that lack `XMLHttpRequest`, or in situations where you
   * wish to override the default `XMLHttpRequest` for some reason.
   *
   * If not provided, the `XMLHttpRequest` in global scope will be used.
   *
   * NOTE: This AJAX implementation relies on the built-in serialization and setting
   * of Content-Type headers that is provided by standards-compliant XMLHttpRequest implementations,
   * be sure any implementation you use meets that standard.
   */
  createXHR?: () => XMLHttpRequest;

  /**
   * An observer for watching the upload progress of an HTTP request. Will
   * emit progress events, and completes on the final upload load event, will error for
   * any XHR error or timeout.
   *
   * This will **not** error for errored status codes. Rather, it will always _complete_ when
   * the HTTP response comes back.
   *
   * @deprecated If you're looking for progress events, use {@link includeDownloadProgress} and
   * {@link includeUploadProgress} instead. Will be removed in v8.
   */
  progressSubscriber?: PartialObserver<ProgressEvent>;

  /**
   * If `true`, will emit all download progress and load complete events as {@link AjaxResponse}
   * from the observable. The final download event will also be emitted as a {@link AjaxResponse}.
   *
   * If both this and {@link includeUploadProgress} are `false`, then only the {@link AjaxResponse} will
   * be emitted from the resulting observable.
   */
  includeDownloadProgress?: boolean;

  /**
   * If `true`, will emit all upload progress and load complete events as {@link AjaxResponse}
   * from the observable. The final download event will also be emitted as a {@link AjaxResponse}.
   *
   * If both this and {@link includeDownloadProgress} are `false`, then only the {@link AjaxResponse} will
   * be emitted from the resulting observable.
   */
  includeUploadProgress?: boolean;

  /**
   * Query string parameters to add to the URL in the request.
   * <em>This will require a polyfill for `URL` and `URLSearchParams` in Internet Explorer!</em>
   *
   * Accepts either a query string, a `URLSearchParams` object, a dictionary of key/value pairs, or an
   * array of key/value entry tuples. (Essentially, it takes anything that `new URLSearchParams` would normally take).
   *
   * If, for some reason you have a query string in the `url` argument, this will append to the query string in the url,
   * but it will also overwrite the value of any keys that are an exact match. In other words, a url of `/test?a=1&b=2`,
   * with queryParams of `{ b: 5, c: 6 }` will result in a url of roughly `/test?a=1&b=5&c=6`.
   */
  queryParams?:
    | string
    | URLSearchParams
    | Record<string, string | number | boolean | string[] | number[] | boolean[]>
    | [string, string | number | boolean | string[] | number[] | boolean[]][];
}
