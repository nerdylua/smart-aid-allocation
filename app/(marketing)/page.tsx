import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import BenefitsSection from "@/components/landing/BenefitsSection";
import ProductsSection from "@/components/landing/ProductsSection";
import BuiltMoments from "@/components/landing/BuiltMoments";
import SecuritySection from "@/components/landing/SecuritySection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <BenefitsSection />
        <ProductsSection />
        <BuiltMoments />
        <SecuritySection />
      </main>
      <CtaSection />
      <Footer />
    </>
  );
}
