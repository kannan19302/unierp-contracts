const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
        } else if (fullPath.endsWith('.spec.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('from "node:test"')) {
                content = content.replace(/from "node:test"/g, 'from "vitest"');
                fs.writeFileSync(fullPath, content);
                console.log(`Fixed ${fullPath}`);
            }
        }
    }
}

fixFiles(srcDir);
