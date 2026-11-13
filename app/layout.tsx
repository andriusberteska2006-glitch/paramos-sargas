import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "./globals.css";

// latin-ext carries the Lithuanian letters (ą č ę ė į š ų ū ž).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Paramos sargas",
  description: "Paramos įsipareigojimų kalendorius ir priminimai",
};

const NAV = [
  ["/#kaip-veikia", "Kaip tai veikia"],
  ["/rezultatai?saltinis=dokumentas", "Mano įsipareigojimai"],
  ["/saugykla", "Įrodymų saugykla"],
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg font-semibold tracking-tight">
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <span className="max-sm:sr-only">Paramos sargas</span>
            </Link>
            <nav aria-label="Pagrindinė navigacija" className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
              {NAV.map(([href, label], i) => (
                <Link
                  key={href}
                  href={href}
                  // The "how it works" anchor only matters on the home page; hide it on phones to save room.
                  className={`${i === 0 ? "hidden md:inline-flex" : "inline-flex"} h-10 items-center whitespace-nowrap rounded-lg px-3 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
