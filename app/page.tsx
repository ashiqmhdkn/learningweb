'use client';
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/api/auth-context";
import Topbar from "./components/Topbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Divisions from "./components/Divisions";
import Admission from "./components/Admission";
import Footer from "./components/Footer";
import Team from "./components/Team";
import Gallery from "./components/Gallery";
import Collaborators from "./components/Collaborators";
import WhatsAppButton from "./components/WhatsAppButton";

// Reuse in both loading states
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function Home() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, []);

  return (
    <>
      <Topbar />
      <main id="main-content">
        <Hero />
        <About />
        <Divisions />
        <Team />
        <Gallery />
        <Collaborators />
        <Admission />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}