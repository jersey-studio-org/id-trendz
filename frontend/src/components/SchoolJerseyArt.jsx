function getDisplayName(name) {
  const words = (name || 'School').split(/\s+/).filter(Boolean);
  const headline = words.slice(0, 2).join(' ').toUpperCase();
  const sublineWords = words.slice(2);

  return {
    headline,
    subline: sublineWords.length > 0 ? sublineWords.join(' ').toUpperCase() : 'T-SHIRT',
  };
}

function getLuminance(hex) {
  const value = (hex || '').replace('#', '');
  if (value.length !== 6) {
    return 0.5;
  }

  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export default function SchoolJerseyArt({ school, className = '', compact = false }) {
  const palette = school?.palette?.length ? school.palette : [{ name: 'Gray', hex: '#6b7280' }];
  const primary = palette[0]?.hex || '#6b7280';
  const secondary = palette[1]?.hex || '#f8fafc';
  const textColor = getLuminance(primary) > 0.34 ? '#ffffff' : secondary;
  const { headline, subline } = getDisplayName(school?.name);
  const artId = school?.id || 'school';

  return (
    <div className={`school-jersey-art ${compact ? 'compact' : ''} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 480 420" role="presentation">
        <defs>
          <linearGradient id={`body-${artId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="52%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.82" />
          </linearGradient>
          <radialGradient id={`spot-${artId}`} cx="50%" cy="18%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <pattern id={`mesh-${artId}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="#ffffff" opacity="0.06" />
            <circle cx="7" cy="7" r="1.1" fill="#ffffff" opacity="0.05" />
          </pattern>
          <filter id={`shadow-${artId}`} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="22" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.16" />
          </filter>
          <path id={`title-arc-${artId}`} d="M132 190 Q240 136 348 190" />
        </defs>

        <rect x="0" y="0" width="480" height="420" rx="36" fill="#f8fafc" />
        <ellipse cx="240" cy="372" rx="118" ry="24" fill="#0f172a" opacity="0.1" />
        <g filter={`url(#shadow-${artId})`}>
          <path
            d="M152 74l28-18h120l28 18 48 30-22 94-33-14v164c0 13-10 24-24 24H183c-14 0-24-11-24-24V184l-33 14-22-94 48-30z"
            fill={`url(#body-${artId})`}
          />
          <path
            d="M152 74l28-18h120l28 18 48 30-22 94-33-14v164c0 13-10 24-24 24H183c-14 0-24-11-24-24V184l-33 14-22-94 48-30z"
            fill={`url(#mesh-${artId})`}
          />
          <path d="M186 72c10 18 28 30 54 30s44-12 54-30" fill="none" stroke={secondary} strokeWidth="14" strokeLinecap="round" />
          <path d="M195 76c10 13 24 19 45 19s35-6 45-19" fill="none" stroke={primary} strokeWidth="8" strokeLinecap="round" />
          <path d="M132 138h58" stroke={secondary} strokeWidth="14" strokeLinecap="round" />
          <path d="M290 138h58" stroke={secondary} strokeWidth="14" strokeLinecap="round" />
          <path d="M130 160h54" stroke={secondary} strokeWidth="8" strokeLinecap="round" opacity="0.9" />
          <path d="M296 160h54" stroke={secondary} strokeWidth="8" strokeLinecap="round" opacity="0.9" />
          <path d="M170 114h140" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="3" />
          <path d="M159 184v164c0 13 10 24 24 24h114c14 0 24-11 24-24V184" fill="url(#spot-${artId})" />
          <text className="school-jersey-arc-text" fill={textColor}>
            <textPath href={`#title-arc-${artId}`} startOffset="50%" textAnchor="middle">
              {headline}
            </textPath>
          </text>
          <text x="240" y="236" textAnchor="middle" className="school-jersey-subline" fill={textColor}>
            {subline}
          </text>
        </g>
      </svg>
    </div>
  );
}
