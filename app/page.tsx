'use client';
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Topbar from "./components/topbar";
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

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('cl_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);
  

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
