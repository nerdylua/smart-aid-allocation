import Logo from "./Logo";
import Link from "next/link";

type LinkItem = { label: string; href: string };

const PRODUCT_LINKS: LinkItem[] = [
  { label: "Platform", href: "#capabilities" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Dashboard", href: "/dashboard" },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: "About", href: "#about" },
  { label: "Impact", href: "#impact" },
  { label: "Security", href: "#security" },
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
      <SocialIcon href="#" label="X / Twitter">
        <svg
          width="20"
          height="20"
          viewBox="0 0 300 271"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z" />
        </svg>
      </SocialIcon>
      <SocialIcon href="#" label="LinkedIn">
        <svg width="17" height="17" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 310">
          <path d="M72.16,99.73H9.927c-2.762,0-5,2.239-5,5v199.928c0,2.762,2.238,5,5,5H72.16c2.762,0,5-2.238,5-5V104.73C77.16,101.969,74.922,99.73,72.16,99.73z" />
          <path d="M41.066,0.341C18.422,0.341,0,18.743,0,41.362C0,63.991,18.422,82.4,41.066,82.4c22.626,0,41.033-18.41,41.033-41.038C82.1,18.743,63.692,0.341,41.066,0.341z" />
          <path d="M230.454,94.761c-24.995,0-43.472,10.745-54.679,22.954V104.73c0-2.761-2.238-5-5-5h-59.599c-2.762,0-5,2.239-5,5v199.928c0,2.762,2.238,5,5,5h62.097c2.762,0,5-2.238,5-5v-98.918c0-33.333,9.054-46.319,32.29-46.319c25.306,0,27.317,20.818,27.317,48.034v97.204c0,2.762,2.238,5,5,5H305c2.762,0,5-2.238,5-5V194.995C310,145.43,300.549,94.761,230.454,94.761z" />
        </svg>
      </SocialIcon>
      <SocialIcon href="#" label="GitHub">
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
  return (
    <footer id="about" className="marketing-container py-6">
      <div className="border-light-green/20 grid gap-10 border-t pt-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <Link href="/" className="inline-block" aria-label="Sahaya home">
            <Logo className="h-12 w-auto" />
          </Link>
          <p className="text-light-green/60 max-w-md text-sm leading-relaxed">
            Community Need Intelligence Grid. An AI-powered platform that
            transforms scattered aid signals into prioritized, equitable
            responses - from intake to verified closure.
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
