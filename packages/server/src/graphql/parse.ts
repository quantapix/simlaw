import contentType from "content-type"
import getStream, { MaxBufferError } from "get-stream"
import httpError from "http-errors"
import querystring from "querystring"
import type { IncomingMessage } from "http"
import type { Inflate, Gunzip } from "zlib"
import type { ParsedMediaType } from "content-type"
import zlib from "zlib"

type Request = IncomingMessage & { body?: unknown }

const RE = /^[ \t\n\r]*\{/

export async function parseBody(x: Request): Promise<{ [k: string]: unknown }> {
  const { body } = x
  if (typeof body === "object" && !(body instanceof Buffer)) {
    return body as { [k: string]: unknown }
  }
  if (x.headers["content-type"] === undefined) return {}
  const typ = contentType.parse(x)
  if (typeof body === "string" && typ.type === "application/graphql") {
    return { query: body }
  }
  if (body != null) return {}
  const y = await readBody(x, typ)
  switch (typ.type) {
    case "application/graphql":
      return { query: y }
    case "application/json":
      if (RE.test(y)) {
        try {
          return JSON.parse(y)
        } catch {}
      }
      throw httpError(400, "POST body sent invalid JSON.")
    case "application/x-www-form-urlencoded":
      return querystring.parse(y)
  }
  return {}
}

async function readBody(x: Request, typ: ParsedMediaType): Promise<string> {
  const cs = typ.parameters["charset"]?.toLowerCase() ?? "utf-8"
  if (cs !== "utf8" && cs !== "utf-8" && cs !== "utf16le") {
    throw httpError(415, `Unsupported charset "${cs.toUpperCase()}".`)
  }
  const ce = x.headers["content-encoding"]
  const enc = typeof ce === "string" ? ce.toLowerCase() : "identity"
  const maxBuffer = 100 * 1024
  const stream = decompressed(x, enc)
  try {
    const y = await getStream.buffer(stream, { maxBuffer })
    return y.toString(cs)
  } catch (e: unknown) {
    if (e instanceof MaxBufferError) {
      throw httpError(413, "Invalid body: request entity too large.")
    } else {
      const m = e instanceof Error ? e.message : String(e)
      throw httpError(400, `Invalid body: ${m}.`)
    }
  }
}

function decompressed(x: Request, enc: string): Request | Inflate | Gunzip {
  switch (enc) {
    case "identity":
      return x
    case "deflate":
      return x.pipe(zlib.createInflate())
    case "gzip":
      return x.pipe(zlib.createGunzip())
  }
  throw httpError(415, `Unsupported content-encoding "${enc}".`)
}
