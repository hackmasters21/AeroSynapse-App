import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import ptTranslations from './locales/pt.json';
import frTranslations from './locales/fr.json';

// Configuración de recursos de idiomas
const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  },
  pt: {
    translation: ptTranslations
  },
  fr: {
    translation: frTranslations
  }
};

// Limpiar localStorage para forzar inglés
if (typeof window !== 'undefined') {
  localStorage.removeItem('aerosynapse-language');
  localStorage.setItem('aerosynapse-language', 'en');
}

// Configuración de i18n
i18n
  .use(LanguageDetector) // Detecta el idioma del navegador
  .use(initReactI18next) // Pasa i18n a react-i18next
  .init({
    resources,
    
    // Idioma por defecto - INGLÉS FORZADO
    fallbackLng: 'en',
    lng: 'en', // Forzar inglés como idioma inicial
    load: 'languageOnly', // Solo cargar idioma principal
    preload: ['en'], // Precargar solo inglés
    
    // Idiomas soportados
    supportedLngs: ['en', 'es', 'pt', 'fr'],
    
    // Configuración de detección de idioma - DESHABILITADA
    // detection: {
    //   order: ['localStorage', 'querystring'],
    //   caches: ['localStorage'],
    //   lookupLocalStorage: 'aerosynapse-language',
    //   lookupQuerystring: 'lng'
    // },
    
    // Configuración de interpolación
    interpolation: {
      escapeValue: false // React ya escapa por defecto
    },
    
    // Configuración de debug (solo en desarrollo)
    debug: process.env.NODE_ENV === 'development',
    
    // Configuración de namespace
    defaultNS: 'translation',
    
    // Configuración de plurales
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Configuración de formato
    returnObjects: false,
    returnEmptyString: false,
    returnNull: false,
    
    // Configuración de post-procesamiento
    postProcess: false,
    
    // Configuración de react
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
    }
  });

// Función para cambiar idioma
export const changeLanguage = (lng: string) => {
  return i18n.changeLanguage(lng);
};

// Función para obtener idioma actual
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Función para obtener idiomas disponibles
export const getAvailableLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'fr', name: 'French', nativeName: 'Français' }
  ];
};

// Función para formatear números según el idioma
export const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat(i18n.language, options).format(number);
};

// Función para formatear fechas según el idioma
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(i18n.language, options).format(date);
};

// Función para formatear tiempo relativo
export const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit) => {
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
  return rtf.format(value, unit);
};

export default i18n;