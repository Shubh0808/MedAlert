import { Activity } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (values) => {
    setError("");
    try {
      await registerUser(values);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <Link to="/" className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-600 text-white">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-950">MedAlert</p>
            <p className="text-xs text-slate-500">Create your emergency profile</p>
          </div>
        </Link>

        <h1 className="text-2xl font-bold text-slate-950">Register</h1>
        {error ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Full name" error={errors.fullName?.message}>
            <input
              className={inputClasses}
              {...register("fullName", { required: "Full name is required." })}
            />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input
              className={inputClasses}
              type="email"
              {...register("email", { required: "Email is required." })}
            />
          </FormField>
          <FormField label="Phone number" error={errors.phone?.message}>
            <input className={inputClasses} {...register("phone")} />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <input
              className={inputClasses}
              type="password"
              {...register("password", {
                required: "Password is required.",
                minLength: { value: 8, message: "Use at least 8 characters." }
              })}
            />
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-teal-700">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
