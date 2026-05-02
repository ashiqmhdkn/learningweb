import { useState } from "react";
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


export default function Gallery() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? GALLERY : GALLERY.filter((g) => g.cat === active);

  return (
    <section id="gallery" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-orange-600 font-semibold text-sm tracking-widest uppercase mb-2">Gallery</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Campus Gallery</h2>
          <p className="text-gray-500 mt-3">Explore our facilities and vibrant campus life.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {GALLERY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${active === f
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700"
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
