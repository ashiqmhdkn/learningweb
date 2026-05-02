export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/logo.png"
              alt="Crescent Learning"
              className="h-8 w-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="font-bold text-white text-lg">Crescent Learning</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            A legacy of success for generations. Inspiring learning since 1987.
          </p>
        </div>
 
        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {["Home", "About", "Programs", "Gallery", "Admission"].map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`} className="hover:text-emerald-400 transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
 
        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-3">Contact Us</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="tel:+919745686235" className="hover:text-emerald-400 transition-colors">
                📞 +91 9745686235
              </a>
            </li>
            <li>
              <a href="mailto:crescentcentreinfo@gmail.com" className="hover:text-emerald-400 transition-colors">
                ✉️ crescentcentreinfo@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://maps.app.goo.gl/oNH2WmB7FR3ZKWpo8"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                📍 Kadungathukundu, Kaplakanchery,<br />Malappuram, Kerala - 676551
              </a>
            </li>
          </ul>
        </div>
      </div>
 
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
        <p>© 2025 Crescent Learning. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#privacy" className="hover:text-gray-300">Privacy Policy</a>
          <a href="#terms" className="hover:text-gray-300">Terms of Service</a>
          <a href="#contact" className="hover:text-gray-300">Contact</a>
        </div>
      </div>
    </footer>
  );
}