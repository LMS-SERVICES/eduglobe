import { CONTACT, SOCIAL } from "@/lib/constants";

export const metadata = {
  title: "Contact Us – EduGlobe Academy",
  description: "Get in touch with EduGlobe Academy. Email, phone, and location.",
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">Contact Us</h1>
      <p className="text-slate-600 mb-10">Reach out for course enquiries, support, or partnerships.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href={`mailto:${CONTACT.email}`} className="p-5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition">
          <span className="text-2xl">✉️</span>
          <h2 className="font-semibold text-primary-dark mt-2">Email</h2>
          <p className="text-slate-600 text-sm mt-1">{CONTACT.email}</p>
        </a>
        <a href={`tel:+91${CONTACT.mobile}`} className="p-5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition">
          <span className="text-2xl">📞</span>
          <h2 className="font-semibold text-primary-dark mt-2">Phone</h2>
          <p className="text-slate-600 text-sm mt-1">{CONTACT.mobileDisplay}</p>
        </a>
        <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="p-5 rounded-xl border border-slate-200 hover:border-green-500/50 hover:shadow-md transition">
          <span className="text-2xl">💬</span>
          <h2 className="font-semibold text-primary-dark mt-2">WhatsApp</h2>
          <p className="text-slate-600 text-sm mt-1">Chat with us</p>
        </a>
      </div>
      <div className="mt-10 p-5 rounded-xl bg-slate-50 border border-slate-200">
        <h2 className="font-semibold text-primary-dark flex items-center gap-2">
          <span>📍</span> Location
        </h2>
        <p className="text-slate-600 mt-1">{CONTACT.location}</p>
      </div>
    </div>
  );
}
