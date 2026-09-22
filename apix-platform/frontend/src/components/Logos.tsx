import React from 'react';
import indigoSvg from '../assets/logos/indigo.svg';
import airIndiaSvg from '../assets/logos/airindia.svg';
import akasaSvg from '../assets/logos/akasa.svg';
import spiceJetSvg from '../assets/logos/spicejet.svg';
import makeMyTripSvg from '../assets/logos/makemytrip.svg';
import easeMyTripSvg from '../assets/logos/easemytrip.svg';

export interface LogoProps {
  className?: string;
  size?: number;
}

// 1. Primary AeroIndex Official Logo (Inline SVG)
export const AeroIndexLogo: React.FC<LogoProps> = ({ className = "w-6 h-6", size }) => (
  <span
    style={size ? { width: size, height: size } : undefined}
    className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
  >
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Background */}
      <rect width="40" height="40" rx="10" fill="#09090B" />
      {/* Ascending chart line */}
      <path
        d="M8 28 L14 20 L19 23 L26 14 L32 9"
        stroke="#34D399"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrowhead at top of chart */}
      <path
        d="M30 7 L33 9.5 L29.5 11"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stylized airplane silhouette */}
      <path
        d="M10 32 L14 30 L18 32 L14 33.5 Z"
        fill="#34D399"
        opacity="0.5"
      />
      {/* Dots on chart */}
      <circle cx="14" cy="20" r="1.5" fill="#34D399" />
      <circle cx="19" cy="23" r="1.5" fill="#34D399" />
      <circle cx="26" cy="14" r="1.5" fill="#34D399" />
    </svg>
  </span>
);

// 2. IndiGo Official Logo
export const IndiGoLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const h = size || 24;
  const w = Math.round(h * 1.45);
  return (
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`inline-flex items-center justify-center bg-white border border-zinc-200/90 rounded-lg p-1 shadow-2xs shrink-0 overflow-hidden hover:border-zinc-400 transition-colors ${className}`}
      title="IndiGo Airlines"
    >
      <img
        src={indigoSvg}
        alt="IndiGo"
        className="max-h-full max-w-full object-contain select-none"
        loading="lazy"
      />
    </span>
  );
};

// 3. Air India Official Logo (Tata New Brand)
export const AirIndiaLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const h = size || 24;
  const w = Math.round(h * 1.45);
  return (
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`inline-flex items-center justify-center bg-white border border-zinc-200/90 rounded-lg p-1 shadow-2xs shrink-0 overflow-hidden hover:border-zinc-400 transition-colors ${className}`}
      title="Air India"
    >
      <img
        src={airIndiaSvg}
        alt="Air India"
        className="max-h-full max-w-full object-contain select-none"
        loading="lazy"
      />
    </span>
  );
};

// 4. Akasa Air Official Logo
export const AkasaAirLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const h = size || 24;
  const w = Math.round(h * 1.45);
  return (
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`inline-flex items-center justify-center bg-white border border-zinc-200/90 rounded-lg p-1 shadow-2xs shrink-0 overflow-hidden hover:border-zinc-400 transition-colors ${className}`}
      title="Akasa Air"
    >
      <img
        src={akasaSvg}
        alt="Akasa Air"
        className="max-h-full max-w-full object-contain select-none"
        loading="lazy"
      />
    </span>
  );
};

// 5. SpiceJet Official Logo
export const SpiceJetLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const h = size || 24;
  const w = Math.round(h * 1.45);
  return (
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`inline-flex items-center justify-center bg-white border border-zinc-200/90 rounded-lg p-1 shadow-2xs shrink-0 overflow-hidden hover:border-zinc-400 transition-colors ${className}`}
      title="SpiceJet"
    >
      <img
        src={spiceJetSvg}
        alt="SpiceJet"
        className="max-h-full max-w-full object-contain select-none"
        loading="lazy"
      />
    </span>
  );
};

// 6. MakeMyTrip Official Logo
export const MakeMyTripLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const h = size || 24;
  const w = Math.round(h * 1.45);
  return (
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`inline-flex items-center justify-center bg-white border border-zinc-200/90 rounded-lg p-1 shadow-2xs shrink-0 overflow-hidden hover:border-zinc-400 transition-colors ${className}`}
      title="MakeMyTrip"
    >
      <img
        src={makeMyTripSvg}
        alt="MakeMyTrip"
        className="max-h-full max-w-full object-contain select-none"
        loading="lazy"
      />
    </span>
  );
};

// 7. EaseMyTrip Official Logo
export const EaseMyTripLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const h = size || 24;
  const w = Math.round(h * 1.45);
  return (
    <span
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`inline-flex items-center justify-center bg-white border border-zinc-200/90 rounded-lg p-1 shadow-2xs shrink-0 overflow-hidden hover:border-zinc-400 transition-colors ${className}`}
      title="EaseMyTrip"
    >
      <img
        src={easeMyTripSvg}
        alt="EaseMyTrip"
        className="max-h-full max-w-full object-contain select-none"
        loading="lazy"
      />
    </span>
  );
};

// Matching logo for carrier / source name
export const SourceLogo: React.FC<{ name: string; className?: string; size?: number }> = ({
  name,
  className = "",
  size = 24,
}) => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('indigo')) return <IndiGoLogo className={className} size={size} />;
  if (norm.includes('air india')) return <AirIndiaLogo className={className} size={size} />;
  if (norm.includes('akasa')) return <AkasaAirLogo className={className} size={size} />;
  if (norm.includes('spicejet')) return <SpiceJetLogo className={className} size={size} />;
  if (norm.includes('makemytrip')) return <MakeMyTripLogo className={className} size={size} />;
  if (norm.includes('easemytrip')) return <EaseMyTripLogo className={className} size={size} />;
  return <AeroIndexLogo className={className} size={size} />;
};

