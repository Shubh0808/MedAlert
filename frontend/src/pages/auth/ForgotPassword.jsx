import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import FormField, { inputClasses } from "../../components/FormField.jsx";

const ForgotPassword = () => {
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm();

  const onSubmit = async (values) => {
    const { data } = await api.post("/auth/forgot-password", values);
    setMessage(data.message);
    setResetToken(data.resetToken || "");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-950">Forgot Password</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Email">
            <input className={inputClasses} type="email" required {...register("email")} />
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isSubmitting ? "Generating..." : "Generate reset link"}
          </button>
        </form>
        {message ? (
          <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
            {resetToken ? (
              <Link className="mt-2 block font-bold" to={`/reset-password/${resetToken}`}>
                Continue to reset password
              </Link>
            ) : null}
          </div>
        ) : null}
        <Link className="mt-5 block text-sm font-semibold text-slate-700" to="/login">
          Back to login
        </Link>
      </div>
    </main>
  );
};

export default ForgotPassword;
