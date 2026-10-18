import type { SVGProps } from 'react';

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Hook of the hanger */}
      <path 
        d="M50 35 C50 25, 60 25, 60 15 C60 5, 50 5, 50 15" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      {/* Base wire of the hanger forming a tent shape */}
      <path 
        d="M50 35 L10 85 L90 85 Z" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinejoin="round"
      />
      {/* Left side tent flap (darker shade typically, but using fill for style) */}
      <path 
        d="M50 35 L10 85 L50 85 Z" 
        fill="currentColor" 
        opacity="0.9"
      />
      {/* Right side tent flap (lighter shade typically) */}
      <path 
        d="M50 35 L90 85 L50 85 Z" 
        fill="currentColor" 
        opacity="0.7"
      />
      {/* Inner split / tent opening */}
      <path 
        d="M50 85 L50 60 L40 85 Z" 
        fill="white"
      />
    </svg>
  );
}
