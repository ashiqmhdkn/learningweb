import { useState } from "react";
const GRADES = ["Grade 8", "Grade 9", "Grade 10", "Others"];
 

export default function Admission() {
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