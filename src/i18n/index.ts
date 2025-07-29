import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      'welcome': 'Welcome to FundFlow Africa',
      'transparency': 'Transparency for African Development',
      'donate': 'Donate Now',
      'projects': 'Active Projects',
      'impact': 'Community Impact',
      'validators': 'Community Validators',
      'mobile_money': 'Mobile Money',
      'blockchain': 'Blockchain Secured',
      'offline': 'Works Offline',
      'community': 'Community Driven',
      'connect_wallet': 'Connect Wallet',
      'view_projects': 'View Projects',
      'track_impact': 'Track Impact',
      'join_validators': 'Become a Validator',
      'water_access': 'Water Access Improved',
      'schools_built': 'Schools Built',
      'health_clinics': 'Health Clinics Supported',
      'jobs_created': 'Jobs Created',
      'communities_reached': 'Communities Reached'
    }
  },
  sw: {
    translation: {
      'welcome': 'Karibu FundFlow Afrika',
      'transparency': 'Uwazi kwa Maendeleo ya Afrika',
      'donate': 'Changia Sasa',
      'projects': 'Miradi Hai',
      'impact': 'Athari za Jamii',
      'validators': 'Wathibitishaji wa Jamii',
      'mobile_money': 'Pesa za Simu',
      'blockchain': 'Imelindwa na Blockchain',
      'offline': 'Inafanya Kazi Bila Mtandao',
      'community': 'Inaongozwa na Jamii',
      'connect_wallet': 'Unganisha Mkoba',
      'view_projects': 'Ona Miradi',
      'track_impact': 'Fuatilia Athari',
      'join_validators': 'Kuwa Mthibitishaji',
      'water_access': 'Upatikanaji wa Maji Umeboreshwa',
      'schools_built': 'Shule Zilizojengwa',
      'health_clinics': 'Klinika za Afya Zilizosaidiwa',
      'jobs_created': 'Kazi Zilizotengenezwa',
      'communities_reached': 'Jamii Zilizofikiwa'
    }
  },
  fr: {
    translation: {
      'welcome': 'Bienvenue sur FundFlow Afrique',
      'transparency': 'Transparence pour le Développement Africain',
      'donate': 'Faire un Don',
      'projects': 'Projets Actifs',
      'impact': 'Impact Communautaire',
      'validators': 'Validateurs Communautaires',
      'mobile_money': 'Mobile Money',
      'blockchain': 'Sécurisé par Blockchain',
      'offline': 'Fonctionne Hors Ligne',
      'community': 'Piloté par la Communauté',
      'connect_wallet': 'Connecter le Portefeuille',
      'view_projects': 'Voir les Projets',
      'track_impact': 'Suivre l\'Impact',
      'join_validators': 'Devenir Validateur',
      'water_access': 'Accès à l\'Eau Amélioré',
      'schools_built': 'Écoles Construites',
      'health_clinics': 'Cliniques de Santé Soutenues',
      'jobs_created': 'Emplois Créés',
      'communities_reached': 'Communautés Atteintes'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;