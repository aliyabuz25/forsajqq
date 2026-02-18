import React from 'react';
import { Activity } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';

const Marquee: React.FC = () => {
  const { getPage, getImage } = useSiteContent('marquee');
  const marqueePage = getPage('marquee');
  const marqueeImage = getImage('marquee-image', '');

  if (!marqueePage || marqueePage.active === false) return null;

  const text =
    marqueePage.sections?.find((section: any) => section.id === 'MARQUEE_TEXT')?.value ||
    marqueePage.sections?.[0]?.value ||
    'FORSAJ CLUB';
  const marqueeLink =
    marqueePage.sections?.find((section: any) => section.id === 'MARQUEE_LINK')?.value?.trim() || '';
  const rawLinkActive =
    marqueePage.sections?.find((section: any) => section.id === 'MARQUEE_LINK_ACTIVE')?.value || '';
  const isLinkActive = ['1', 'true', 'yes', 'on'].includes(String(rawLinkActive).trim().toLowerCase());
  const canUseLink = isLinkActive && marqueeLink.length > 0;

  const MarqueeItem = () => (
    <div className="inline-flex items-center gap-8 mx-8">
      <span className="w-1.5 h-1.5 bg-black/40 rounded-full"></span>
      <Activity size={16} className="text-black/60" />
      <span className="text-black font-black italic text-sm tracking-widest uppercase whitespace-nowrap">
        {text}
      </span>
    </div>
  );

  const marqueeStream = (
    <>
      <div className="inline-block animate-marquee">
        {new Array(10).fill(null).map((_, i) => (
          <MarqueeItem key={i} />
        ))}
      </div>
      <div className="inline-block animate-marquee" aria-hidden="true">
        {new Array(10).fill(null).map((_, i) => (
          <MarqueeItem key={i} />
        ))}
      </div>
    </>
  );

  return (
    <div className="bg-[#FF4D00] py-3 overflow-hidden whitespace-nowrap relative border-b border-[#CC3D00] flex items-center">
      {marqueeImage.path && (
        <img
          src={marqueeImage.path}
          alt={marqueeImage.alt || 'Marquee'}
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
      )}
      {canUseLink ? (
        <a
          href={marqueeLink}
          target={/^https?:\/\//i.test(marqueeLink) ? '_blank' : undefined}
          rel={/^https?:\/\//i.test(marqueeLink) ? 'noopener noreferrer' : undefined}
          className="cursor-pointer"
        >
          {marqueeStream}
        </a>
      ) : marqueeStream}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Marquee;
