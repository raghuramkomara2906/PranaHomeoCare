import { mockPractitioner } from "@/data/practitioner";
import { mockServices } from "@/data/services";
import { featuredArticles } from "@/data/articles";
import { mockTestimonials } from "@/data/testimonials";
import { homepageFaqs } from "@/data/faqs";

import { Hero } from "@/components/home/hero";
import { PatientReality } from "@/components/home/patient-reality";
import { AboutPreview } from "@/components/home/about-preview";
import { ExperienceHighlights } from "@/components/home/experience-highlights";
import { StatsBand } from "@/components/home/stats-band";
import { ServicesPreview } from "@/components/home/services-preview";
import { HowItWorksPreview } from "@/components/home/how-it-works-preview";
import { ConditionsConsulted } from "@/components/home/conditions-consulted";
import { PatientJourney } from "@/components/home/patient-journey";
import { EducationPreview } from "@/components/home/education-preview";
import { Testimonials } from "@/components/home/testimonials";
import { FaqPreview } from "@/components/home/faq-preview";
import { FinalCta } from "@/components/home/final-cta";

// Version 1 marketing content is static (mock data in src/data). There is no
// public content API, so the homepage reads the data directly rather than
// through a service that would call a non-existent endpoint.
export default function HomePage() {
  return (
    <>
      <Hero />
      <ExperienceHighlights />
      <ConditionsConsulted />
      <AboutPreview practitioner={mockPractitioner} />
      <StatsBand />
      <PatientReality />
      <ServicesPreview services={mockServices} />
      <PatientJourney />
      <HowItWorksPreview />
      <Testimonials testimonials={mockTestimonials} />
      <EducationPreview articles={featuredArticles} />
      <FaqPreview faqs={homepageFaqs} />
      <FinalCta />
    </>
  );
}