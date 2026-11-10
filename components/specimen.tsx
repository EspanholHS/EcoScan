"use client";

export function Specimen({ kind }: { kind: "bottle" | "can" | "paper" }) {
  return (
    <svg
      className={`specimen specimen-${kind}`}
      viewBox="0 0 440 420"
      fill="none"
      role="img"
      aria-label={
        kind === "bottle"
          ? "Estudo ilustrado de uma garrafa plástica translúcida"
          : kind === "can"
            ? "Estudo ilustrado de uma lata de alumínio"
            : "Estudo ilustrado de uma embalagem de papelão"
      }
    >
      <defs>
        <linearGradient
          id="bottle-body"
          x1="140"
          y1="200"
          x2="285"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6b9881" stopOpacity=".25" />
          <stop offset=".2" stopColor="#cae3c8" stopOpacity=".65" />
          <stop offset=".4" stopColor="#658f70" stopOpacity=".2" />
          <stop offset=".62" stopColor="#b8d8bb" stopOpacity=".42" />
          <stop offset=".85" stopColor="#314d3d" stopOpacity=".25" />
          <stop offset="1" stopColor="#cce2c4" stopOpacity=".7" />
        </linearGradient>
        <linearGradient
          id="bottle-light"
          x1="165"
          y1="95"
          x2="271"
          y2="355"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e1efce" stopOpacity=".8" />
          <stop offset=".4" stopColor="#85b795" stopOpacity=".07" />
          <stop offset="1" stopColor="#bad7ab" stopOpacity=".5" />
        </linearGradient>
        <linearGradient
          id="cap"
          x1="192"
          y1="65"
          x2="245"
          y2="84"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#99b29b" />
          <stop offset=".5" stopColor="#dde5c4" />
          <stop offset="1" stopColor="#7f9b83" />
        </linearGradient>
        <linearGradient
          id="metal"
          x1="130"
          y1="200"
          x2="300"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#53675d" />
          <stop offset=".13" stopColor="#d4dccb" />
          <stop offset=".3" stopColor="#8b9b89" />
          <stop offset=".55" stopColor="#e4e5ce" />
          <stop offset=".8" stopColor="#a4af97" />
          <stop offset="1" stopColor="#526a59" />
        </linearGradient>
        <linearGradient
          id="paper"
          x1="130"
          y1="130"
          x2="290"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c7ae83" />
          <stop offset="1" stopColor="#867454" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="230"
        cy="373"
        rx="88"
        ry="12"
        fill="#0b2118"
        opacity=".6"
        filter="url(#shadow)"
      />
      {kind === "bottle" ? (
        <g transform="rotate(-20 220 210)">
          <path
            d="M196 91v26c0 16-15 24-31 42-10 12-15 26-15 45v135c0 19 19 25 31 24 13 10 25 6 37 0 12 7 25 7 35-2 19 2 31-9 31-24V203c0-18-6-32-17-45-15-17-26-24-26-41V91Z"
            fill="url(#bottle-body)"
            stroke="#bfd3ae"
            strokeOpacity=".6"
            strokeWidth="1.2"
          />
          <path
            d="M198 94h41v26c0 16 16 29 29 43 8 10 12 27 12 39v134c0 16-12 22-25 22l-17-11-18 12-20-10-17 10c-13-1-28-7-28-22V204c0-19 5-30 16-44 14-17 27-25 27-41V94Z"
            fill="url(#bottle-light)"
          />
          <path d="M194 72q25-7 49 0v24q-25 7-49 0V72Z" fill="url(#cap)" />
          <ellipse cx="218.5" cy="72" rx="24.5" ry="5.5" fill="#d6dfbd" />
          <path
            d="M196 99q23 6 45 0M196 104q23 6 45 0"
            stroke="#a5bea0"
            strokeWidth="2"
          />
          {Array.from({ length: 11 }, (_, i) => (
            <path
              key={i}
              d={`M${198 + i * 4} 77v15`}
              stroke="#647f68"
              strokeOpacity=".5"
            />
          ))}
          <path
            d="M157 188q61 21 122 0M154 200q63 20 126 0M154 215q63 20 126 0M154 279q63 22 126 0M154 294q63 22 126 0M154 308q63 22 126 0M154 323q63 22 126 0"
            stroke="#c5dcc0"
            strokeOpacity=".45"
            strokeWidth="2.3"
          />
          <path
            d="M153 223q64 16 128 0v48q-64 18-128 0v-48Z"
            fill="#c0cba9"
            fillOpacity=".85"
          />
          <path
            d="M158 228q9 3 15 3v42l-15-3v-42Z"
            fill="#e3e4c9"
            fillOpacity=".4"
          />
          <path
            d="M190 240h56M195 249h46M208 258h22"
            stroke="#4a6651"
            strokeOpacity=".75"
            strokeWidth="1.3"
          />
          <path
            d="M173 172c-8 16-9 24-9 42m0 78v42"
            stroke="#edf4d7"
            strokeOpacity=".7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M251 157c15 19 21 30 21 46v119"
            stroke="#d0dfbc"
            strokeOpacity=".35"
            strokeWidth="2"
          />
          <path
            d="m183 356 8-19 27 13 23-13 16 17"
            stroke="#c2d7b2"
            strokeOpacity=".6"
            strokeWidth="2"
          />
        </g>
      ) : kind === "can" ? (
        <g transform="rotate(16 220 215)">
          <path
            d="M147 120q73-22 146 0v214q-73 30-146 0V120Z"
            fill="url(#metal)"
          />
          <ellipse
            cx="220"
            cy="121"
            rx="73"
            ry="19"
            fill="#c2cdb6"
            stroke="#e2e6ce"
            strokeWidth="3"
          />
          <ellipse
            cx="220"
            cy="121"
            rx="62"
            ry="14"
            stroke="#6c7e6c"
            strokeWidth="2"
          />
          <ellipse cx="221" cy="121" rx="15" ry="8" fill="#425b4a" />
          <path
            d="M211 116q-2-15 15-8t-4 16"
            stroke="#d9dfc8"
            strokeWidth="5"
          />
          <path
            d="M149 166q73 26 142 0v111q-73 25-142 0V166Z"
            fill="#2d503c"
            fillOpacity=".82"
          />
          <path
            d="M176 210h86M190 223h60M203 236h34"
            stroke="#d6ddbe"
            strokeWidth="2"
          />
          <path d="M150 330q73 30 140 0" stroke="#e1e6ce" strokeWidth="3" />
          <path
            d="M160 143v180"
            stroke="#ecedd5"
            strokeOpacity=".55"
            strokeWidth="4"
          />
        </g>
      ) : (
        <g transform="rotate(-12 220 215)">
          <path d="m127 148 111-42 94 51-114 45-91-54Z" fill="#d4bc91" />
          <path d="m127 148 91 54v143l-91-57V148Z" fill="url(#paper)" />
          <path d="m218 202 114-45v143l-114 45V202Z" fill="#a38c66" />
          <path
            d="m175 131 94 52v64l22-9v-63l-93-53-23 9Z"
            fill="#dfcda5"
            fillOpacity=".7"
          />
          <path d="m245 278 48-19v28l-48 19v-28Z" stroke="#e3d0a7" />
          <path d="m252 282 34-14m-34 20 24-10" stroke="#d9c79f" />
          <path d="m130 153 85 51v135" stroke="#dec59a" strokeOpacity=".6" />
        </g>
      )}
    </svg>
  );
}
