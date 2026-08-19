import { useState } from "react";
import Icon from "../components/Icon";
import AuthLayout from "../components/AuthLayout";

// Forgot password page. Design-first stub: form layout only, no auth wiring yet.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center mx-auto">
            <Icon name="check" className="text-[24px] text-on-tertiary" />
          </div>
          <p className="text-body-base text-on-surface-variant">
            If an account exists for <strong className="text-on-surface">{email}</strong>,
            you'll receive a password reset link shortly.
          </p>
          <p className="text-sm text-on-surface-variant">
            Didn't receive it?{" "}
            <a href="mailto:support@healthrisk.example" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label-field" htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={!email.trim()}>
            Send Reset Link
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-body-base text-on-surface-variant">
        Remember your password?{" "}
        <a href="/signin" className="text-primary font-medium hover:underline">
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}
