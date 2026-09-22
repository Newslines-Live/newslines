import type { ReactNode } from "react";
import { Syne, DM_Mono } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-mock-display",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mock-mono",
  weight: ["400", "500"],
});

export default function MockLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${syne.variable} ${mono.variable}`}>
      <style>{`
        .font-mock {
          font-family: var(--font-mock-display), var(--font-display), sans-serif;
        }
        .font-mono-mock {
          font-family: var(--font-mock-mono), ui-monospace, monospace;
        }
        @keyframes nl-rise {
          from { opacity: 0; transform: translateY(28px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes nl-drift {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-8px,0); }
        }
        .nl-rise { animation: nl-rise 0.9s cubic-bezier(0.22,1,0.36,1) both; }
        .nl-rise-d1 { animation-delay: 0.1s; }
        .nl-rise-d2 { animation-delay: 0.2s; }
        .nl-rise-d3 { animation-delay: 0.35s; }
        .nl-drift { animation: nl-drift 7s ease-in-out infinite; }
      `}</style>
      {children}
    </div>
  );
}
