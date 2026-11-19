import React from 'react';

/**
 * State Emblem of India (भारत का राज्य प्रतीक - Lion Capital of Ashoka)
 * Highly optimized, crisp vector graphics that works 100% offline
 */
export function EmblemOfIndia({ className = "w-8 h-8", color = "currentColor" }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      className={className} 
      fill={color} 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="State Emblem of India"
    >
      {/* Three Lions Silhouette Profile */}
      {/* Central Lion Head & Mane */}
      <path d="M50 12 C44 12, 40 16, 40 22 C40 25, 42 27, 43 30 C38 32, 36 36, 36 42 C36 47, 39 50, 42 53 C40 56, 40 60, 43 64 C45 66, 48 68, 50 68 C52 68, 55 66, 57 64 C60 60, 60 56, 58 53 C61 50, 64 47, 64 42 C64 36, 62 32, 57 30 C58 27, 60 25, 60 22 C60 16, 56 12, 50 12 Z" opacity="0.95" />
      {/* Left Lion Head & Roar */}
      <path d="M38 24 C33 22, 28 25, 27 30 C26 34, 28 37, 26 40 C22 42, 20 46, 21 51 C22 56, 25 58, 28 60 C29 63, 31 65, 34 66 C37 67, 40 65, 42 62 C39 58, 38 52, 38 46 Z" opacity="0.85" />
      {/* Right Lion Head & Roar */}
      <path d="M62 24 C67 22, 72 25, 73 30 C74 34, 72 37, 74 40 C78 42, 80 46, 79 51 C78 56, 75 58, 72 60 C71 63, 69 65, 66 66 C63 67, 60 65, 58 62 C61 58, 62 52, 62 46 Z" opacity="0.85" />

      {/* Abacus Base Platform */}
      <rect x="18" y="72" width="64" height="6" rx="1.5" />

      {/* Ashoka Chakra (Central 24 Spokes Wheel) */}
      <circle cx="50" cy="85" r="9" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="50" cy="85" r="2" />
      {/* Wheel Spokes */}
      <path d="M50 76 L50 94 M41 85 L59 85 M43.6 78.6 L56.4 91.4 M43.6 91.4 L56.4 78.6" stroke={color} strokeWidth="1" />
      <path d="M46.2 76.5 L53.8 93.5 M46.2 93.5 L53.8 76.5 M41.5 81.2 L58.5 88.8 M41.5 88.8 L58.5 81.2" stroke={color} strokeWidth="0.8" />

      {/* Bull on Right and Horse on Left silhouettes */}
      <path d="M26 82 C23 82, 21 84, 21 86 C21 88, 24 88, 27 88 L32 88 C32 86, 30 82, 26 82 Z" />
      <path d="M74 82 C77 82, 79 84, 79 86 C79 88, 76 88, 73 88 L68 88 C68 86, 70 82, 74 82 Z" />

      {/* Lower Platform */}
      <rect x="12" y="96" width="76" height="4" rx="1" />

      {/* Motto: "सत्यमेव जयते" (Satyameva Jayate) */}
      <text 
        x="50" 
        y="112" 
        textAnchor="middle" 
        fontSize="8.5" 
        fontWeight="bold" 
        fontFamily="'Hind', serif"
        letterSpacing="0.5"
      >
        सत्यमेव जयते
      </text>
    </svg>
  );
}

/**
 * Census of India Official Logo (जनगणना से जन कल्याण)
 * Authentic circular human motif emblem representing Indian households
 */
export function CensusLogo({ className = "w-9 h-9" }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Census of India Official Logo"
    >
      {/* Outer Border Ring */}
      <circle cx="60" cy="60" r="58" fill="#FFFFFF" stroke="#0B3B60" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="1" />

      {/* Human Silhouette Ring (Family figures in Tricolor & Indian tones) */}
      {/* Figure 1 - Saffron (Top) */}
      <circle cx="60" cy="24" r="5" fill="#FF9933" />
      <path d="M53 35 C53 31, 56 29, 60 29 C64 29, 67 31, 67 35 L65 44 L55 44 Z" fill="#FF9933" />

      {/* Figure 2 - Blue (Right) */}
      <circle cx="92" cy="56" r="4.5" fill="#0B3B60" />
      <path d="M84 65 C84 61, 87 59, 92 59 C97 59, 100 61, 100 65 L98 73 L86 73 Z" fill="#0B3B60" />

      {/* Figure 3 - Green (Bottom) */}
      <circle cx="60" cy="92" r="4.5" fill="#138808" />
      <path d="M53 82 C53 86, 56 88, 60 88 C64 88, 67 86, 67 82 L65 74 L55 74 Z" fill="#138808" />

      {/* Figure 4 - Navy (Left) */}
      <circle cx="28" cy="56" r="4.5" fill="#1E3A8A" />
      <path d="M20 65 C20 61, 23 59, 28 59 C33 59, 36 61, 36 65 L34 73 L22 73 Z" fill="#1E3A8A" />

      {/* Inner Central Chakra Motif */}
      <circle cx="60" cy="58" r="14" fill="none" stroke="#0B3B60" strokeWidth="2" />
      <circle cx="60" cy="58" r="3" fill="#FF9933" />
      {/* Chakra Rays */}
      <path d="M60 44 L60 72 M46 58 L74 58 M50 48 L70 68 M50 68 L70 48" stroke="#0B3B60" strokeWidth="1.2" />

      {/* Official Circular Text */}
      <path id="curveTop" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" />
      <path id="curveBottom" d="M 102,60 A 42,42 0 0,1 18,60" fill="none" />

      <text fontSize="7.2" fontWeight="bold" fill="#0B3B60" fontFamily="'Hind', sans-serif">
        <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
          भारत की जनगणना • CENSUS OF INDIA
        </textPath>
      </text>
      <text fontSize="6.8" fontWeight="bold" fill="#138808" fontFamily="'Hind', sans-serif">
        <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
          जनगणना से जन कल्याण
        </textPath>
      </text>
    </svg>
  );
}
