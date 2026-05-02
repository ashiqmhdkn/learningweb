const COLLABORATORS = [
  { name: "MILES NGO", img: "/collaborators/miles.jpg" },
  { name: "Malik Deenar Haj Service", img: "/collaborators/malikdeenar.png" },
  { name: "Government of Kerala", img: "/collaborators/nmms.png" },
  { name: "Microsoft Education", img: "/collaborators/nmms.png" },
  { name: "Google for Education", img: "/collaborators/nmms.png" },
  { name: "Educational Trust", img: "/collaborators/nmms.png" },
];
export default function Collaborators() {
  return (
    <section id="collaborators" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-orange-600 font-semibold text-sm tracking-widest uppercase mb-2">Partners</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Collaborators</h2>
          <p className="text-gray-500 mt-3">Trusted partnerships with leading organisations and institutions.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {COLLABORATORS.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <img
                src={c.img}
                alt={c.name}
                className="h-12 w-full object-contain grayscale-0 hover:grayscale-100 transition-all"
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
