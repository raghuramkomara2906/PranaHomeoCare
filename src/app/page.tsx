import { getPractitioner } from "@/services/practitioner.service";
import { getServices } from "@/services/services.service";
import { getFeaturedArticles } from "@/services/articles.service";
import { getTestimonials } from "@/services/testimonials.service";
import { getHomepageFaqs } from "@/services/faq.service";

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

export default async function HomePage() {
  const [practitioner, services, articles, testimonials, faqs] =
    await Promise.all([
      getPractitioner(),
      getServices(),
      getFeaturedArticles(),
      getTestimonials(),
      getHomepageFaqs(),
    ]);

  return (
    <>
      <Hero />
      <ExperienceHighlights />
      <ConditionsConsulted />
      <AboutPreview practitioner={practitioner} />
      <StatsBand />
      <PatientReality />
      <ServicesPreview services={services} />
      <PatientJourney />
      <HowItWorksPreview />
      <Testimonials testimonials={testimonials} />
      <EducationPreview articles={articles} />
      <FaqPreview faqs={faqs} />
      <FinalCta />
    </>
  );
}
