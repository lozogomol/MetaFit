import React from 'react';
import Svg, { Path, G, Rect } from 'react-native-svg';

export const IconoZapatoVeloz = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ rotate: '-15deg' }] }}>
    <G>
      {/* Speed lines */}
      <Path d="M2 11h4" />
      <Path d="M4 15h3" />
      <Path d="M3 7h2" />
      {/* Shoe Profile */}
      <Path d="M21.2 13.5c-.3-1-1.5-1.5-2.5-1.8L15 10.5V9a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v2.5L5.7 13.8a2.5 2.5 0 0 0-1.7 2.4V19h15.5a2.5 2.5 0 0 0 2.5-2.5v-1c0-.8-.3-1.6-.8-2z" fill={color} fillOpacity={0.15} />
      {/* Shoelaces */}
      <Path d="M11 9.5l3 2" />
      <Path d="M9.5 11.5l3 2" />
      {/* Sole */}
      <Path d="M4 19h16" strokeWidth={2.5} />
    </G>
  </Svg>
);

export const IconoMetaMaraton = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <G>
      {/* Finish Line Columns */}
      <Path d="M5 22V4" strokeWidth={2} />
      <Path d="M19 22V4" strokeWidth={2} />
      {/* Banner / Ribbon */}
      <Path d="M5 6h14v5H5z" fill={color} fillOpacity={0.15} />
      {/* Checkered pattern inside banner */}
      <Path d="M9.66 6v5" />
      <Path d="M14.33 6v5" />
      <Path d="M5 8.5h14" />
      {/* Flags on top */}
      <Path d="M5 4L8 2L5 2z" fill={color} />
      <Path d="M19 4L16 2L19 2z" fill={color} />
    </G>
  </Svg>
);
