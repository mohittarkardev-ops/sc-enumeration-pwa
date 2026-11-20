import React from 'react';

/**
 * State Emblem of India (भारत का राज्य प्रतीक - Lion Capital of Ashoka)
 * Authentic high-resolution official emblem with transparent background.
 */
export function EmblemOfIndia({ className = "h-9 w-auto", alt = "भारत का राज्य प्रतीक (State Emblem of India)" }) {
  return (
    <img 
      src="/assets/emblem_of_india.png"
      alt={alt}
      className={`object-contain select-none pointer-events-none drop-shadow-xs ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * Census of India Official Logo (जनगणना से जन कल्याण)
 * Authentic circular emblem representing Census of India households.
 */
export function CensusLogo({ className = "h-9 w-9", alt = "भारत की जनगणना (Census of India)" }) {
  return (
    <img 
      src="/assets/census_of_india.jpg"
      alt={alt}
      className={`rounded-full object-cover select-none pointer-events-none border border-slate-200/80 shadow-xs ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * UIDAI Official Logo / Aadhaar Banner
 * Authentic UIDAI identity asset from official Aadhaar portal.
 */
export function AadhaarLogo({ className = "h-7 w-auto", alt = "भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)" }) {
  return (
    <img 
      src="/assets/uidai_logo.png"
      alt={alt}
      className={`object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
