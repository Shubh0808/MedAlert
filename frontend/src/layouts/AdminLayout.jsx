import { Ambulance, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-600">
              <Ambulance className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold">MedAlert Admin</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/admin"
              className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </NavLink>
            <NavLink
              to="/app"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              User View
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
