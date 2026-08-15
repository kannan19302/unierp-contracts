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
            if (content.includes('from "vitest"')) {
                // We only changed the ones that originally had node:test, 
                // wait, some actually originally had vitest.
                // Oh no! I blindly replaced "node:test" to "vitest" earlier.
                // So now I should change back ONLY the files that were in the list.
                // The list of files that were fixed:
                const changedFiles = [
                    "api-versioning.spec.ts",
                    "backup-restore.spec.ts",
                    "client-generator.spec.ts",
                    "consumer-contract-test.spec.ts",
                    "contract-compatibility.spec.ts",
                    "contract-governance.spec.ts",
                    "contract-performance.spec.ts",
                    "contract-security.spec.ts",
                    "deprecation.spec.ts",
                    "idempotency.spec.ts",
                    "meta-schema.spec.ts",
                    "pagination.spec.ts",
                    "rate-limiting.spec.ts",
                    "runtime-validator.spec.ts",
                    "schema-completeness.spec.ts",
                    "sdk-compatibility.spec.ts",
                    "single-source-proof.spec.ts",
                    "webhook-contracts.spec.ts"
                ];
                if (changedFiles.includes(file)) {
                    content = content.replace(/from "vitest"/g, 'from "node:test"');
                    fs.writeFileSync(fullPath, content);
                    console.log(`Reverted ${fullPath}`);
                }
            }
        }
    }
}

fixFiles(srcDir);
