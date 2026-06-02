const StatCard = ({ label, value, icon: Icon, tone = "teal" }) => {
  const toneClasses = {
    teal: "bg-teal-50 text-teal-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <div className={`grid h-11 w-11 place-items-center rounded-lg ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;
