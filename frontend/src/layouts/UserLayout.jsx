import {
  Activity,
  Ambulance,
  ContactRound,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  MapPinned,
  QrCode,
  Stethoscope,
  UserRound
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/profile", label: "Medical Profile", icon: UserRound },
  { to: "/app/contacts", label: "Contacts", icon: ContactRound },
  { to: "/app/sos", label: "SOS", icon: HeartPulse },
  { to: "/app/hospitals", label: "Hospitals", icon: MapPinned },
  { to: "/app/tools", label: "Medical Tools", icon: Stethoscope },
  { to: "/app/records", label: "Records", icon: FileText },
  { to: "/app/qr-card", label: "QR Card", icon: QrCode },
  { to: "/app/history", label: "History", icon: History }
];

const UserLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-600 text-white">
                <Ambulance className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-950">MedAlert</p>
                <p className="text-xs font-medium text-slate-500">Emergency response</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-200 p-4">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" aria-hidden="true" />
              <span className="font-bold text-slate-950">MedAlert</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold",
                    isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700"
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
