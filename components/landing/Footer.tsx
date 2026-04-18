"use client";

import Logo from "./Logo";
import Link from "next/link";
import { type MouseEvent as ReactMouseEvent } from "react";

type LinkItem = { label: string; href: string };

const PRODUCT_LINKS: LinkItem[] = [
  { label: "Overview", href: "#features" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Architecture", href: "#architecture" },
  { label: "Use Cases", href: "#use-cases" },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: "About", href: "#about" },
  { label: "Trust", href: "#security" },
  { label: "Dashboard", href: "/dashboard" },
];

const LEGAL_LINKS: LinkItem[] = [
  { label: "Privacy & Data", href: "#security" },
  { label: "Terms of Use", href: "#security" },
  { label: "Access Dashboard", href: "/dashboard" },
];

function LinkColumn({ title, links }: { title: string; links: LinkItem[] }) {
  return (
    <div className="space-y-3">
      <p className="text-light-green text-sm font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={link.label}
            className="block text-light-green/60 hover:text-light-green transition-colors"
            href={link.href}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="border-light-green/30 hover:bg-light-green/10 fill-light-green flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
      target="_blank"
      rel="noreferrer"
      href={href}
      aria-label={label}
    >
      {children}
    </a>
  );
}

function SocialRow() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SocialIcon href="https://github.com/nerdylua/smart-aid-allocation" label="GitHub">
        <svg
          width="26"
          height="26"
          viewBox="0 0.5 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21Z" />
        </svg>
      </SocialIcon>
    </div>
  );
}

export default function Footer() {
  const handleHomeClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== "/") return;

    event.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="about" className="marketing-container py-6">
      <div className="border-light-green/20 grid gap-10 border-t pt-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <Link href="/" className="inline-block" aria-label="Sahaya home" onClick={handleHomeClick}>
            <Logo className="h-12 w-auto" />
          </Link>
          <p className="text-light-green/60 max-w-md text-sm leading-relaxed">
            Community Need Intelligence Grid. An AI-powered platform that
            transforms scattered aid signals into prioritized, equitable
            responses from intake to verified closure.
          </p>
          <SocialRow />
        </div>

        <div className="grid gap-8 text-sm sm:grid-cols-2">
          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>
      </div>

      <div className="border-light-green/20 mt-10 flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-light-green/60">&copy; Sahaya 2026. All rights reserved.</p>
        <div className="flex items-center gap-5">
          {LEGAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-light-green/60 hover:text-light-green transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
