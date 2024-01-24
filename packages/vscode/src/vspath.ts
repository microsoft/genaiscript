import { dirname, extname, basename, join, normalize } from "path"

export function createVSPath(): Path {
    return <Path>{
        dirname,
        extname,
        basename,
        join,
        normalize
    }
}
