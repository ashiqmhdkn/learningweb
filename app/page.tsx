'use client';
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Topbar from "./components/Topbar";
import { useRouter } from 'next/navigation';
import Hero from "./components/Hero";
import About from "./components/About";
import Divisions from "./components/Divisions";
import Admission from "./components/Admission";
import Footer from "./components/Footer";
import Team from "./components/Team";
import Gallery from "./components/Gallery";
import Collaborators from "./components/Collaborators";
import WhatsAppButton from "./components/WhatsAppButton";
import { useAuth } from "@/api/auth-context";

export default function Home() {
  const router = useRouter();
  const { token } = useAuth(); // use context, not localStorage directly
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
    } else {
      setReady(true);
    }
  }, []); // ← empty deps, run only ONCE on mount

  if (!ready) return null;
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
