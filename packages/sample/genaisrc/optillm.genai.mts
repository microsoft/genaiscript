const container = await host.container({
    name: "optillm",
    image: "python:3.8",
    ports: { containerPort: "8000/tcp", hostPort: 8000 },
    env: {},
    networkEnabled: true
})

await container.writeText(
    `setup.sh`,
    `#!/bin/bash
git clone https://github.com/codelion/optillm.git
cd optillm
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 optillm.py
`
)
container.exec(`sh`, [`setup.sh`])

