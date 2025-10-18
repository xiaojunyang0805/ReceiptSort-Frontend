import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../messages');

const translations = {
  en: {
    common: {
      billing: "Billing",
      account: "Account"
    },
    billing: {
      title: "Billing & Purchase History",
      description: "View and download your purchase invoices for accounting and tax filing",
      noInvoices: "No Purchase History",
      noInvoicesDescription: "Purchase credits to get started and receive invoices for your transactions",
      purchaseCredits: "Purchase Credits"
    },
    account: {
      title: "Account Settings",
      description: "Manage your account information and preferences",
      profileTitle: "Profile Information",
      profileDescription: "Your personal information and contact details",
      fullName: "Full Name",
      email: "Email Address",
      userId: "User ID",
      notSet: "Not set",
      creditsTitle: "Credits Balance",
      creditsDescription: "Your current credit balance for receipt processing",
      currentCredits: "Current Credits",
      purchaseCredits: "Purchase More Credits",
      billingTitle: "Billing & Invoices",
      billingDescription: "View your purchase history and download invoices",
      viewBilling: "View Billing History",
      accountCreated: "Account created on"
    }
  },
  zh: {
    common: {
      billing: "账单",
      account: "账户"
    },
    billing: {
      title: "账单与购买记录",
      description: "查看和下载您的购买发票，用于会计和报税",
      noInvoices: "暂无购买记录",
      noInvoicesDescription: "购买积分即可开始并获取交易发票",
      purchaseCredits: "购买积分"
    },
    account: {
      title: "账户设置",
      description: "管理您的账户信息和偏好设置",
      profileTitle: "个人资料",
      profileDescription: "您的个人信息和联系方式",
      fullName: "姓名",
      email: "电子邮箱",
      userId: "用户ID",
      notSet: "未设置",
      creditsTitle: "积分余额",
      creditsDescription: "您当前的收据处理积分余额",
      currentCredits: "当前积分",
      purchaseCredits: "购买更多积分",
      billingTitle: "账单与发票",
      billingDescription: "查看您的购买历史并下载发票",
      viewBilling: "查看账单历史",
      accountCreated: "账户创建于"
    }
  },
  nl: {
    common: {
      billing: "Facturering",
      account: "Account"
    },
    billing: {
      title: "Facturering & Aankoopgeschiedenis",
      description: "Bekijk en download uw aankoopfacturen voor boekhouding en belastingaangifte",
      noInvoices: "Geen aankoopgeschiedenis",
      noInvoicesDescription: "Koop credits om te beginnen en facturen voor uw transacties te ontvangen",
      purchaseCredits: "Credits kopen"
    },
    account: {
      title: "Accountinstellingen",
      description: "Beheer uw accountinformatie en voorkeuren",
      profileTitle: "Profielinformatie",
      profileDescription: "Uw persoonlijke informatie en contactgegevens",
      fullName: "Volledige naam",
      email: "E-mailadres",
      userId: "Gebruikers-ID",
      notSet: "Niet ingesteld",
      creditsTitle: "Creditsaldo",
      creditsDescription: "Uw huidige creditsaldo voor bonverwerking",
      currentCredits: "Huidige credits",
      purchaseCredits: "Meer credits kopen",
      billingTitle: "Facturering & Facturen",
      billingDescription: "Bekijk uw aankoopgeschiedenis en download facturen",
      viewBilling: "Bekijk factureringsgeschiedenis",
      accountCreated: "Account aangemaakt op"
    }
  },
  de: {
    common: {
      billing: "Abrechnung",
      account: "Konto"
    },
    billing: {
      title: "Abrechnung & Kaufhistorie",
      description: "Zeigen Sie Ihre Kaufrechnungen für Buchhaltung und Steuererklärung an und laden Sie sie herunter",
      noInvoices: "Keine Kaufhistorie",
      noInvoicesDescription: "Kaufen Sie Credits, um loszulegen und Rechnungen für Ihre Transaktionen zu erhalten",
      purchaseCredits: "Credits kaufen"
    },
    account: {
      title: "Kontoeinstellungen",
      description: "Verwalten Sie Ihre Kontoinformationen und Einstellungen",
      profileTitle: "Profilinformationen",
      profileDescription: "Ihre persönlichen Informationen und Kontaktdaten",
      fullName: "Vollständiger Name",
      email: "E-Mail-Adresse",
      userId: "Benutzer-ID",
      notSet: "Nicht festgelegt",
      creditsTitle: "Credits-Guthaben",
      creditsDescription: "Ihr aktuelles Credits-Guthaben für die Belegverarbeitung",
      currentCredits: "Aktuelle Credits",
      purchaseCredits: "Weitere Credits kaufen",
      billingTitle: "Abrechnung & Rechnungen",
      billingDescription: "Zeigen Sie Ihre Kaufhistorie an und laden Sie Rechnungen herunter",
      viewBilling: "Abrechnungsverlauf anzeigen",
      accountCreated: "Konto erstellt am"
    }
  },
  fr: {
    common: {
      billing: "Facturation",
      account: "Compte"
    },
    billing: {
      title: "Facturation & Historique d'achat",
      description: "Consultez et téléchargez vos factures d'achat pour la comptabilité et la déclaration fiscale",
      noInvoices: "Aucun historique d'achat",
      noInvoicesDescription: "Achetez des crédits pour commencer et recevoir des factures pour vos transactions",
      purchaseCredits: "Acheter des crédits"
    },
    account: {
      title: "Paramètres du compte",
      description: "Gérez vos informations de compte et vos préférences",
      profileTitle: "Informations de profil",
      profileDescription: "Vos informations personnelles et coordonnées",
      fullName: "Nom complet",
      email: "Adresse e-mail",
      userId: "ID utilisateur",
      notSet: "Non défini",
      creditsTitle: "Solde de crédits",
      creditsDescription: "Votre solde de crédits actuel pour le traitement des reçus",
      currentCredits: "Crédits actuels",
      purchaseCredits: "Acheter plus de crédits",
      billingTitle: "Facturation & Factures",
      billingDescription: "Consultez votre historique d'achat et téléchargez les factures",
      viewBilling: "Voir l'historique de facturation",
      accountCreated: "Compte créé le"
    }
  },
  es: {
    common: {
      billing: "Facturación",
      account: "Cuenta"
    },
    billing: {
      title: "Facturación e Historial de compras",
      description: "Vea y descargue sus facturas de compra para contabilidad y declaración de impuestos",
      noInvoices: "Sin historial de compras",
      noInvoicesDescription: "Compre créditos para comenzar y recibir facturas de sus transacciones",
      purchaseCredits: "Comprar créditos"
    },
    account: {
      title: "Configuración de cuenta",
      description: "Administre su información de cuenta y preferencias",
      profileTitle: "Información de perfil",
      profileDescription: "Su información personal y datos de contacto",
      fullName: "Nombre completo",
      email: "Dirección de correo electrónico",
      userId: "ID de usuario",
      notSet: "No establecido",
      creditsTitle: "Saldo de créditos",
      creditsDescription: "Su saldo de créditos actual para el procesamiento de recibos",
      currentCredits: "Créditos actuales",
      purchaseCredits: "Comprar más créditos",
      billingTitle: "Facturación y Facturas",
      billingDescription: "Vea su historial de compras y descargue facturas",
      viewBilling: "Ver historial de facturación",
      accountCreated: "Cuenta creada el"
    }
  },
  ja: {
    common: {
      billing: "請求",
      account: "アカウント"
    },
    billing: {
      title: "請求と購入履歴",
      description: "会計と税務申告のために購入請求書を表示およびダウンロード",
      noInvoices: "購入履歴なし",
      noInvoicesDescription: "クレジットを購入して開始し、取引の請求書を受け取ります",
      purchaseCredits: "クレジットを購入"
    },
    account: {
      title: "アカウント設定",
      description: "アカウント情報と設定を管理",
      profileTitle: "プロフィール情報",
      profileDescription: "個人情報と連絡先の詳細",
      fullName: "氏名",
      email: "メールアドレス",
      userId: "ユーザーID",
      notSet: "未設定",
      creditsTitle: "クレジット残高",
      creditsDescription: "レシート処理の現在のクレジット残高",
      currentCredits: "現在のクレジット",
      purchaseCredits: "さらにクレジットを購入",
      billingTitle: "請求と請求書",
      billingDescription: "購入履歴を表示し、請求書をダウンロード",
      viewBilling: "請求履歴を表示",
      accountCreated: "アカウント作成日"
    }
  }
};

const languages = ['en', 'zh', 'nl', 'de', 'fr', 'es', 'ja'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Update common translations
    if (!data.common) data.common = {};
    data.common.billing = translations[lang].common.billing;
    data.common.account = translations[lang].common.account;

    // Rename "invoices" to "billing" (keep old data structure, just rename key)
    if (data.invoices) {
      data.billing = {
        ...translations[lang].billing,
        // Keep existing translations if they exist
        ...data.invoices
      };
      // Update with new translations
      Object.assign(data.billing, translations[lang].billing);
      delete data.invoices; // Remove old key
    } else {
      data.billing = translations[lang].billing;
    }

    // Add account section
    data.account = translations[lang].account;

    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${lang}.json with billing and account translations`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files updated successfully');
console.log('   - Renamed "invoices" → "billing"');
console.log('   - Added "account" section');
console.log('   - Updated "common" with billing and account keys');
