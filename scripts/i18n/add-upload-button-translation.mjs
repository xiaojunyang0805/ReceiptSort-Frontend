import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../messages');

const translations = {
  en: "Upload Receipt",
  zh: "上传收据",
  nl: "Bon uploaden",
  de: "Beleg hochladen",
  fr: "Télécharger le reçu",
  es: "Subir recibo",
  ja: "レシートをアップロード"
};

const languages = ['en', 'zh', 'nl', 'de', 'fr', 'es', 'ja'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Add uploadButton to dashboard.receiptsPage
    if (!data.dashboard) data.dashboard = {};
    if (!data.dashboard.receiptsPage) data.dashboard.receiptsPage = {};

    data.dashboard.receiptsPage.uploadButton = translations[lang];

    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Added uploadButton translation to ${lang}.json: "${translations[lang]}"`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files updated with uploadButton translation');
