import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client.js";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm();

  const onSubmit = async (values) => {
    setError("");
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, values);
      saveSession(data);
      navigate(data.user.role === "admin" ? "/admin" : "/app", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-950">Reset Password</h1>
        {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="New password">
            <input
              className={inputClasses}
              type="password"
              required
              minLength={8}
              {...register("password")}
            />
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;
