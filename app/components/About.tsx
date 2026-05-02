export default function About() {
  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-2">About Us</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About Crescent Learning</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Established in 1987, Crescent Learning has been a beacon of educational excellence, providing quality coaching
          and academic support to thousands of students across multiple divisions.
        </p>
        <div className="bg-emerald-50 rounded-2xl p-8 text-left">
          <h3 className="text-xl font-bold text-emerald-700 mb-3">Our Mission</h3>
          <p className="text-gray-600 leading-relaxed">
            A legacy of success through generations defines our journey in education. Our mission is to inspire
            learning, nurture talent, and empower minds to achieve excellence. We continue to uphold values that make
            education meaningful and transformative — for lifelong learning.
          </p>
        </div>
      </div>
    </section>
  );
}