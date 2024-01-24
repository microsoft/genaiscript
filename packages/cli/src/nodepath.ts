import { dirname, extname, basename, join } from "path"

export function createNodePath(): Path {
    return <Path>{
        dirname,
        extname,
        basename,
        join,
    }
}
