import { Fragment, FragmentState } from "./ast"
import { StoredList } from "./stored_list"

interface SyncContext {
    fragmentByHash: Record<string, SyncFragment>
    edges: Record<string, SyncEdge>
}

interface SyncBase {
    type: string
}

interface SyncFragment extends SyncBase {
    type: "fragment"
    hash: string
    id: string
    text: string
}

interface SyncEdge extends SyncBase {
    type: "edge"
    hash: string
    state: FragmentState
    children: string[] // hashes of children
}

type SyncEntry = SyncFragment | SyncEdge

function edgeKey(edge: SyncEdge) {
    return [edge, ...edge.children].join(",")
}

function updateState(ctx: SyncContext, e: SyncEntry) {
    if (e.type == "fragment") ctx.fragmentByHash[e.hash] = e
    else if (e.type == "edge") ctx.edges[edgeKey(e)] = e
}

async function getState() {
    const r = StoredList.byName<SyncEntry, SyncContext>("syncstate")
    if (!r.userData) {
        r.userData = { fragmentByHash: {}, edges: {} }
        for (const e of await r.entries()) updateState(r.userData, e)
    }
    return r
}

function syncEdge(frag: Fragment, state: FragmentState): SyncEdge {
    return {
        type: "edge",
        hash: frag.hash,
        children: frag.children.map((t) => t.hash),
        state,
    }
}

async function addSyncedFragment(frag: Fragment, fragState: FragmentState) {
    if (frag.children.length == 0) return
    const state = await getState()
    const edge = syncEdge(frag, fragState)
    const ex = state.userData.edges[edgeKey(edge)]
    if (ex?.state == fragState) return

    const edit: SyncEntry[] = []
    const byHash = state.userData.fragmentByHash
    for (const t of [frag, ...frag.children]) {
        if (!byHash[t.hash] && !edit.some((e) => e.hash == t.hash))
            edit.push({
                type: "fragment",
                hash: t.hash,
                id: t.id,
                text: t.text,
            })
    }
    edit.push(edge)

    await state.push(...edit)
    for (const e of edit) updateState(state.userData, e)
}

export async function markSyncedFragment(
    frag: Fragment,
    fragState: FragmentState
) {
    await addSyncedFragment(frag, fragState)
    frag.state = fragState
}

export async function getFragmentState(frag: Fragment) {
    const state = await getState()
    return state.userData.edges[edgeKey(syncEdge(frag, "mod"))]?.state
}
