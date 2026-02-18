import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';

interface NavbarProps {
  currentView: 'home' | 'about' | 'news' | 'events' | 'drivers' | 'rules' | 'contact' | 'gallery';
  onViewChange: (view: 'home' | 'about' | 'news' | 'events' | 'drivers' | 'rules' | 'contact' | 'gallery') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const { getPage, getText, language, setSiteLanguage } = useSiteContent('navbar');
  const { getImage: getImageGeneral } = useSiteContent('general');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const navbarPage = getPage('navbar');
  const logoImg = getImageGeneral('SITE_LOGO_LIGHT').path;

  const defaultNavItems = [
    { name: 'ANA SƏHİFƏ', target: { type: 'view', view: 'home' } as NavTarget, activeView: 'home' },
    { name: 'HAQQIMIZDA', target: { type: 'view', view: 'about' } as NavTarget, activeView: 'about' },
    { name: 'XƏBƏRLƏR', target: { type: 'view', view: 'news' } as NavTarget, activeView: 'news' },
    { name: 'TƏDBİRLƏR', target: { type: 'view', view: 'events' } as NavTarget, activeView: 'events' },
    { name: 'SÜRÜCÜLƏR', target: { type: 'view', view: 'drivers' } as NavTarget, activeView: 'drivers' },
    { name: 'QALEREYA', target: { type: 'view', view: 'gallery' } as NavTarget, activeView: 'gallery' },
    { name: 'QAYDALAR', target: { type: 'view', view: 'rules' } as NavTarget, activeView: 'rules' },
    { name: 'ƏLAQƏ', target: { type: 'view', view: 'contact' } as NavTarget, activeView: 'contact' },
  ];

  const viewIds = new Set(['home', 'about', 'news', 'events', 'drivers', 'gallery', 'rules', 'contact']);
  const viewByPath: Record<string, string> = {
    home: 'home',
    about: 'about',
    news: 'news',
    events: 'events',
    drivers: 'drivers',
    gallery: 'gallery',
    rules: 'rules',
    contact: 'contact',
    ana: 'home',
    haqqimizda: 'about',
    xeberler: 'news',
    tedbirler: 'events',
    suruculer: 'drivers',
    qaydalar: 'rules',
    elaqe: 'contact',
  };

