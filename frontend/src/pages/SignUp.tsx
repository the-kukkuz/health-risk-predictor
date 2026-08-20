import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const navigate = useNavigate();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!termsAccepted) errs.terms = "You must accept the terms and conditions";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");

    if (!validate()) return;

    setLoading(true);

    // Split Full Name into first_name and last_name for FastAPI SignUpSchema
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      const response = await fetch("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          first_name: firstName,
          last_name: lastName,
          role: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create account.");
      }

      // Redirect user to Sign In page after registration
      navigate("/signin", {
        state: { message: "Account created successfully! Please sign in." },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSignupError(err.message);
      } else {
        setSignupError("An unexpected error occurred during sign up.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start assessing diabetes and heart disease risk with personalized insights."
    >
      {signupError && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error mb-4">
          {signupError}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="label-field" htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            className="input-field"
            placeholder="Dr. Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="label-field" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint="At least 8 characters. Use a mix of letters, numbers, and symbols."
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 mt-0.5 rounded border-outline-variant"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="terms" className="text-sm text-on-surface-variant">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-error" role="alert">
            {errors.terms}
          </p>
        )}

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-on-surface-variant/30 border-t-primary rounded-full animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-body-base text-on-surface-variant">
        Already have an account?{" "}
        <Link to="/signin" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}