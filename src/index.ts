import { Command } from 'commander';
import { startLiveAudit } from './watcher.js';
import { runNpmAudit } from './audit/npm-audit.js';
import pc from 'picocolors';
import { logger } from './logger.js';
import * as path from 'path';

const program = new Command();

program
  .name('live-audit')
  .description('Herramienta CLI de auditoría de código en tiempo real 🛡️')
  .version('1.0.0');

program
  .command('watch')
  .description('Inicia el escaneo en tiempo real de un directorio')
  .argument('[dir]', 'Directorio a observar', '.')
  .action((dir) => {
    const targetDir = path.resolve(process.cwd(), dir);
    logger.info(`> ${pc.bold('Iniciando Live Audit CLI')}`);
    
    runNpmAudit(targetDir);

    startLiveAudit(targetDir);
  });

program
  .command('audit-deps')
  .description('Ejecuta auditoría profunda de dependencias')
  .argument('[dir]', 'Directorio del proyecto', '.')
  .action(async (dir) => {
    const targetDir = path.resolve(process.cwd(), dir);
    await runNpmAudit(targetDir);
  });

program.parse();
