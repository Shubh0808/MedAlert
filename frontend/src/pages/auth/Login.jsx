import { Activity } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (values) => {
    setError("");
    try {
      const user = await login(values);
      const fallback = user.role === "admin" ? "/admin" : "/app";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <Link to="/" className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-600 text-white">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-950">MedAlert</p>
            <p className="text-xs text-slate-500">Secure dashboard access</p>
          </div>
        </Link>

        <h1 className="text-2xl font-bold text-slate-950">Login</h1>
        {error ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Email" error={errors.email?.message}>
            <input
              className={inputClasses}
              type="email"
              {...register("email", { required: "Email is required." })}
            />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <input
              className={inputClasses}
              type="password"
              {...register("password", { required: "Password is required." })}
            />
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-semibold text-teal-700 hover:text-teal-800">
            Forgot password?
          </Link>
          <Link to="/register" className="font-semibold text-slate-700 hover:text-slate-950">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Login;
