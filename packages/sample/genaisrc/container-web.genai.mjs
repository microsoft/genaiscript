script({
    model: "gpt-3.5-turbo",
})

const disablePurge = env.vars.purge === "no"

// start web server
const hostPort = 8089
const webContainer = await host.container({
    disablePurge,
    networkEnabled: true,
    ports: { containerPort: "80/tcp", hostPort },
})
await webContainer.writeText(
    "main.py",
    `
import http.server
import socketserver
import urllib.parse

PORT = 80

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/echo':
            query = urllib.parse.parse_qs(parsed_path.query)
            message = query.get('message', [''])[0]
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(message.encode())
        else:
            super().do_GET()

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
`
)
webContainer.exec("python", ["main.py"]) // don't await
await sleep(1000) // wait for server to start
const msg = Math.random().toString()
const url = `http://localhost:${hostPort}/echo?message=` + msg
console.log(`fetching ${url} with msg ${msg}`)
const res = await fetch(url)
console.log(res.status)
const text = await res.text()
console.log(text)
if (text !== msg) throw new Error(`expected ${msg}, got ${text} instead`)

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

