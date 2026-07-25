import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Original line-art botanical motifs, drawn in the spirit of antique
 * herbarium survey plates rather than literal medical iconography. This is
 * the design's signature element — used sparingly as texture (hero
 * backdrop, section dividers, empty states) rather than as decoration.
 * All paths are hand-authored for this project.
 */

const LEAF_PATH =
  "M0,0 C8,-13 32,-15 46,0 C32,15 8,13 0,0 Z M4,0 L42,0 M14,-1 L20,-7 M14,1 L20,7 M28,-1 L34,-6 M28,1 L34,6";

interface LeafPlacement {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
}

function Leaf({ x, y, rotate, scale = 1 }: LeafPlacement) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d={LEAF_PATH} />
    </g>
  );
}

/** Tall single sprig — used as the hero's signature illustration. */
export function BotanicalSprig({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  const leaves: LeafPlacement[] = [
    { x: 90, y: 322, rotate: 208 },
    { x: 101, y: 256, rotate: -22 },
    { x: 84, y: 190, rotate: 202 },
    { x: 99, y: 128, rotate: -28 },
    { x: 87, y: 74, rotate: 196 },
  ];

  return (
    <svg
      viewBox="0 0 200 400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-sage", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M96 380 C 90 320 108 260 92 200 C 78 145 104 100 90 40" />
      {leaves.map((leaf, i) => (
        <Leaf key={i} {...leaf} />
      ))}
      <circle cx="90" cy="26" r="5.5" />
      <path d="M90 20 C 84 10 88 2 90 -2" />
      <path d="M90 20 C 96 10 92 2 90 -2" />
    </svg>
  );
}

/** Compact two-leaf sprig — used beside step markers and small accents. */
export function BotanicalSprigMini({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 90 90"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-sage", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M45 84 C 40 62 50 40 45 20 C 42 12 45 8 46 4" />
      <Leaf x={44} y={56} rotate={205} scale={0.62} />
      <Leaf x={49} y={28} rotate={-25} scale={0.6} />
    </svg>
  );
}

/**
 * Soft asymmetric blob used as a backdrop frame behind photo placeholders —
 * a gentler alternative to a hard rectangle or circle crop.
 */
export function OrganicBlob({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 320 320"
      className={cn("text-sage-light", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        fill="currentColor"
        d="M295.1,99.9 Q310,160 294.4,219.4 Q278.8,278.8 219.4,290.4 Q160,302 99.2,291.8 Q38.4,281.6 24.2,220.8 Q10,160 26.65,101.65 Q43.3,43.3 101.65,31.65 Q160,20 220.1,29.9 Q280.2,39.8 295.1,99.9 Z"
      />
    </svg>
  );
}

/** Slim horizontal flourish used to close out a section instead of a hard rule. */
export function BotanicalDivider({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      className={cn("text-sand-dark", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M0 12 H100" />
      <path d="M140 12 H240" />
      <circle cx="120" cy="12" r="4" />
    </svg>
  );
}
