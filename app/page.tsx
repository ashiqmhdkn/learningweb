'use client';
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
<<<<<<< HEAD
import Topbar from "./components/topbar";
=======
import Topbar from "./components/Topbar";
>>>>>>> backup-recovery
import { useRouter } from 'next/navigation';
import Hero from "./components/Hero";
import About from "./components/About";
import Divisions from "./components/Divisions";
<<<<<<< HEAD
=======
import Admission from "./components/Admission";
import Footer from "./components/Footer";
import Team from "./components/Team";
import Gallery from "./components/Gallery";
import Collaborators from "./components/Collaborators";
import WhatsAppButton from "./components/WhatsAppButton";
import { useAuth } from "@/api/auth-context";
>>>>>>> backup-recovery

export default function Home() {
  const router = useRouter();
  const { token } = useAuth(); // use context, not localStorage directly
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
<<<<<<< HEAD
=======
    } else {
      setReady(true);
>>>>>>> backup-recovery
    }
  }, []); // ← empty deps, run only ONCE on mount

<<<<<<< HEAD

 
 
const TEAM = [
  { name: "Sanu", role: "Co-Founder", qual: "B.Ed, Maths Specialist", img: "/sanu.jpg" },
  { name: "Saflie", role: "Co-Founder", qual: "MSc Maths", img: "/safle.jpg" },
  { name: "Noufal", role: "Co-Founder", qual: "MSc, Maths Specialist", img: "/noufal.jpg" },
  { name: "Muflih", role: "English Teacher", qual: "MA English", img: "/muflih.jpg" },
  { name: "Safuvana", role: "Teacher", qual: "BA English", img: "/crescent.png" },
  { name: "Ayesha Hamnah", role: "Teacher", qual: "BSc Botany", img: "/crescent.png" },
  { name: "Anas", role: "Teacher", qual: "BA Multimedia", img: "/crescent.png" },
  { name: "Mansoor", role: "Principal", qual: "", img: "/crescent.png" },
];
 
const GALLERY = [
  { src: "/modern-educational-campus-building.jpg", label: "Campus Overview", cat: "Campus" },
  { src: "/students-in-interactive-classroom.jpg", label: "Classroom Learning", cat: "Academics" },
  { src: "/modern-science-laboratory.jpg", label: "Science Lab", cat: "Facilities" },
  { src: "/students-playing-sports-outdoor.jpg", label: "Sports Activity", cat: "Sports" },
  { src: "/modern-library.png", label: "Library", cat: "Facilities" },
  { src: "/school-annual-event-celebration.jpg", label: "Annual Event", cat: "Events" },
  { src: "/computer-lab-with-workstations.jpg", label: "Computer Lab", cat: "Facilities" },
  { src: "/students-receiving-awards.jpg", label: "Student Achievement", cat: "Achievements" },
];
 
const GALLERY_FILTERS = ["All", "Campus", "Academics", "Facilities", "Sports", "Events", "Achievements"];
 
const COLLABORATORS = [
  { name: "MILES NGO", img: "/collaborators/miles.jpg" },
  { name: "Malik Deenar Haj Service", img: "/collaborators/malikdeenar.png" },
  { name: "Government of Kerala", img: "/collaborators/nmms.png" },
  { name: "Microsoft Education", img: "/collaborators/nmms.png" },
  { name: "Google for Education", img: "/collaborators/nmms.png" },
  { name: "Educational Trust", img: "/collaborators/nmms.png" },
];
 
const GRADES = ["Grade 8", "Grade 9", "Grade 10", "Others"];
 
// ─── Components ──────────────────────────────────────────────────────────────
 
 
 

 
 
function Team() {
  return (
    <section id="team" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-2">Our Team</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">The People We Build With</h2>
        </div>
 
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {TEAM.map((m) => (
            <div key={m.name} className="text-center group">
              <div className="relative mx-auto w-24 h-24 rounded-2xl overflow-hidden bg-emerald-50 mb-3 border border-gray-100">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = "none";
                    const parent = t.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-emerald-600">${m.name[0]}</div>`;
                    }
                  }}
                />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
              <p className="text-emerald-600 text-xs font-medium">{m.role}</p>
              {m.qual && <p className="text-gray-400 text-xs mt-0.5">{m.qual}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 
function Gallery() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? GALLERY : GALLERY.filter((g) => g.cat === active);
 
  return (
    <section id="gallery" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-2">Gallery</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Campus Gallery</h2>
          <p className="text-gray-500 mt-3">Explore our facilities and vibrant campus life.</p>
        </div>
 
        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {GALLERY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active === f
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
 
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((g) => (
            <div key={g.label} className="group relative rounded-xl overflow-hidden bg-gray-200 aspect-square">
              <img
                src={g.src}
                alt={g.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white font-semibold text-sm">{g.label}</p>
                <p className="text-white/70 text-xs">{g.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 
function Collaborators() {
  return (
    <section id="collaborators" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-2">Partners</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Collaborators</h2>
          <p className="text-gray-500 mt-3">Trusted partnerships with leading organisations and institutions.</p>
        </div>
 
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {COLLABORATORS.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <img
                src={c.img}
                alt={c.name}
                className="h-12 w-full object-contain grayscale hover:grayscale-0 transition-all"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <p className="text-xs text-gray-500 text-center leading-tight">{c.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 
function Admission() {
  const [form, setForm] = useState({
    name: "", school: "", parent: "", place: "", phone: "", grade: "",
  });
  const [submitted, setSubmitted] = useState(false);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };
 
  return (
    <section id="admission" className="py-20 px-4 bg-emerald-50">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-2">Enrol</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Admission & Registration</h2>
          <p className="text-gray-500 mt-3">Fill out the form below to apply for admission.</p>
        </div>
 
        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-500">Thank you. We will contact you shortly.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4"
          >
            {[
              { label: "Name *", name: "name", placeholder: "Student's full name" },
              { label: "School *", name: "school", placeholder: "School name" },
              { label: "Parent's Name *", name: "parent", placeholder: "Parent or guardian name" },
              { label: "Place *", name: "place", placeholder: "City / Town" },
              { label: "Phone *", name: "phone", placeholder: "+91 XXXXX XXXXX" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.name === "phone" ? "tel" : "text"}
                  name={f.name}
                  required
                  placeholder={f.placeholder}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            ))}
 
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student's Grade *</label>
              <select
                name="grade"
                required
                value={form.grade}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Select student grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
 
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              Submit Application
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
 
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/icons/crescent.png"
              alt="Crescent Learning"
              className="h-8 w-8 object-contain brightness-0 invert"
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
 
// ─── WhatsApp floating button ─────────────────────────────────────────────────
 
function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/9745686235"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}
  

  return (
=======
  if (!ready) return null;
  return (
>>>>>>> backup-recovery
   <>
       <Topbar />
      <main id="main-content">
        <Hero />
        <About />
        <Divisions />
        <Team />
        <Gallery />
        <Collaborators />
        <Admission />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
