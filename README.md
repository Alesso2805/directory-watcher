# Live Code Audit CLI 🛡️

CLI tool that provides real-time security auditing and vulnerability scanning for Node.js projects, catching insecure code patterns before they get committed.

## 🚀 Concepto y Problema a Resolver
En mi experiencia, la detección de secretos expuestos y dependencias vulnerables suele ocurrir "demasiado tarde" en la integración continua (CI). Este proyecto introduce la cultura DevSecOps *directamente en el entorno de desarrollo local* monitorizando los archivos al guardar.

## ⚙️ Arquitectura & Stack Tecnológico
Esta aplicación fue construida bajo la premisa de ser **veloz, concurrente y extensible**:

- **[Commander.js](https://github.com/tj/commander.js):** Para estructurar los subcomandos de forma modular.
- **AST Parsing ([Acorn](https://github.com/acornjs/acorn)):** En lugar de usar expresiones regulares planas para buscar errores (que es propenso a fallos), el escáner construye un *Abstract Syntax Tree* (AST) para interpretar el código semánticamente sin necesidad de ejecutarlo.
- **Observabilidad ([Pino](https://github.com/pinojs/pino)):** Elegí Pino.js frente a alternativas como Winston debido a su enorme ventaja en rendimiento al usar serialización asíncrona. En un contexto de auditoría masiva de archivos, reducir la penalización del I/O es crucial.
- **Watcher Asíncrono ([Chokidar](https://github.com/paulmillr/chokidar)):** Escucha eventos nativos del sistema de archivos (`inotify` o `FSEvents`) para actuar en milisegundos sin consumir excesiva CPU (polling).
- **Procesos Hijos (`child_process`):** Orquestación externa encapsulando `npm audit` y parseando su stdout en JSON para reportes integrados.

## 🧪 Estrategia de Testing (Vitest)
Se utiliza [Vitest](https://vitest.dev/) para Unit & Integration Tests. Se eligió Vitest sobre Jest por su soporte nativo de TypeScript y velocidad de ejecución, imitando el ecosistema actual de herramientas basadas en Vite. 
Para correr la suite de pruebas:
\`\`\`bash
npm run test
\`\`\`

## 🛠️ Instalación y Uso

1. Clonar este repositorio e instalar dependencias:
\`\`\`bash
npm install
\`\`\`

2. Para probar su funcionamiento, usa el entorno local con `tsx`:
\`\`\`bash
npm run start watch ./src
\`\`\`

3. Puedes compilar a Typescript para generar el binario productivo:
\`\`\`bash
npm run build
node ./dist/index.js watch .
\`\`\`

## Oportunidades de Mejora Futuras (Roadmap)
- Integrar `worker_threads` para parseo AST masivo en paralelo.
- Arquitectura de plugins (permitir que el usuario pase configuraciones `.audit-rules.json`).
- Integrar E2E testing simulando la línea de comandos entera con Crad.
