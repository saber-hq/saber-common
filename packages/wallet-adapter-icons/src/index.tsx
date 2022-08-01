/**
 * [[include:wallet-adapter-icons/README.md]]
 * @module
 */

import React from "react";

export * from "./bravewallet.js";
export * from "./coin98.js";
export * from "./mathwallet.js";

export const LEDGER: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 35 35"
    fill="currentcolor"
    {...props}
  >
    <g id="prefix__Group_26536" transform="translate(-80 -205)">
      <path
        id="prefix__Shape"
        d="M23.588 0h-16v21.583h21.6v-16A5.585 5.585 0 0023.588 0z"
        transform="translate(85.739 205)"
      />
      <path
        id="prefix__Path_8749"
        d="M8.342 0H5.585A5.585 5.585 0 000 5.585v2.757h8.342z"
        data-name="Path 8749"
        transform="translate(80 205)"
      />
      <path
        id="prefix__Rectangle-path"
        d="M0 7.59h8.342v8.342H0z"
        transform="translate(80 210.739)"
      />
      <path
        id="prefix__Path_8750"
        d="M15.18 23.451h2.757a5.585 5.585 0 005.585-5.6V15.18H15.18z"
        data-name="Path 8750"
        transform="translate(91.478 216.478)"
      />
      <path
        id="prefix__Path_8751"
        d="M7.59 15.18h8.342v8.342H7.59z"
        data-name="Path 8751"
        transform="translate(85.739 216.478)"
      />
      <path
        id="prefix__Path_8752"
        d="M0 15.18v2.757a5.585 5.585 0 005.585 5.585h2.757V15.18z"
        data-name="Path 8752"
        transform="translate(80 216.478)"
      />
    </g>
  </svg>
);

export const EXODUS: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <mask
      id="mask0_1298_96"
      style={{ maskType: "alpha" }}
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="80"
      height="80"
    >
      <path
        d="M79.5209 22.3372L45.4532 0V12.4888L67.3079 26.6905L64.7368 34.826H45.4532V45.1739H64.7368L67.3079 53.3095L45.4532 67.5111V80L79.5209 57.7342L73.9501 40.0357L79.5209 22.3372Z"
        fill="#1D1D1B"
      />
      <path
        d="M15.8135 45.1739H35.0257V34.826H15.7421L13.2424 26.6905L35.0257 12.4888V0L0.958008 22.3372L6.52883 40.0357L0.958008 57.7342L35.0971 80V67.5111L13.2424 53.3095L15.8135 45.1739Z"
        fill="#1D1D1B"
      />
    </mask>
    <g mask="url(#mask0_1298_96)">
      <path
        d="M79.5209 22.3372L45.4532 0V12.4888L67.3079 26.6905L64.7368 34.826H45.4532V45.1739H64.7368L67.3079 53.3095L45.4532 67.5111V80L79.5209 57.7342L73.9501 40.0357L79.5209 22.3372Z"
        fill="white"
      />
      <path
        d="M15.8135 45.1739H35.0257V34.826H15.7421L13.2424 26.6905L35.0257 12.4888V0L0.958008 22.3372L6.52883 40.0357L0.958008 57.7342L35.0971 80V67.5111L13.2424 53.3095L15.8135 45.1739Z"
        fill="white"
      />
      <rect
        x="1.05957"
        width="86.9547"
        height="88.4768"
        fill="url(#paint0_linear_1298_96)"
      />
      <ellipse
        cx="5.82219"
        cy="17.5436"
        rx="76.4839"
        ry="82.9242"
        transform="rotate(-33.9303 5.82219 17.5436)"
        fill="url(#paint1_radial_1298_96)"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_1298_96"
        x1="68.6615"
        y1="85.8973"
        x2="45.7499"
        y2="-8.29151"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0B46F9" />
        <stop offset="1" stopColor="#BBFBE0" />
      </linearGradient>
      <radialGradient
        id="paint1_radial_1298_96"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(5.82218 17.5436) rotate(72.2556) scale(62.739 58.8096)"
      >
        <stop offset="0.119792" stopColor="#8952FF" stopOpacity="0.87" />
        <stop offset="1" stopColor="#DABDFF" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const GLOW: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="254"
    height="254"
    viewBox="0 0 254 254"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="126.55" cy="126.55" r="105.55" fill="white" />
    <circle
      cx="126.55"
      cy="126.55"
      r="116.05"
      stroke="white"
      strokeOpacity="0.5"
      strokeWidth="21"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M200.576 201.797C181.525 220.54 155.389 232.104 126.552 232.104C97.7787 232.104 71.6944 220.591 52.6544 201.92C95.8806 167.876 157.305 167.835 200.576 201.797ZM201.796 200.577C220.54 181.526 232.104 155.39 232.104 126.552C232.104 97.7866 220.597 71.7087 201.936 52.6701C167.876 96.0129 167.83 157.321 201.796 200.577ZM200.735 51.4649C157.403 85.5945 95.7823 85.5531 52.4946 51.3408C71.5483 32.5776 97.6981 21 126.552 21C155.47 21 181.671 32.6287 200.735 51.4649ZM51.3408 52.4946C32.5776 71.5483 21 97.6981 21 126.552C21 155.47 32.6287 181.671 51.4649 200.735C85.5945 157.403 85.5531 95.7823 51.3408 52.4946Z"
      fill="black"
    />
  </svg>
);

