import { Link } from "lucide-react";
import { useEffect, useState } from "react";
  const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Programs", href: "#divisions" },
  { label: "Gallery", href: "#gallery" },
  { label: "Testimonials", href: "#collaborators" },
  { label: "About", href: "#about" },
];

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
 
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
 
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm" : "bg-white/90 backdrop-blur"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
              src="/logo.png"
            alt="Crescent Learning"
            className="h-9 w-9 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="font-bold text-emerald-700 text-lg tracking-tight">
            Crescent Learning
          </span>
        </Link>
 
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-gray-600 hover:text-emerald-700 transition-colors font-medium"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://wa.me/9745686235"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            Chat With Us
          </a>
        </nav>
 
        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
 
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-gray-700 hover:text-emerald-700 font-medium py-1"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://wa.me/9745686235"
            className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full text-center"
          >
            Chat With Us
          </a>
        </div>
      )}
    </header>
  );
}
