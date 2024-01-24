import { dirname, extname, basename, join, normalize, relative } from "path"

export function createVSPath(): Path {
    return <Path>{
        dirname,
        extname,
        basename,
        join,
        normalize,
        relative
    }
}
