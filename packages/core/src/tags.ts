
/**
 * Filters a tag based on a list of tags.
 * It checks if the tag starts with any of the tags in the list.
 * If a tag starts with ":!", it is treated as an exclusion.
 * If no tags are provided, it returns true.
 * If the tag starts with any of the tags in the list, it returns true.
 * If the tag starts with ":!" and matches any of the tags in the list, it returns false.
 * If the tag starts with any of the tags in the list and there are exclusions, it returns true.
 * If the tag does not match any of the tags in the list, it returns false.
 * @param tags 
 * @param tag 
 * @returns 
 */
export function tagFilter(tags: string[], tag: string) {
    if (!tags?.length) return true
    const ltag = tag?.toLocaleLowerCase() || ""
    let exclusive = false
    for (const t of tags) {
        const lt = t.toLocaleLowerCase()
        const exclude = lt.startsWith(":!")
        if (exclude) exclusive = true

        if (exclude && ltag.startsWith(lt.slice(2))) return false
        else if (ltag.startsWith(t)) return true
    }
    return exclusive
}