export const PHANTOM: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="128"
    height="128"
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="64" cy="64" r="64" fill="url(#phantom_paint0_linear)" />
    <path
      d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.6612 23 14.8716 41.3057 14.4118 64.0583C13.936 87.577 36.241 108 60.0186 108H63.0094C83.9723 108 112.069 91.7667 116.459 71.9874C117.27 68.3413 114.358 64.9142 110.584 64.9142ZM39.7689 65.9454C39.7689 69.0411 37.2095 71.5729 34.0802 71.5729C30.9509 71.5729 28.3916 69.0399 28.3916 65.9454V56.8414C28.3916 53.7457 30.9509 51.2139 34.0802 51.2139C37.2095 51.2139 39.7689 53.7457 39.7689 56.8414V65.9454ZM59.5224 65.9454C59.5224 69.0411 56.9631 71.5729 53.8338 71.5729C50.7045 71.5729 48.1451 69.0399 48.1451 65.9454V56.8414C48.1451 53.7457 50.7056 51.2139 53.8338 51.2139C56.9631 51.2139 59.5224 53.7457 59.5224 56.8414V65.9454Z"
      fill="url(#phantom_paint1_linear)"
    />
    <defs>
      <linearGradient
        id="phantom_paint0_linear"
        x1="64"
        y1="0"
        x2="64"
        y2="128"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#534BB1" />
        <stop offset="1" stopColor="#551BF9" />
      </linearGradient>
      <linearGradient
        id="phantom_paint1_linear"
        x1="65.4998"
        y1="23"
        x2="65.4998"
        y2="108"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0.82" />
      </linearGradient>
    </defs>
  </svg>
);

export const SLOPE: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    fill="none"
    height="128"
    viewBox="0 0 128 128"
    width="128"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="64" cy="64" fill="#6e66fa" r="64" />
    <g fill="#fff">
      <path d="m35.1963 54.3998h19.2v19.2h-19.2z" />
      <path d="m73.597 54.3998-19.2 19.2v-19.2l19.2-19.2z" opacity=".4" />
      <path d="m73.597 73.5998-19.2 19.2v-19.2l19.2-19.2z" opacity=".75" />
      <path d="m73.604 54.3998h19.2v19.2h-19.2z" />
      <path d="m54.3968 35.2 19.2-19.2v19.2l-19.2 19.2h-19.2z" opacity=".75" />
      <path d="m73.5915 92.8-19.2 19.2v-19.2l19.2-19.2h19.2z" opacity=".4" />
    </g>
  </svg>
);

export const SOLLET: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="530"
    height="530"
    viewBox="0 0 530 530"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g>
      <path
        fill="#00FFA3"
        d="m88.88935,372.98201c3.193,-3.19 7.522,-4.982 12.035,-4.982l416.461,0c7.586,0 11.384,9.174 6.017,14.536l-82.291,82.226c-3.193,3.191 -7.522,4.983 -12.036,4.983l-416.4601,0c-7.5866,0 -11.3845,-9.174 -6.0178,-14.537l82.2919,-82.226z"
      />
      <path
        fill="#00FFA3"
        d="m88.88935,65.9825c3.193,-3.1904 7.522,-4.9825 12.035,-4.9825l416.461,0c7.586,0 11.384,9.1739 6.017,14.5363l-82.291,82.2267c-3.193,3.19 -7.522,4.982 -12.036,4.982l-416.4601,0c-7.5866,0 -11.3845,-9.174 -6.0178,-14.536l82.2919,-82.2265z"
      />
      <path
        fill="#00FFA3"
        d="m441.11135,219.1095c-3.193,-3.19 -7.522,-4.982 -12.036,-4.982l-416.4601,0c-7.5866,0 -11.3845,9.173 -6.0178,14.536l82.2919,82.226c3.193,3.19 7.522,4.983 12.035,4.983l416.461,0c7.586,0 11.384,-9.174 6.017,-14.537l-82.291,-82.226z"
      />
    </g>
  </svg>
);

