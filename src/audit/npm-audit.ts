import { exec } from 'child_process';
import { promisify } from 'util';
import pc from 'picocolors';
import { logger } from '../logger.js';

const execAsync = promisify(exec);

export async function runNpmAudit(targetDir: string) {
  logger.info(`Corriendo auditoria de dependencias en ${pc.magenta(targetDir)}...`);
  try {
    const { stdout, stderr } = await execAsync('npm audit --json', { cwd: targetDir });
    const result = JSON.parse(stdout);
    analyzeAuditResult(result);
  } catch (error: any) {
    if (error.stdout) {
        try {
            const result = JSON.parse(error.stdout);
            analyzeAuditResult(result);
        } catch (e) {
            logger.error(`Error procesando audit: ${error.message}`);
        }
    } else {
        logger.error(`No se pudo ejecutar npm audit: ${error.message}`);
    }
  }
}

function analyzeAuditResult(result: any) {
  const vulnerabilities = result.metadata?.vulnerabilities;
  if (!vulnerabilities) return;

  const total = Object.values(vulnerabilities).reduce((acc: any, val: any) => acc + val, 0);

  if (total === 0) {
    logger.info(`[OK] ${pc.green('npm audit: 0 vulnerabilidades. Dependencias seguras.')}`);
    return;
  }

  logger.warn(`[WARN] npm audit detecto ${pc.red(total + ' vulnerabilidades')} en total.`);
  if (vulnerabilities.high > 0) {
    logger.error(`${pc.bold('[ERROR] Problemas criticos/altas:')} ${vulnerabilities.high}`);
  }
}
