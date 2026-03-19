import { describe, it, expect } from 'vitest';
import { scanFile } from './parser.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Vulnerability Parser', () => {
    it('debería detectar eval()', () => {
        const testPath = path.resolve(__dirname, 'test-dummy.js');
        fs.writeFileSync(testPath, `
            function x() {
                eval("console.log('malice')");
            }
        `);

        const issues = scanFile(testPath);
        fs.unlinkSync(testPath);

        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('VULNERABILITY');
        expect(issues[0].message).toContain('eval()');
    });

    it('debería detectar keys harcodeadas de stripe', () => {
        const testPath = path.resolve(__dirname, 'test-stripe.js');
        fs.writeFileSync(testPath, `
            const API_KEY = "sk_live_1234567890";
        `);

        const issues = scanFile(testPath);
        fs.unlinkSync(testPath);

        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('SECRET');
        expect(issues[0].message).toContain('Stripe');
    });

    it('no debería reportar nada en archivos limpios', () => {
        const testPath = path.resolve(__dirname, 'test-clean.js');
        fs.writeFileSync(testPath, `
            console.log("Hola mundo");
            const x = 10;
        `);

        const issues = scanFile(testPath);
        fs.unlinkSync(testPath);

        expect(issues).toHaveLength(0);
    });
});
