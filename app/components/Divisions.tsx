const DIVISIONS = [
  {
    tag: "NMMS Coaching",
    title: "National Means-cum-Merit Scholarship",
    desc: "Specialized coaching for NMMS examination with expert guidance and comprehensive study materials.",
    badges: ["Expert Mentors", "Mock Tests", "Doubt Clearing"],
    stats: [{ v: "1500+", l: "Qualified Students" }, { v: "250+", l: "Scholarship Eligible" }],
  },
  {
    tag: "PSC Coaching",
    title: "Competitive Exam Coaching",
    desc: "Advanced online coaching designed to empower students to excel in competitive examinations through expert mentorship and structured study plans.",
    badges: ["Online & Offline", "Expert Mentors", "Structured Plans"],
    stats: [{ v: "1000+", l: "PSC Students" }, { v: "15+", l: "Years Experience" }],
  },
  {
    tag: "CHTC",
    title: "Crescent Hybrid Tuition Centre",
    desc: "Blended learning combining online and offline classes for personalised attention and comprehensive academic support.",
    badges: ["Hybrid Learning", "Personal Attention", "Flexible Options"],
    stats: [{ v: "8-10", l: "Grades Covered" }, { v: "1 to 1", l: "Classes Available" }],
  },
  {
    tag: "CSW",
    title: "Crescent Students Wing",
    desc: "Holistic programmes nurturing students' social responsibility through palliative care, volunteering, and community development.",
    badges: ["Social Work", "Palliative Care", "Community"],
    stats: [{ v: "Class 9+", l: "Eligibility" }, { v: "Moral", l: "Development" }],
  },
];

export default function Divisions() {
  return (
    <section id="divisions" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-2">Programs</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Academic Divisions</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Comprehensive educational programmes designed for every learning preference.
          </p>
        </div>
 
        <div className="grid md:grid-cols-2 gap-6">
          {DIVISIONS.map((d) => (
            <div
              key={d.tag}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {d.tag}
              </span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{d.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{d.desc}</p>
 
              <div className="flex flex-wrap gap-2 mb-5">
                {d.badges.map((b) => (
                  <span key={b} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                    {b}
                  </span>
                ))}
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                {d.stats.map((s) => (
                  <div key={s.l} className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-extrabold text-emerald-700">{s.v}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
