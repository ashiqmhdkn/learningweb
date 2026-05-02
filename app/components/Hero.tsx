 
const STATS = [
  { value: "38+", label: "Years of Excellence", sub: "Serving the community since 1987" },
  { value: "100k+", label: "Students Trained", sub: "Across all academic divisions" },
];
export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-16 bg-gradient-to-b from-emerald-50 to-white">
      <img
        src="/icons/crescent.png"
        alt="Crescent Learning"
        className="h-20 w-20 object-contain mb-6"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">
        Crescent Hybrid Tuition Centre
      </p>
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl mb-6">
        A Legacy of Success<br />
        <span className="text-emerald-600">For Generations</span>
      </h1>
      <p className="text-gray-500 max-w-xl text-lg mb-8">
        Established in 1987, empowering thousands of students through quality coaching and academic excellence.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://wa.me/9745686235"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3 rounded-full transition-colors"
        >
          Chat With Us
        </a>
        <a
          href="#divisions"
          className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold px-7 py-3 rounded-full transition-colors"
        >
          Explore Programs
        </a>
      </div>
 
      {/* Stats */}
      <div className="mt-16 grid grid-cols-2 gap-6 max-w-lg w-full">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-emerald-600">{s.value}</p>
            <p className="font-semibold text-gray-800 text-sm mt-1">{s.label}</p>
            <p className="text-gray-400 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
