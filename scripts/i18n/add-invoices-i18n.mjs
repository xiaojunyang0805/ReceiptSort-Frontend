import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../messages');

const invoicesTranslations = {
  en: {
    title: "Invoices",
    description: "View and download all your purchase invoices for accounting and VAT filing",
    noInvoices: "No Invoices Yet",
    noInvoicesDescription: "Purchase credits to get started and receive invoices for your transactions",
    purchaseCredits: "Purchase Credits"
  },
  zh: {
    title: "发票",
    description: "查看和下载所有购买发票，用于会计和增值税申报",
    noInvoices: "暂无发票",
    noInvoicesDescription: "购买积分即可开始并获取交易发票",
    purchaseCredits: "购买积分"
  },
  nl: {
    title: "Facturen",
    description: "Bekijk en download al uw aankoopfacturen voor boekhouding en BTW-aangifte",
    noInvoices: "Nog geen facturen",
    noInvoicesDescription: "Koop credits om te beginnen en facturen voor uw transacties te ontvangen",
    purchaseCredits: "Credits kopen"
  },
  de: {
    title: "Rechnungen",
    description: "Zeigen Sie alle Kaufrechnungen für Buchhaltung und Umsatzsteuer an und laden Sie sie herunter",
    noInvoices: "Noch keine Rechnungen",
    noInvoicesDescription: "Kaufen Sie Credits, um loszulegen und Rechnungen für Ihre Transaktionen zu erhalten",
    purchaseCredits: "Credits kaufen"
  },
  fr: {
    title: "Factures",
    description: "Consultez et téléchargez toutes vos factures d'achat pour la comptabilité et la déclaration de TVA",
    noInvoices: "Aucune facture pour le moment",
    noInvoicesDescription: "Achetez des crédits pour commencer et recevoir des factures pour vos transactions",
    purchaseCredits: "Acheter des crédits"
  },
  es: {
    title: "Facturas",
    description: "Vea y descargue todas sus facturas de compra para contabilidad y declaración de IVA",
    noInvoices: "Aún no hay facturas",
    noInvoicesDescription: "Compre créditos para comenzar y recibir facturas de sus transacciones",
    purchaseCredits: "Comprar créditos"
  },
  ja: {
    title: "請求書",
    description: "会計とVAT申告のためにすべての購入請求書を表示およびダウンロード",
    noInvoices: "請求書はまだありません",
    noInvoicesDescription: "クレジットを購入して開始し、取引の請求書を受け取ります",
    purchaseCredits: "クレジットを購入"
  }
};

const languages = ['en', 'zh', 'nl', 'de', 'fr', 'es', 'ja'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Add invoices section
    data.invoices = invoicesTranslations[lang];

    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Added invoices translations to ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files updated with invoices translations');
