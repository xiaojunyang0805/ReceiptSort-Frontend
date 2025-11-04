import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../messages');

const translations = {
  en: {
    dashboard: {
      overview: {
        lastExport: {
          never: "Never"
        }
      }
    },
    receiptsPage: {
      noReceipts: "No receipts yet",
      noReceiptsDescription: "Upload your first receipt to get started"
    }
  },
  zh: {
    dashboard: {
      overview: {
        lastExport: {
          never: "从未"
        }
      }
    },
    receiptsPage: {
      noReceipts: "暂无收据",
      noReceiptsDescription: "上传您的第一张收据以开始使用"
    }
  },
  nl: {
    dashboard: {
      overview: {
        lastExport: {
          never: "Nooit"
        }
      }
    },
    receiptsPage: {
      noReceipts: "Nog geen bonnen",
      noReceiptsDescription: "Upload uw eerste bon om te beginnen"
    }
  },
  de: {
    dashboard: {
      overview: {
        lastExport: {
          never: "Nie"
        }
      }
    },
    receiptsPage: {
      noReceipts: "Noch keine Belege",
      noReceiptsDescription: "Laden Sie Ihren ersten Beleg hoch, um loszulegen"
    }
  },
  fr: {
    dashboard: {
      overview: {
        lastExport: {
          never: "Jamais"
        }
      }
    },
    receiptsPage: {
      noReceipts: "Aucun reçu pour le moment",
      noReceiptsDescription: "Téléchargez votre premier reçu pour commencer"
    }
  },
  es: {
    dashboard: {
      overview: {
        lastExport: {
          never: "Nunca"
        }
      }
    },
    receiptsPage: {
      noReceipts: "Aún no hay recibos",
      noReceiptsDescription: "Sube tu primer recibo para comenzar"
    }
  },
  ja: {
    dashboard: {
      overview: {
        lastExport: {
          never: "なし"
        }
      }
    },
    receiptsPage: {
      noReceipts: "レシートはまだありません",
      noReceiptsDescription: "最初のレシートをアップロードして開始します"
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const languages = ['en', 'zh', 'nl', 'de', 'fr', 'es', 'ja'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Deep merge the translations
    deepMerge(data, translations[lang]);

    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Added missing translations to ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files updated with missing translations');
console.log('   - Added dashboard.overview.lastExport.never');
console.log('   - Added receiptsPage.noReceipts and noReceiptsDescription');
