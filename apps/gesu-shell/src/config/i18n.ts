/**
 * i18n Configuration
 * Internationalization setup using react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations - English
import enCommon from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enCompass from '../locales/en/compass.json';
import enSettings from '../locales/en/settings.json';
import enActivity from '../locales/en/activity.json';
import enInitiator from '../locales/en/initiator.json';
import enRefocus from '../locales/en/refocus.json';
import enMediasuite from '../locales/en/mediasuite.json';
import enLogin from '../locales/en/login.json';
import enFocus from '../locales/en/focus.json';
import enModals from '../locales/en/modals.json';
import enBusiness from '../locales/en/business.json';
import enInvoices from '../locales/en/invoices.json';
import enDeliverables from '../locales/en/deliverables.json';
import enFinance from '../locales/en/finance.json';
import enSecondbrain from '../locales/en/secondbrain.json';

// Import translations - Indonesian
import idCommon from '../locales/id/common.json';
import idDashboard from '../locales/id/dashboard.json';
import idCompass from '../locales/id/compass.json';
import idSettings from '../locales/id/settings.json';
import idActivity from '../locales/id/activity.json';
import idInitiator from '../locales/id/initiator.json';
import idRefocus from '../locales/id/refocus.json';
import idMediasuite from '../locales/id/mediasuite.json';
import idLogin from '../locales/id/login.json';
import idFocus from '../locales/id/focus.json';
import idModals from '../locales/id/modals.json';
import idBusiness from '../locales/id/business.json';
import idInvoices from '../locales/id/invoices.json';
import idDeliverables from '../locales/id/deliverables.json';
import idFinance from '../locales/id/finance.json';
import idSecondbrain from '../locales/id/secondbrain.json';

const resources = {
    en: {
        common: enCommon,
        dashboard: enDashboard,
        compass: enCompass,
        settings: enSettings,
        activity: enActivity,
        initiator: enInitiator,
        refocus: enRefocus,
        mediasuite: enMediasuite,
        login: enLogin,
        focus: enFocus,
        modals: enModals,
        business: enBusiness,
        invoices: enInvoices,
        deliverables: enDeliverables,
        finance: enFinance,
        secondbrain: enSecondbrain,
    },
    id: {
        common: idCommon,
        dashboard: idDashboard,
        compass: idCompass,
        settings: idSettings,
        activity: idActivity,
        initiator: idInitiator,
        refocus: idRefocus,
        mediasuite: idMediasuite,
        login: idLogin,
        focus: idFocus,
        modals: idModals,
        business: idBusiness,
        invoices: idInvoices,
        deliverables: idDeliverables,
        finance: idFinance,
        secondbrain: idSecondbrain,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'dashboard', 'compass', 'settings', 'activity', 'initiator', 'refocus', 'mediasuite', 'login', 'focus', 'modals', 'business', 'invoices', 'deliverables', 'finance', 'secondbrain'],
        
        interpolation: {
            escapeValue: false, // React already escapes
        },
        
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'gesu_language',
        },
    });

export default i18n;
