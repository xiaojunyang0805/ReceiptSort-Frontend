/**
 * Script to update Link imports from next/link to @/lib/navigation
 * Run with: node scripts/update-imports.js
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');
const APP_DIR = path.join(__dirname, '..', 'src', 'app');

function updateImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      updateImports(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;

      // Update next/link imports
      content = content.replace(
        /import Link from ['"]next\/link['"]/g,
        "import { Link } from '@/lib/navigation'"
      );

      // Update useRouter, usePathname imports from next/navigation
      // Only if they're used for navigation (not for API routes)
      if (content.includes("from 'next/navigation'")) {
        // Check if it's just useRouter and usePathname
        content = content.replace(
          /import \{ ([^}]*) \} from ['"]next\/navigation['"]/g,
          (match, imports) => {
            const importList = imports.split(',').map(i => i.trim());
            const navImports = [];
            const otherImports = [];

            importList.forEach(imp => {
              if (imp === 'useRouter' || imp === 'usePathname') {
                navImports.push(imp);
              } else {
                otherImports.push(imp);
              }
            });

            let result = '';
            if (navImports.length > 0) {
              result += `import { ${navImports.join(', ')} } from '@/lib/navigation'`;
            }
            if (otherImports.length > 0) {
              if (result) result += '\n';
              result += `import { ${otherImports.join(', ')} } from 'next/navigation'`;
            }
            return result || match;
          }
        );
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Updated: ${fullPath}`);
      }
    }
  });
}

console.log('Starting import updates...\n');
console.log('Updating components...');
updateImports(COMPONENTS_DIR);
console.log('\nUpdating app directory...');
updateImports(APP_DIR);
console.log('\n✨ Done! All imports updated.');
console.log('\n⚠️  Please review the changes and test your application.');
