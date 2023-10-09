
# Contributing

This project uses [DeviceScript](https://microsoft.github.io/devicescript/)
which provides a TypeScript experience for micro-controllers. 

The best development experience is done through Visual Studio Cocde and the DeviceScript extension;
but a command line tool is also available.

Container development (Codespaces, CodeSandbox, ...)
is supported but connection to hardware (through Serial or USB) is not available.
Simulators and compilers will work.


## Local development

-  install [Node.js LTS](https://nodejs.org/en/download) using [nvm](https://github.com/nvm-sh/nvm)

```bash
nvm install --lts
nvm use --lts
```

-  install DeviceScript compiler and tools

```bash
npm install
```

- open the project folder in [Visual Studio Code](https://code.visualstudio.com/)

```bash
code .
```

- install the [DeviceScript extension](https://microsoft.github.io/devicescript/getting-started/vscode)

- open `main.ts` and click on the **play** icon to start the simulator

