import { dirname, extname, basename, join } from "path"

export function createVSPath(): Path {
    return <Path>{
        dirname,
        extname,
        basename,
        join,
    }
}
