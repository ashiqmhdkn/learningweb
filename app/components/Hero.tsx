import { ArrowRight, MessageCircle, Star, Award } from "lucide-react";
import { useState } from "react";


export default function Hero() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <section
     className="relative   h-screen w-full flex flex-col justify-center items-center text-center px-4 pt-16 overflow-hidden"
  
    //  className="h-screen w-full flex flex-col justify-center items-center text-center px-4 pt-16 bg-[radial-gradient(#002557_1.7px,transparent_1px)] 
    //         bg-size-[12px_12px]
    //         transition-all duration-300"
            onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }}
      >
                
     
      {/* Dotted background */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(#002557_1.7px,transparent_1px)]
          [background-size:12px_12px]
        "
      />

      {/* Mouse glow layer */}
      <div
        className="absolute inset-0 pointer-events-none transition duration-200"
        style={{
          background: `radial-gradient(
            100px circle at ${pos.x}px ${pos.y}px,
            rgba(234, 99, 9, 0.25),
            transparent 60%
          )`,
        }}
      />
      <img
        src="/logo.png"
        alt="Crescent Learning"
        className="h-20 w-20 object-contain mb-6 mt-8 rounded-full shadow-md z-1"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <p className="text-gray-600 font-semibold text-sm tracking-widest uppercase mb-3">
        Crescent Hybrid Tuition Centre
      </p>
      <h1 className="text-4xl md:text-6xl font-extrabold text-blue-950 leading-tight max-w-3xl mb-6">
        A Legacy of Success<br />
        <span className="text-orange-600">For Generations</span>
      </h1>
      <p className="text-gray-600 max-w-xl text-lg mb-8">
        Established in 1987, empowering thousands of students through quality coaching and academic excellence.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 z-1">
        <a
          href="https://wa.me/9745686235"
          className="bg-orange-600 hover:bg-transparent  hover:bg-blur-lg hover:text-orange-600 hover:border border-orange-600 text-white font-semibold px-7 py-3 rounded-full transition-colors"
        >
          Chat With Us
        </a>
        <a
          href="#divisions"
          className="border border-blue-950 text-blue-950 bg-blur-lg hover:bg-blue-950 hover:text-white font-semibold px-7 py-3 rounded-full transition-colors"
        >
          Explore Programs
        </a>
      </div>
      

      {/* Stats */}
      
    </section>
  );
}
