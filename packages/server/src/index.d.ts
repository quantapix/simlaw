/*
import * as Koa from "koa"
import { Files } from "formidable"
declare module "koa" {
  interface Request extends Koa.BaseRequest {
    body?: any
    files?: Files
  }
}
declare namespace koaBody {
  interface IKoaBodyFormidableOptions {
    maxFileSize?: number
    maxFields?: number
    maxFieldsSize?: number
    uploadDir?: string
    keepExtensions?: boolean
    hash?: string
    multiples?: boolean
    onFileBegin?: (name: string, file: any) => void
  }
  interface IKoaBodyOptions {
    patchNode?: boolean
    patchKoa?: boolean
    jsonLimit?: string | number
    formLimit?: string | number
    textLimit?: string | number
    encoding?: string
    multipart?: boolean
    urlencoded?: boolean
    text?: boolean
    json?: boolean
    jsonStrict?: boolean
    includeUnparsed?: boolean
    formidable?: IKoaBodyFormidableOptions
    onError?: (err: Error, ctx: Koa.Context) => void
    strict?: boolean
    parsedMethods?: string[]
  }
}
declare function koaBody(
  options?: koaBody.IKoaBodyOptions
): Koa.Middleware<{}, {}>
export = koaBody
*/
