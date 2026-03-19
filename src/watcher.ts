import chokidar from 'chokidar';
import { logger } from './logger.js';
import pc from 'picocolors';
import { scanFile } from './scanner/parser.js';

export function startLiveAudit(targetDir: string) {
  logger.info(`Iniciando escaneo continuo en ${pc.magenta(targetDir)}...`);

  const watcher = chokidar.watch(targetDir, {
    ignored: /(^|[\/\\])\..|node_modules|dist/,
    persistent: true
  });

  watcher
    .on('add', (path) => {
        if (path.endsWith('.js') || path.endsWith('.ts')) {
            logger.debug(`Nuevo archivo detectado: ${path}`);
            scanFile(path);
        }
    })
    .on('change', (path) => {
        if (path.endsWith('.js') || path.endsWith('.ts')) {
            logger.info(`Archivo modificado: ${path}`);
            scanFile(path);
        }
    });

  return watcher;
}