export const CLOVER: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M30 7.49999C30 11.6421 26.6421 15 22.5 15C18.3702 15 15.02 11.6621 15.0001 7.537C14.9803 11.6499 11.6499 14.9803 7.53705 15.0001C11.6621 15.02 15 18.3702 15 22.5C15 26.6421 11.6421 30 7.49999 30C3.35786 30 0 26.6421 0 22.5C0 18.3701 3.33795 15.0199 7.46312 15.0001C3.33804 14.9801 0.000182196 11.6299 0.000182196 7.50017C0.000182196 3.35804 3.35804 0.000182196 7.50017 0.000182196C11.6299 0.000182196 14.9801 3.33804 15.0001 7.46312C15.0199 3.33795 18.3701 0 22.5 0C26.6421 0 30 3.35786 30 7.49999ZM22.5 15C18.3578 15 15 18.3578 15 22.5C15 26.6421 18.3578 30 22.5 30C26.6421 30 30 26.6421 30 22.5C30 18.3578 26.6421 15 22.5 15Z"
      fill="#27A577"
    />
  </svg>
);

export const FILE: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    aria-hidden="true"
    focusable="false"
    data-prefix="fas"
    data-icon="file"
    className="svg-inline--fa fa-file fa-w-12"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 384 512"
    {...props}
  >
    <path
      fill="currentColor"
      d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"
    ></path>
  </svg>
);

export const SOLFLARE: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M24.8919 24.9666L29.9929 31.0468L23.6926 26.2361C22.228 25.1225 20.1169 26.069 19.9621 27.912L18.9563 40L17.3425 28.1849C17.0883 26.3085 14.85 25.4955 13.4628 26.7706L0 39.1648L11.8104 25.3842C13.0539 23.9365 12.142 21.6759 10.2463 21.5145L0.0773726 20.5234L10.5116 18.8753C12.3299 18.6247 13.1589 16.4477 11.9762 15.0334L6.8751 8.95323L13.1699 13.7639C14.6345 14.8775 16.7456 13.931 16.9004 12.088L17.9117 0L19.52 11.8151C19.7797 13.6915 22.018 14.5045 23.3997 13.2294L36.868 0.835189L25.0521 14.6158C23.8086 16.0635 24.7261 18.3241 26.6217 18.4855L36.7907 19.4766L26.3509 21.1247C24.5326 21.3753 23.7092 23.5523 24.8919 24.9666Z"
      fill="url(#solflare_paint0_linear)"
    ></path>
    <defs>
      <linearGradient
        id="solflare_paint0_linear"
        x1="11.8347"
        y1="14.2185"
        x2="21.4291"
        y2="22.4997"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FFC10B"></stop>
        <stop offset="1" stopColor="#FB3F2E"></stop>
      </linearGradient>
    </defs>
  </svg>
);

// https://upload.wikimedia.org/wikipedia/commons/5/55/Magnifying_glass_icon.svg
export const MAGNIFYING_GLASS: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="490" height="490" {...props}>
    <path
      fill="none"
      stroke="#000"
      strokeWidth="36"
      strokeLinecap="round"
      d="m280,278a153,153 0 1,0-2,2l170,170m-91-117 110,110-26,26-110-110"
    />
  </svg>
);

export const HUOBI: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="224"
    height="224"
    viewBox="0 0 224 224"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 0L224 0V224H0L0 0Z"
      fill="#2157E2"
    />
    <path
      d="M131.059 81.1771C131.059 57.7531 119.458 37.6315 110.625 31.0728C110.625 31.0728 109.953 30.7042 110 31.6258V31.6258C109.265 76.8303 85.7672 89.0875 72.838 105.584C43.0241 143.677 70.7587 185.456 98.9935 193.136C114.799 197.452 95.3508 185.456 92.8494 160.235C89.8007 129.745 131.059 106.444 131.059 81.1771Z"
      fill="url(#paint0_linear_1101_125)"
    />
    <path
      d="M143.597 96.3174C143.409 96.1943 143.158 96.102 142.986 96.3943C142.484 102.102 136.56 114.286 129.037 125.486C103.552 163.455 118.065 181.762 126.247 191.639C130.949 197.347 126.247 191.639 138.096 185.808C152.735 177.092 162.234 162.02 163.643 145.27C165.233 126.758 157.798 108.6 143.597 96.3174Z"
      fill="url(#paint1_linear_1101_125)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_1101_125"
        x1="122.401"
        y1="209.295"
        x2="178.662"
        y2="110.447"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#F7F6FF" />
        <stop offset="1" stopColor="white" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_1101_125"
        x1="157.861"
        y1="203.177"
        x2="189.014"
        y2="140.022"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#F7F6FF" />
        <stop offset="1" stopColor="white" />
      </linearGradient>
    </defs>
  </svg>
);
