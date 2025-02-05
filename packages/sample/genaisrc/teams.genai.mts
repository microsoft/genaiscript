import { microsoftTeamsUploadFile } from "genaiscript/runtime"

const teams =
    "https://teams.microsoft.com/l/channel/19%3Ac9392f56d1e940b5bed9abe766832aeb%40thread.tacv2/Test?groupId=5d76383e-5d3a-4b63-b36a-62f01cff2806"
await microsoftTeamsUploadFile(teams, "src/rag/markdown.md")