  type NavTarget =
    | { type: 'view'; view: string }
    | { type: 'external'; url: string };
  const normalize = (value: string) =>
    (value || '')
      .toLocaleLowerCase('az')
      .replace(/ə/g, 'e')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/ğ/g, 'g')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');

  const inferViewFromText = (value: string): string | null => {
    const token = normalize(value);
    if (token.includes('anashe') || token.includes('anasif')) return 'home';
    if (token.includes('haqqimizda')) return 'about';
    if (token.includes('xeber') || token.includes('xber') || token.includes('xbr')) return 'news';
    if (token.includes('tedbir') || token.includes('tdbir') || token.includes('tebdir')) return 'events';
    if (token.includes('surucu') || token.includes('srucu') || token.includes('src')) return 'drivers';
    if (token.includes('qalereya') || token.includes('galereya')) return 'gallery';
    if (token.includes('qayda')) return 'rules';
    if (token.includes('elaqe') || token.includes('laq') || token.includes('elaq')) return 'contact';
    return null;
  };

  const resolveViewFromUrl = (url: string): string | null => {
    const raw = (url || '').trim();
    if (!raw) return null;

    const direct = normalize(raw);
    if (viewIds.has(direct)) return direct;
    if (viewByPath[direct]) return viewByPath[direct];

    try {
      const parsed = new URL(raw, window.location.origin);
      const sameOrigin = parsed.origin === window.location.origin;
      if (!sameOrigin) return null;

      const pathToken = normalize(parsed.pathname.replace(/^\/+|\/+$/g, ''));
      const hashToken = normalize(parsed.hash.replace(/^#/, ''));
      const queryView = normalize(parsed.searchParams.get('view') || '');
      const queryTab = normalize(parsed.searchParams.get('tab') || '');

      const candidates = [pathToken, hashToken, queryView, queryTab];
      for (const candidate of candidates) {
        if (!candidate) continue;
        if (viewIds.has(candidate)) return candidate;
        if (viewByPath[candidate]) return viewByPath[candidate];
      }
    } catch {
      return null;
    }

    return null;
  };

  const resolveNavTarget = (rawUrl: string, fallbackText: string, fallbackLabel: string): NavTarget => {
    const inferred =
      inferViewFromText(fallbackText) ||
      inferViewFromText(fallbackLabel) ||
      resolveViewFromUrl(rawUrl);

    if (inferred) {
      return { type: 'view', view: inferred };
    }

    if (rawUrl.startsWith('http')) {
      return { type: 'external', url: rawUrl };
    }

    return { type: 'view', view: 'home' };
  };

  const navItems = (navbarPage?.sections || [])
    .filter((s) => {
      const label = (s.label || '').toUpperCase();
      const value = (s.value || '').toUpperCase();
      const url = (s.url || '').trim();
      if (!url) return false;
      if (label.includes('SITE_LOGO') || label.includes('ALT:')) return false;
      if (value.includes('SITE_LOGO') || value.includes('FORSAJ LOGO')) return false;
      return true;
    })
    .map((s) => {
      const fallbackName = (s.value || s.label || '').trim();
      const name = getText(s.id, fallbackName);
      const rawUrl = (s.url || '').trim();
      const target = resolveNavTarget(rawUrl, fallbackName, s.label || '');
      const activeView = target.type === 'view' ? target.view : null;

      return { name, target, activeView };
    });

  const resolvedNavItems = navItems.length > 0 ? navItems : defaultNavItems;

  const languages = ['AZ', 'RU', 'ENG'];
  const navLabelByLang: Record<'RU' | 'ENG', Record<string, string>> = {
    RU: {
      home: 'ДОМАШНЯЯ СТРАНИЦА',
      about: 'О НАС',
      news: 'НОВОСТИ',
      events: 'СОБЫТИЯ',
      drivers: 'ВОДИТЕЛИ',
      gallery: 'ГАЛЕРЕЯ',
      rules: 'ПРАВИЛА',
      contact: 'КОНТАКТЫ'
    },
    ENG: {
      home: 'HOME',
      about: 'ABOUT US',
      news: 'NEWS',
      events: 'EVENTS',
      drivers: 'DRIVERS',
      gallery: 'GALLERY',
      rules: 'RULES',
      contact: 'CONTACT'
    }
  };

  const getLocalizedNavLabel = (item: { activeView: string | null; name: string }) => {
    if (language === 'AZ') return item.name;
    const dictionary = navLabelByLang[language as 'RU' | 'ENG'];
    return (item.activeView && dictionary?.[item.activeView]) || item.name;
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 px-6 lg:px-20 py-4 flex items-center justify-between shadow-2xl">
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onViewChange('home')}
      >
        {logoImg ? (
          <img src={logoImg} alt="Forsaj Logo" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-[#FF4D00] w-10 h-10 rounded-sm flex items-center justify-center relative shadow-[0_0_20px_rgba(255,77,0,0.4)] group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-black fill-current transform -rotate-12">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter flex items-center">
              <span className="text-white">FORSAJ</span>
              <span className="text-[#FF4D00] ml-1">CLUB</span>
            </h1>
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 xl:gap-4">
        {resolvedNavItems.map((item, idx) => (
          <button
            key={`${item.name}-${idx}`}
            onClick={() => {
              if (item.target.type === 'external') {
                window.open(item.target.url, '_blank');
              } else {
                onViewChange((viewIds.has(item.target.view) ? item.target.view : 'home') as any);
              }
            }}
            className={`px-4 py-2 text-[10px] xl:text-[11px] font-black italic transition-all uppercase tracking-tight relative transform -skew-x-12 ${currentView === item.activeView
              ? 'bg-[#FF4D00] text-black shadow-[0_0_25px_rgba(255,77,0,0.25)] border-2 border-[#FF4D00]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border-2 border-transparent'
              }`}
          >
            <span className="transform skew-x-12 block whitespace-nowrap">{getLocalizedNavLabel(item)}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-2 group cursor-pointer bg-white/5 px-4 py-2 rounded-sm border border-white/10 hover:border-[#FF4D00]/50 transition-all"
        >
          <Globe className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D00]" />
          <span className="text-[11px] font-black italic text-white">{language}</span>
          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
        </button>

        {isLangOpen && (
          <div className="absolute right-0 mt-3 w-28 bg-[#111] border border-white/10 shadow-2xl z-50 py-2 rounded-sm overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setSiteLanguage(lang as any);
                  setIsLangOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-[10px] font-black italic hover:bg-[#FF4D00] hover:text-black transition-all ${language === lang ? 'text-[#FF4D00]' : 'text-gray-500'
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
