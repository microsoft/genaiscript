import {
    dirname,
    extname,
    basename,
    join,
    normalize,
    relative,
    resolve,
    isAbsolute,
} from "path"
import { changeext } from "../../core/src/fs"

export function createVSPath(): Path {
    return Object.freeze({
        dirname,
        extname,
        basename,
        join,
        normalize,
        relative,
        resolve,
        isAbsolute,
        changeext,
    })
}
