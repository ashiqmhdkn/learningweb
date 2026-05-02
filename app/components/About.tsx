const STATS = [
  { value: "38+", label: "Years of Excellence", sub: "Since 1987" },
  { value: "100k+", label: "Students Trained", sub: "Across all divisions" },
];

export default function About() {
  return (
    <section id="about" className="mt-20 py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-orange-600 font-semibold text-sm tracking-widest uppercase mb-2">About Us</p>
        <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-6">About Crescent Learning</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Established in 1987, Crescent Learning has been a beacon of educational excellence, providing quality coaching
          and academic support to thousands of students across multiple divisions.
        </p>
        <div className="bg-gray-100 rounded-2xl p-8 text-left">
          <h3 className="text-xl font-bold text-orange-600 mb-3">Our Mission</h3>
          <p className="text-blue-950 leading-relaxed">
            A legacy of success through generations defines our journey in education. Our mission is to inspire
            learning, nurture talent, and empower minds to achieve excellence. We continue to uphold values that make
            education meaningful and transformative — for lifelong learning.
          </p>
        </div>
        <div className="flex justify-center align-center">

        <div className="mt-16 flex justify-center align-center grid grid-cols-2 gap-6 max-w-lg w-full">
        {STATS.map((s) => (
          <div key={s.label} className="bg-gray-100 rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-extrabold text-orange-600">{s.value}</p>
            <p className="font-semibold text-blue-950 text-sm mt-1">{s.label}</p>
            <p className="text-gray-600 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      </div>
      </div>
    </section>
  );
}