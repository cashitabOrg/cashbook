import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { Mail, MessageSquare, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-blue-200 relative bg-[#EAF5FD] overflow-hidden">
      <Navbar />
      <main className="relative z-10">
        <section className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-black text-[#001A4D] tracking-tight mb-6">
              We're here to help.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              Have questions about Cashitab, pricing, or need technical support?
              Our team is ready to assist you.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#EAF5FD] rounded-2xl flex items-center justify-center text-[#0052FF] mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#001A4D] mb-2">
                  Live Chat
                </h3>
                <p className="text-slate-500 font-medium mb-6">
                  Chat with our friendly team in real-time.
                </p>
                <button className="mt-auto text-[#0052FF] font-bold hover:underline">
                  Start a chat &rarr;
                </button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#EAF5FD] rounded-2xl flex items-center justify-center text-[#0052FF] mb-6">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#001A4D] mb-2">
                  Email Us
                </h3>
                <p className="text-slate-500 font-medium mb-6">
                  Drop us a line and we'll get back to you soon.
                </p>
                <a
                  href="mailto:support@cashitab.com"
                  className="mt-auto text-[#0052FF] font-bold hover:underline"
                >
                  support@cashitab.shop
                </a>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#EAF5FD] rounded-2xl flex items-center justify-center text-[#0052FF] mb-6">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#001A4D] mb-2">
                  Call Us
                </h3>
                <p className="text-slate-500 font-medium mb-6">
                  Mon-Fri from 8am to 5pm.
                </p>
                <a
                  href="tel:+15551234567"
                  className="mt-auto text-[#0052FF] font-bold hover:underline"
                >
                  +1 (555) 123-4567
                </a>
              </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 max-w-3xl mx-auto border border-slate-100">
              <h2 className="text-2xl font-bold text-[#001A4D] mb-8 text-center">
                Send us a message
              </h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#001A4D]">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[#001A4D] focus:outline-none focus:border-[#0052FF] transition-all"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#001A4D]">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[#001A4D] focus:outline-none focus:border-[#0052FF] transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#001A4D]">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[#001A4D] focus:outline-none focus:border-[#0052FF] transition-all"
                    placeholder="jane@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#001A4D]">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[#001A4D] focus:outline-none focus:border-[#0052FF] transition-all"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="button"
                  className="w-full bg-[#0052FF] text-white font-bold rounded-xl px-4 py-4 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-lg"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
