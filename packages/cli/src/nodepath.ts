import { dirname, extname, basename, join, normalize } from "path"

export function createNodePath(): Path {
    return <Path>{
        dirname,
        extname,
        basename,
        join,
        normalize,
    }
}
