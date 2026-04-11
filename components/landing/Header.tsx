"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLink[] = [
  { label: "Platform", href: "#capabilities" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Impact", href: "#impact" },
  { label: "Trust", href: "#security" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="sticky top-0 z-40 pt-4 md:pt-6">
      <div className="marketing-container">
        <div className="relative mx-auto max-w-6xl">
          <nav className="bg-dark-gray relative grid grid-cols-[1fr_auto_1fr] items-center rounded-full p-2.5 shadow-lg transition-all duration-300">
            <div className="relative ml-0 flex justify-start">
              <Link className="relative inline-flex items-center gap-2" href="/" onClick={closeMenu}>
                <Logo />
                <span className="text-light-green text-base font-semibold tracking-wide">Sahaya</span>
              </Link>
            </div>
            <div className="hidden items-center justify-center gap-7 text-sm md:flex xl:gap-10">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="hover:text-c-green-100">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden items-center gap-7 justify-self-end text-sm md:flex">
              <div className="flex flex-row items-center justify-between gap-x-4 text-lg md:text-sm">
                <Link
                  className="text-c-green-100 group relative flex items-center gap-2.5 overflow-hidden rounded-full pl-3"
                  href="/login"
                >
                  <span className="bg-c-green-100 absolute inset-0 origin-right scale-x-0 transform rounded-full transition-transform duration-150 ease-out group-hover:scale-x-100" />
                  <span className="text-c-green-100 relative z-10 whitespace-nowrap transition-colors duration-150 ease-in-out group-hover:text-black">
                    Log In
                  </span>
                  <span className="bg-c-green-100 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full p-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="black"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
            <div className="text-light-green col-start-3 mr-2 justify-self-end md:hidden">
              <button
                type="button"
                title="Toggle navigation menu"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isMobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </nav>

          <div
            id="mobile-navigation"
            className={`bg-dark-gray absolute inset-x-0 top-[calc(100%+0.75rem)] overflow-hidden rounded-[28px] border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 md:hidden ${
              isMobileMenuOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
          >
            <div className="flex flex-col gap-1 p-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-light-green hover:text-c-green-100 hover:bg-white/4 rounded-2xl px-4 py-3 text-sm transition-colors"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="border-light-green/10 flex items-center gap-3 border-t p-3">
              <Link
                href="/login"
                className="btn-marketing btn-primary btn-dark flex-1"
                onClick={closeMenu}
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
