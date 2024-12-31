import { useEffect, useState } from "react"

/* eslint-disable-next-line */
type TUseSearchParams = <T = Record<string, any>>(
    url?: string,
    opt?: { unique: boolean }
) => T

export const useSearchParams: TUseSearchParams = <T>(
    url = location.href,
    opt = { unique: true }
) => {
    const _urlSearch = new URL(url)
    const [params, setParams] = useState<Record<string, string | string[]>>(
        () => Object.fromEntries(_urlSearch.searchParams.entries())
    )

    useEffect(() => {
        const len: number = Object.values(params).length

        if (!opt || opt.unique || len === _urlSearch.searchParams?.size) return

        for (const [key, value] of _urlSearch.searchParams) {
            if (value === params?.[key]) continue
            if (
                Array.isArray(params?.[key]) &&
                Array.from(params?.[key]).includes(value)
            )
                continue
            setParams(() => ({
                ...params,
                [key]: [...(params?.[key] ?? []), value],
            }))
        }
    }, [])

    return Object.fromEntries(
        Object.entries(params).map(([key, value]) => [
            key,
            !Array.isArray(value)
                ? JSON.parse(value)
                : value.map((items) => JSON.parse(items)),
        ])
    ) as T
}
