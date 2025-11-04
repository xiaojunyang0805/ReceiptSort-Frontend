import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../messages');

const translations = {
  en: {
    enterName: "Enter your full name",
    saveChanges: "Save Changes",
    updateSuccess: "Profile updated successfully!",
    updateError: "Failed to update profile. Please try again.",
    emailCannotChange: "Email address cannot be changed"
  },
  zh: {
    enterName: "输入您的全名",
    saveChanges: "保存更改",
    updateSuccess: "个人资料更新成功！",
    updateError: "更新个人资料失败。请重试。",
    emailCannotChange: "电子邮箱无法更改"
  },
  nl: {
    enterName: "Voer uw volledige naam in",
    saveChanges: "Wijzigingen opslaan",
    updateSuccess: "Profiel succesvol bijgewerkt!",
    updateError: "Profiel bijwerken mislukt. Probeer het opnieuw.",
    emailCannotChange: "E-mailadres kan niet worden gewijzigd"
  },
  de: {
    enterName: "Geben Sie Ihren vollständigen Namen ein",
    saveChanges: "Änderungen speichern",
    updateSuccess: "Profil erfolgreich aktualisiert!",
    updateError: "Profil konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
    emailCannotChange: "E-Mail-Adresse kann nicht geändert werden"
  },
  fr: {
    enterName: "Entrez votre nom complet",
    saveChanges: "Enregistrer les modifications",
    updateSuccess: "Profil mis à jour avec succès !",
    updateError: "Échec de la mise à jour du profil. Veuillez réessayer.",
    emailCannotChange: "L'adresse e-mail ne peut pas être modifiée"
  },
  es: {
    enterName: "Ingrese su nombre completo",
    saveChanges: "Guardar cambios",
    updateSuccess: "¡Perfil actualizado exitosamente!",
    updateError: "Error al actualizar el perfil. Por favor, inténtelo de nuevo.",
    emailCannotChange: "La dirección de correo electrónico no se puede cambiar"
  },
  ja: {
    enterName: "フルネームを入力してください",
    saveChanges: "変更を保存",
    updateSuccess: "プロフィールが正常に更新されました！",
    updateError: "プロフィールの更新に失敗しました。もう一度お試しください。",
    emailCannotChange: "メールアドレスは変更できません"
  }
};

const languages = ['en', 'zh', 'nl', 'de', 'fr', 'es', 'ja'];

languages.forEach(lang => {
  const filePath = path.join(messagesDir, `${lang}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Add new keys to account section
    if (!data.account) {
      console.error(`❌ No account section in ${lang}.json - run add-account-billing-i18n.mjs first`);
      return;
    }

    // Add the new translation keys
    Object.assign(data.account, translations[lang]);

    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Added profile edit translations to ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files updated with profile editing translations');
