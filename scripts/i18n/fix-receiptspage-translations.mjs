import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../messages');

const languages = ['en', 'zh', 'nl', 'de', 'fr', 'es', 'ja'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Check if there's a receiptsPage at root level (wrong location)
    if (data.receiptsPage && data.dashboard && data.dashboard.receiptsPage) {
      console.log(`Found duplicate receiptsPage in ${lang}.json - merging...`);

      // Merge root receiptsPage into dashboard.receiptsPage
      Object.assign(data.dashboard.receiptsPage, data.receiptsPage);

      // Remove the root-level receiptsPage
      delete data.receiptsPage;

      // Write back with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

      console.log(`✅ Fixed ${lang}.json - merged receiptsPage into dashboard.receiptsPage`);
    } else if (data.receiptsPage) {
      console.log(`Found receiptsPage at root in ${lang}.json - moving to dashboard...`);

      // Move to dashboard
      if (!data.dashboard) data.dashboard = {};
      if (!data.dashboard.receiptsPage) data.dashboard.receiptsPage = {};

      Object.assign(data.dashboard.receiptsPage, data.receiptsPage);
      delete data.receiptsPage;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

      console.log(`✅ Fixed ${lang}.json - moved receiptsPage to dashboard`);
    } else {
      console.log(`✅ ${lang}.json structure is correct`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files fixed');
console.log('   receiptsPage keys are now properly nested under dashboard.receiptsPage');
