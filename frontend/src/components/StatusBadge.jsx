import clsx from "clsx";

const statusClasses = {
  active: "bg-red-50 text-red-700 ring-red-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-700 ring-slate-200"
};

const StatusBadge = ({ status }) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1",
      statusClasses[status] || statusClasses.cancelled
    )}
  >
    {status || "unknown"}
  </span>
);

export default StatusBadge;
