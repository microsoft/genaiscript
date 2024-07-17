import { join } from "node:path"
import { dotGenaiscriptPath } from "../../core/src/util"
import { emptyDir } from "fs-extra"

export async function cacheClear(name: string) {
    let dir = dotGenaiscriptPath("cache")
    if (["tests"].includes(name)) dir = join(dir, name)
    console.log(`removing ${dir}`)
    await emptyDir(dir)
}
