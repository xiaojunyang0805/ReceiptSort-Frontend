const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');
const localeDir = path.join(appDir, '[locale]');

// Folders to move
const foldersToMove = [
  '(auth)',
  '(dashboard)'
];

// Move function
function moveDirectory(source, destination) {
  try {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    // Use fs.cpSync for recursive copy (Node 16.7+)
    fs.cpSync(source, destination, { recursive: true });

    // Remove original
    fs.rmSync(source, { recursive: true, force: true });

    console.log(`✅ Moved: ${path.basename(source)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error moving ${path.basename(source)}:`, error.message);
    return false;
  }
}

// Main execution
console.log('Moving routes to [locale] directory...\n');

foldersToMove.forEach(folder => {
  const source = path.join(appDir, folder);
  const destination = path.join(localeDir, folder);

  if (fs.existsSync(source)) {
    moveDirectory(source, destination);
  } else {
    console.log(`⏭️  Skipped: ${folder} (doesn't exist)`);
  }
});

console.log('\n✨ Done!');
