const EmptyState = ({ title, message, icon: Icon }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
    {Icon ? (
      <Icon className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
    ) : null}
    <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message}</p>
  </div>
);

export default EmptyState;
