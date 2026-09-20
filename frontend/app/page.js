import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-paper-white font-codingo-sans text-charcoal">
      <Navbar />
      <main className="flex-1">
        <Hero />
      </main>
    </div>
  );
}
