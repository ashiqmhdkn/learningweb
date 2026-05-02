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
export default function Team() {
  return (
    <section id="team" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-orange-600 font-semibold text-sm tracking-widest uppercase mb-2">Our Team</p>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-950">The People We Build With</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {TEAM.map((m) => (
            <div key={m.name} className="text-center group">
              <div className="relative mx-auto w-24 h-24 rounded-2xl overflow-hidden bg-blue-50 mb-3 border border-gray-100">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = "none";
                    const parent = t.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-orange-600">${m.name[0]}</div>`;
                    }
                  }}
                />
              </div>
              <p className="font-semibold text-blue-950 text-sm">{m.name}</p>
              <p className="text-orange-600 text-xs font-medium">{m.role}</p>
              {m.qual && <p className="text-gray-600 text-xs mt-0.5">{m.qual}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
