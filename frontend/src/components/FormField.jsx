const FormField = ({ label, error, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <div className="mt-1">{children}</div>
    {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
  </label>
);

export const inputClasses =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default FormField;
