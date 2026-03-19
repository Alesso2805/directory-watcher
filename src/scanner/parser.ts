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

interface SecurityRule {
  id: string;
  type: 'SECRET' | 'VULNERABILITY';
  description: string;
  nodeType: 'Literal' | 'CallExpression';
  detect: (node: any) => boolean;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: 'stripe-key',
    type: 'SECRET',
    description: 'Posible clave secreta expuesta (Stripe/API key)',
    nodeType: 'Literal',
    detect: (node) => typeof node.value === 'string' && 
                      (node.value.startsWith('sk_live_') || node.value.startsWith('sk_test_'))
  },
  {
    id: 'jwt-token',
    type: 'SECRET',
    description: 'Posible Token/JWT harcodeado',
    nodeType: 'Literal',
    detect: (node) => typeof node.value === 'string' && 
                      /y[0-9a-zA-Z]{3}\.[a-zA-Z0-9_-]{4,}\.[a-zA-Z0-9_-]{4,}/.test(node.value)
  },
  {
    id: 'eval-usage',
    type: 'VULNERABILITY',
    description: 'Uso de eval() detectado. Inyeccion de codigo posible.',
    nodeType: 'CallExpression',
    detect: (node) => node.callee.type === 'Identifier' && node.callee.name === 'eval'
  }
];

export function scanFile(filePath: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const ast = acorn.parse(content, { 
      ecmaVersion: 'latest', 
      sourceType: 'module',
      locations: true 
    });

    const evaluateRules = (node: any, expectedType: 'Literal' | 'CallExpression') => {
      SECURITY_RULES
        .filter(rule => rule.nodeType === expectedType)
        .forEach(rule => {
          if (rule.detect(node)) {
            issues.push({
              type: rule.type,
              message: rule.description,
              line: node.loc.start.line,
              file: filePath
            });
          }
        });
    };

    walk.simple(ast, {
      Literal(node: any) {
        evaluateRules(node, 'Literal');
      },
      CallExpression(node: any) {
        evaluateRules(node, 'CallExpression');
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
    logger.debug(`No se pudo parsear el archivo ${filePath} con acorn (podria ser TS u otra sintaxis): ${error.message}`);
  }

  return issues;
}
