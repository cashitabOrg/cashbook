export default function IntelligenceSection() {
  return (
    <section className="py-24 bg-[#EAF5FD] relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Sticky Section */}
          <div className="lg:w-1/3 relative">
            <div className="lg:sticky lg:top-32 pt-8">
              <h2 className="text-4xl sm:text-4xl md:text-5xl font-bold text-[#001A4D] leading-[1.05] mb-4 tracking-tight">
                Business Insight? <br />{" "}
                <span className="text-[#0052FF]">Total Control.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 font-medium">
                Manage your inventory with AI.
              </p>
              <button className="bg-[#0052FF] text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
                Activate Now
              </button>
            </div>
          </div>

          {/* Right Scrolling Grid Section */}
          <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6 pt-8">
            {/* Card 1 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:shadow-blue-500/10 transition-all">
              <h3 className="text-xl font-bold text-[#001A4D] mb-3 leading-tight">
                Multi-Store Control
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-grow font-medium">
                Manage separate inventories, managers, and sales points from one
                unified super admin dashboard.
              </p>
              <div className="mt-auto rounded-xl overflow-hidden bg-blue-50/50">
                <img
                  src="/Multitasking-cuate.png"
                  alt="Multi Store Control"
                  className="w-full h-48 object-contain rounded-xl"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:shadow-blue-500/10 transition-all">
              <h3 className="text-xl font-bold text-[#001A4D] mb-3 leading-tight">
                Offline-First Sync
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-grow font-medium">
                Keep selling when the internet drops. Sales auto-reconcile to
                the cloud once you're back online.
              </p>
              <div className="mt-auto rounded-xl overflow-hidden bg-blue-50/50">
                <img
                  src="/Going offline-bro.png"
                  alt="Offline-First Sync"
                  className="w-full h-48 object-contain rounded-xl"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:shadow-blue-500/10 transition-all">
              <h3 className="text-xl font-bold text-[#001A4D] mb-3 leading-tight">
                Real-Time Audit Trail
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-grow font-medium">
                Every price change and refund is logged. Monitor manager
                corrections with a full history audit trail.
              </p>
              <div className="mt-auto rounded-xl overflow-hidden bg-blue-50/50">
                <img
                  src="/Environmental audit-cuate.png"
                  alt="Audit Ledger"
                  className="w-full h-48 object-contain rounded-xl"
                />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:shadow-blue-500/10 transition-all">
              <h3 className="text-xl font-bold text-[#001A4D] mb-3 leading-tight">
                Inventory Precision
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-grow font-medium">
                Track weight-based (kg) and piece-based stock with automated
                threshold alerts for restocks.
              </p>
              <div className="mt-auto rounded-xl overflow-hidden bg-blue-50/50">
                <img
                  src="/Market launch-cuate.png"
                  alt="Inventory Precision"
                  className="w-full h-48 object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
