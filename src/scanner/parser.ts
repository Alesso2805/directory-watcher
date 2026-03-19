import * as fs from 'fs';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import pc from 'picocolors';
import { logger } from '../logger.js';

export interface AuditIssue {
  type: 'SECRET' | 'VULNERABILITY';
  message: string;
  line: number;
  file: string;
}

export function scanFile(filePath: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const ast = acorn.parse(content, { 
      ecmaVersion: 'latest', 
      sourceType: 'module',
      locations: true 
    });

    walk.simple(ast, {
      Literal(node: any) {
        if (typeof node.value === 'string') {
          const val = node.value as string;
          if (val.startsWith('sk_live_') || val.startsWith('sk_test_')) {
            issues.push({
               type: 'SECRET',
               message: 'Posible clave secreta expuesta (Stripe/API key)',
               line: node.loc.start.line,
               file: filePath
            });
          }
          if (/y[0-9a-zA-Z]{3}\.[a-zA-Z0-9_-]{4,}\.[a-zA-Z0-9_-]{4,}/.test(val)) {
            issues.push({
               type: 'SECRET',
               message: 'Posible Token/JWT harcodeado',
               line: node.loc.start.line,
               file: filePath
            });
          }
        }
      },
      CallExpression(node: any) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
          issues.push({
             type: 'VULNERABILITY',
             message: 'Uso de eval() detectado. Inyeccion de codigo posible.',
             line: node.loc.start.line,
             file: filePath
          });
        }
      }
    });

    if (issues.length > 0) {
      issues.forEach(issue => {
        logger.warn(`${pc.red(`[${issue.type}]`)} ${issue.message} en ${pc.cyan(issue.file)}:${pc.yellow(issue.line)}`);
      });
    } else {
      logger.info(`${pc.green('[OK]')} ${filePath} escaneado. Sin vulnerabilidades.`);
    }

  } catch (error: any) {
    logger.debug(`No se pudo parsear el archivo ${filePath} con acorn (podria ser un archivo TS con tipos u otra sintaxis): ${error.message}`);
  }

  return issues;
}
