import type { FaqItem } from "@/lib/types";

/**
 * MOCK DATA — replace with a real API response from GET /api/v1/faqs once
 * the backend is connected (see src/services/faq.service.ts). This same
 * dataset backs both the FAQ page accordions and the rule-based website
 * assistant's keyword search.
 */
export const mockFaqs: FaqItem[] = [
  {
    id: "faq_consultation_length",
    question: "How long is each consultation?",
    answer:
      "It depends on the service — initial consultations run 60 minutes, follow-ups 30, so there's always enough time to talk properly rather than feeling rushed. Exact durations are shown on the Services page.",
    category: "Appointments",
    homepageFeatured: true,
  },
  {
    id: "faq_how_online_works",
    question: "How do online consultations work?",
    answer:
      "Online consultations take place over a secure video call at your scheduled time. After booking, you'll receive confirmation details by email, and you can join the call from your patient dashboard once your appointment window opens.",
    category: "Online Consultations",
    homepageFeatured: true,
  },
  {
    id: "faq_another_city",
    question: "Can I consult from another city or country?",
    answer:
      "In most cases, yes — consultations happen entirely online, so location usually isn't a barrier. If local regulations affect your specific situation, the practitioner will let you know before your appointment.",
    category: "Online Consultations",
    homepageFeatured: true,
  },
  {
    id: "faq_is_it_right_for_me",
    question: "Is homeopathic consultation right for me?",
    answer:
      "That's a personal question best discussed directly with the practitioner rather than answered generically here. A general wellness consultation is a low-pressure way to start that conversation — book an appointment to talk through your particular situation.",
    category: "Online Consultations",
  },
  {
    id: "faq_first_appointment",
    question: "What happens during my first appointment?",
    answer:
      "Your first appointment is mainly a conversation — the practitioner will get to know you and explain how the consultation process works going forward. You don't need to prepare anything in advance beyond a quiet space and a stable internet connection.",
    category: "Appointments",
  },
  {
    id: "faq_what_to_have_ready",
    question: "What should I have ready before my appointment?",
    answer:
      "Just yourself, a quiet space, and a device with a camera and microphone. If you'd like, jotting down a few things you want to cover can help — but nothing is required in advance.",
    category: "Appointments",
  },
  {
    id: "faq_reschedule_cancel",
    question: "Can I reschedule or cancel my appointment?",
    answer:
      "Yes. You can reschedule or cancel from your patient dashboard, subject to the cancellation policy shown at booking. We'd recommend making changes as early as you can.",
    category: "Rescheduling and Cancellations",
    homepageFeatured: true,
  },
  {
    id: "faq_privacy",
    question: "Is my information kept private?",
    answer:
      "Your account details are kept private and are only used to manage your bookings and consultations. See the Privacy Policy for full details on how information is handled.",
    category: "Privacy",
    homepageFeatured: true,
  },
  {
    id: "faq_what_you_need",
    question: "What do I need to join an online consultation?",
    answer:
      "A smartphone, tablet, or computer with a camera and microphone, a stable internet connection, an updated browser, and a quiet, private location.",
    category: "Technical Support",
  },
  {
    id: "faq_booking_window",
    question: "How far in advance can I book an appointment?",
    answer:
      "Available times are shown live on the booking page. How far ahead you can book depends on current availability, which updates continuously.",
    category: "Appointments",
  },
  {
    id: "faq_payments",
    question: "What payment methods are accepted?",
    answer:
      "Accepted payment methods are shown at checkout during booking. Full pricing details for each service are listed on the Services page before you confirm.",
    category: "Payments",
  },
  {
    id: "faq_assistant_diagnose",
    question: "Can the website assistant diagnose my symptoms?",
    answer:
      "No. The website assistant cannot diagnose conditions, interpret symptoms, or recommend treatment. For personal guidance, please schedule a consultation with the practitioner.",
    category: "Website Assistant",
  },
  {
    id: "faq_missed_window",
    question: "What happens if I miss my appointment window?",
    answer:
      "If you don't join during the permitted window, the appointment is marked as a no-show in your dashboard. Contact the practice to discuss rescheduling.",
    category: "Appointments",
  },
  {
    id: "faq_recording",
    question: "Will my consultation be recorded?",
    answer:
      "Recording practices are confirmed in the Teleconsultation Consent shown before your appointment, so you know exactly what applies before you join.",
    category: "Privacy",
  },
  {
    id: "faq_emergency",
    question: "Is this platform a substitute for emergency care?",
    answer:
      "No. This platform is not an emergency service. If you are experiencing a medical emergency, please contact your local emergency services immediately.",
    category: "Website Assistant",
  },
];

export const homepageFaqs = mockFaqs.filter((faq) => faq.homepageFeatured);
