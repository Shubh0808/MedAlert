import { Activity, ArrowRight, FileText, MapPinned, QrCode, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Activity, title: "SOS alerts", text: "Create active emergency events with GPS data." },
  { icon: MapPinned, title: "Hospital discovery", text: "Find nearby hospitals and directions." },
  { icon: FileText, title: "Medical records", text: "Store prescriptions, reports, and insurance files." },
  { icon: QrCode, title: "QR emergency card", text: "Share critical medical details instantly." }
];

const LandingPage = () => (
  <div className="min-h-screen bg-slate-50">
    <section className="medical-hero min-h-[88vh] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-600">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold">MedAlert</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
          >
            Register
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-28">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Smart medical emergency response
          </p>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-normal sm:text-6xl lg:text-7xl">
            MedAlert
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100">
            A full-stack emergency response platform for SOS alerts, live location sharing,
            hospital discovery, medical records, QR cards, and admin monitoring.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
            >
              Start Emergency Profile
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="self-end rounded-lg border border-white/15 bg-white/10 p-4 shadow-soft backdrop-blur">
          <div className="rounded-lg bg-white p-4 text-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Active response</p>
                <p className="text-xl font-bold">SOS tracking ready</p>
              </div>
              <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                LIVE
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-lg border border-slate-200 p-3">
                  <feature.icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
                  <p className="mt-2 text-sm font-bold text-slate-950">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto -mt-10 grid max-w-7xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-4 lg:px-8">
      {features.map((feature) => (
        <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <feature.icon className="h-6 w-6 text-teal-700" aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-slate-950">{feature.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
        </div>
      ))}
    </section>
  </div>
);

export default LandingPage;
