"use client";

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signInWithPassword } from "@/lib/supabase/auth";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M23.766 12.276c0-.815-.067-1.62-.211-2.408H12.24v4.558h6.48a5.517 5.517 0 0 1-2.4 3.622v3.01h3.874c2.268-2.09 3.572-5.178 3.572-8.782Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 24c3.24 0 5.967-1.074 7.956-2.942l-3.874-3.01c-1.078.734-2.468 1.158-4.082 1.158-3.135 0-5.792-2.118-6.742-4.964H1.5v3.105A11.997 11.997 0 0 0 12.24 24Z"
        fill="#34A853"
      />
      <path
        d="M5.498 14.242a7.197 7.197 0 0 1 0-4.484V6.653H1.5a11.999 11.999 0 0 0 0 10.694l3.998-3.105Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 4.787c1.72-.027 3.383.62 4.653 1.811l3.465-3.465C18.102 1.043 15.385-.075 12.24 0A11.997 11.997 0 0 0 1.5 6.653l3.998 3.105c.947-2.85 3.607-4.971 6.742-4.971Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message || "Unable to continue with Google right now.");
      setIsGoogleLoading(false);
    }
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsManualLoading(true);

    const { error } = await signInWithPassword(email, password);

    if (error) {
      setErrorMessage(error.message || "Invalid email or password.");
      setIsManualLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#111] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-c-green-100/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-c-pale-green-100/8 blur-3xl" />
        <div className="relative grid gap-x-8 gap-y-10 md:grid-cols-2">
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <video
            loop
            muted
            playsInline
            disablePictureInPicture
            autoPlay
            className="h-full w-full max-w-[95%] md:max-w-[92%]"
            style={{ objectFit: "contain" }}
          >
            <source
              src="/assets/cta.mp4"
              type="video/mp4"
            />
          </video>
        </motion.div>
        <motion.div
          className="flex flex-col items-center justify-center md:items-start"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="mb-3 max-w-lg text-center text-3xl font-semibold tracking-tight text-white md:text-left md:text-4xl">
            Sign in to Sahaya
          </h2>
          <p className="mb-6 text-center text-sm text-white/70 md:text-left">
            Welcome back! Please sign in to continue.
          </p>

          <div className="w-full space-y-4">
            <Button
              className="h-12 w-full justify-center gap-2 rounded-xl border border-white/25 bg-white text-black hover:bg-white/90"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isManualLoading}
            >
              <GoogleIcon />
              {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
            </Button>

            <div className="relative py-1">
              <div className="h-px w-full bg-white/15" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111] px-3 text-xs uppercase tracking-wide text-white/55">
                Or
              </span>
            </div>

            <form className="space-y-3" onSubmit={handlePasswordSignIn}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/85">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isGoogleLoading || isManualLoading}
                  className="h-11 rounded-xl border-white/25 bg-black/35 text-white placeholder:text-white/40 focus-visible:ring-c-green-100/50"
                  placeholder="you@organization.org"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/85">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isGoogleLoading || isManualLoading}
                  className="h-11 rounded-xl border-white/25 bg-black/35 text-white placeholder:text-white/40 focus-visible:ring-c-green-100/50"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-c-green-100 text-black hover:bg-light-green"
                disabled={isGoogleLoading || isManualLoading}
              >
                {isManualLoading ? "Continuing..." : "Continue"}
              </Button>
            </form>

            {errorMessage && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </p>
            )}
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
