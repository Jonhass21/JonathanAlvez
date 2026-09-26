import React from 'react';
import {STROKE} from '../theme';

/** 12 figuras humanas minimalistas (cabeza + hombros en línea fina), 6 × 2. */
export const FIGURES = Array.from({length: 12}, (_, i) => ({
  x: 540 + ((i % 6) - 2.5) * 118,
  y: i < 6 ? 880 : 1100,
}));
/** La figura que está lista este mes */
export const READY = 8;
/** Orden en el que se iluminan las otras 11 (como si pasaran los meses) */
export const ORDER = [2, 10, 5, 0, 7, 11, 3, 9, 1, 6, 4];

export const Figure: React.FC<{x: number; y: number; stroke: string; draw?: number; width?: number}> = ({
  x,
  y,
  stroke,
  draw = 1,
  width = STROKE.hair,
}) => (
  <g fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round">
    <circle cx={x} cy={y - 42} r={17} pathLength={1} strokeDasharray={`${draw} 1`} transform={`rotate(90 ${x} ${y - 42})`} />
    <path d={`M ${x - 36} ${y + 44} C ${x - 36} ${y - 4}, ${x + 36} ${y - 4}, ${x + 36} ${y + 44}`} pathLength={1} strokeDasharray={`${draw} 1`} />
  </g>
);
