import { createI18n } from 'vue-i18n';
import en from '../json/i18n-en.json';
import es from '../json/i18n-es.json';

// Create i18n instance with options
export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es }
});

export const interpolateText = (template, variables, before = '', after = '') => {
  // Swap placeholders in a string with the matching values
  return Object.entries(variables).reduce((str, [key, value]) => {
    const pattern = new RegExp(`\\{\\s*${key}\\s*\\}`, 'g');
    return str.replace(pattern, before + value + after);
  }, template);
}