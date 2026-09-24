import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'
import te from './locales/te.json'

export const LANGUAGE_STORAGE_KEY = 'vetalert-language'

const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    te: { translation: te },
  },
  lng: savedLanguage || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang)
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
}

export default i18n
