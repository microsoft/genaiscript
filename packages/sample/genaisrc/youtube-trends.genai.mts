/*import { classify } from "genaiscript/runtime"

script({
    files: "src/video/introduction.mkv",
    parameters: {
        trends: {
            type: "number",
            description: "Number of trending keywords to match from youtube",
            default: 100,
        },
    },
})

const { files, output, vars } = env
const { trends: maxtTrends = 20 } = vars

async function fetchTrendingKeywords() {
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=${maxtTrends}&key=${process.env.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(await response.text())
    const data: any = await response.json()
    const keywords = data.items.flatMap((item) => item.snippet.tags || [])
    const res = keywords.reduce((acc, curr) => {
        if (acc[curr]) {
            acc[curr]++
        } else {
            acc[curr] = 1
        }
        return acc
    }, {})
    return Object.keys(res).slice(0, 10)
}

// google trands
const trends = await fetchTrendingKeywords()
output.detailsFenced(`youtube trends`, trends)
const { label: activeKeywords } = await classify(res.text, trends)
output.detailsFenced(`matching trend`, activeKeywords)
*/
