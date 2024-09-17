const container = await host.container({
    name: "optillm",
    ports: { containerPort: "8000/tcp", hostPort: 8000 },
    env: {},
})

await container.writeText(
    `setup.sh`,
    `#!/bin/bash
git clone https://github.com/codelion/optillm.git
cd optillm
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
`
)
await container.exec(`sh`, [`setup.sh`], { cwd: `optillm` })
container.exec(`python3`, [`optillm.py`], { cwd: `optillm` })
