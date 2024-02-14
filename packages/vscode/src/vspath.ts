import {
    dirname,
    extname,
    basename,
    join,
    normalize,
    relative,
    resolve,
} from "path"

export function createVSPath(): Path {
    return <Path>{
        dirname,
        extname,
        basename,
        join,
        normalize,
        relative,
        resolve,
    }
}
