import { ArrowRight, MessageCircle, Star, Award } from "lucide-react";

const STATS = [
  { value: "38+", label: "Years of Excellence", sub: "Since 1987" },
  { value: "100k+", label: "Students Trained", sub: "Across all divisions" },
];

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] pt-24 pb-12 overflow-hidden bg-slate-50 flex items-center">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] rounded-full bg-emerald-200/30 blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl opacity-60 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-8 md:mt-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-sm font-semibold tracking-wide mb-6 shadow-sm">
              <img
              src="/logo.png"
            alt="Crescent Learning"
            className="h-9 w-9 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
              <span>Crescent Hybrid Tuition Centre</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              A Legacy of Success <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                For Generations
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Established in 1987, empowering thousands of students through quality coaching, dedicated mentorship, and academic excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="https://wa.me/9745686235"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle className="w-5 h-5" />
                Chat With Us
              </a>
              <a
                href="#divisions"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 hover:text-emerald-700 font-semibold px-8 py-4 rounded-full transition-all border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Programs
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-6 pt-8 border-t border-slate-200/60 max-w-lg mx-auto lg:mx-0">
              {STATS.map((s) => (
                <div key={s.label} className="group">
                  <p className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{s.value}</p>
                  <p className="font-semibold text-slate-800 text-sm md:text-base">{s.label}</p>
                  <p className="text-slate-500 text-xs md:text-sm mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image/Visual Content */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none mt-12 lg:mt-0">
            {/* Main Image */}
            <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-square group">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Students collaborating"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
            </div>

            {/* Floating Element 1 */}
            <div className="absolute -bottom-6 -left-6 lg:-bottom-10 lg:-left-12 bg-white/90 backdrop-blur-md p-5 md:p-6 rounded-2xl shadow-xl border border-white border-opacity-50 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Top Rated</p>
                  <p className="text-xs text-slate-500">NMMS & PSC Coaching</p>
                </div>
              </div>
            </div>
            
            {/* Floating Element 2 */}
            <div className="hidden md:block absolute -top-8 -right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white border-opacity-50 hover:-translate-y-1 transition-transform duration-300">
               <img
                src="/logo.png"
                alt="Crescent Learning Logo"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
