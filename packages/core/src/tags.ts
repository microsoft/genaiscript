/**
 * Filters a tag based on a list of tags.
 * It checks if the tag starts with any of the tags in the list.
 * If a tag starts with ":!", it is treated as an exclusion.
 * If no tags are provided, it returns true.
 * If the tag starts with any of the tags in the list, it returns true.
 * If the tag starts with ":!" and matches any of the tags in the list, it returns false.
 * If the tag starts with any of the tags in the list and there are exclusions, it returns true.
 * If the tag does not match any of the tags in the list, it returns false.
 * @param tags List of tags to filter against, with ":!" indicating exclusions.
 * @param tag The tag to be checked.
 * @returns Whether the tag passes the filter.
 */
export function tagFilter(tags: string[], tag: string) {
  if (!tags?.length) return true;

  // normalize tag
  const ltag = tag?.toLocaleLowerCase() || "";

  let noMatchDefault = false;
  // apply exclusions first
  for (const t of tags.filter((t) => t.startsWith(":!"))) {
    const lt = t.toLocaleLowerCase();
    if (ltag.startsWith(lt.slice(2))) return false;
    noMatchDefault = true; // if any exclusion is found, set noMatchDefault to true
  }

  // apply inclusions
  for (const t of tags.filter((t) => !t.startsWith(":!"))) {
    noMatchDefault = false; // if any inclusion is found, set noMatchDefault to false
    // check if the tag starts with the inclusion tag
    const lt = t.toLocaleLowerCase();
    if (ltag.startsWith(lt)) return true;
  }

  // no matches
  return noMatchDefault;
}
