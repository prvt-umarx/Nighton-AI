import React from 'react';

interface NightonLogoProps {
  variant?: 'full' | 'icon';
  color?: string;
  className?: string;
}

export const NightonLogo: React.FC<NightonLogoProps> = ({
  variant = 'full',
  color = '#00205B',
  className = 'h-8 w-auto',
}) => {
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="60 320 290 330"
        fill="none"
        className={className}
        aria-label="Nighton Moon Icon"
      >
        <path
          d="M 222 346 A 146 146 0 1 0 326 597 A 133 133 0 0 1 222 346 Z"
          fill={color}
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="80 310 905 350"
      fill="none"
      className={className}
      aria-label="NIGHTON Logo"
    >
      {/* Crescent Moon */}
      <path
        d="M 222 346 A 146 146 0 1 0 326 597 A 133 133 0 0 1 222 346 Z"
        fill={color}
      />
      {/* N */}
      <path
        d="M 299 548 V 434 H 321 L 362 507 V 434 H 385 V 548 H 363 L 322 475 V 548 H 299 Z"
        fill={color}
      />
      {/* I */}
      <path
        d="M 409 548 V 434 H 433 V 548 H 409 Z"
        fill={color}
      />
      {/* G */}
      <path
        d="M 510 487 H 555 V 533 C 542 544 524 551 504 551 C 469 551 445 526 445 491 C 445 456 470 431 505 431 C 526 431 543 439 553 452 L 536 467 C 528 458 518 453 505 453 C 483 453 469 469 469 491 C 469 513 483 529 505 529 C 516 529 525 526 532 521 V 507 H 510 V 487 Z"
        fill={color}
      />
      {/* H */}
      <path
        d="M 576 548 V 434 H 600 V 479 H 639 V 434 H 663 V 548 H 639 V 501 H 600 V 548 H 576 Z"
        fill={color}
      />
      {/* T */}
      <path
        d="M 702 548 V 456 H 675 V 434 H 753 V 456 H 726 V 548 H 702 Z"
        fill={color}
      />
      {/* O */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 808 551 C 773 551 748 525 748 491 C 748 457 773 431 808 431 C 843 431 868 457 868 491 C 868 525 843 551 808 551 Z M 808 529 C 829 529 844 513 844 491 C 844 469 829 453 808 453 C 787 453 772 469 772 491 C 772 513 787 529 808 529 Z"
        fill={color}
      />
      {/* N */}
      <path
        d="M 885 548 V 434 H 907 L 948 507 V 434 H 971 V 548 H 949 L 908 475 V 548 H 885 Z"
        fill={color}
      />
    </svg>
  );
};
