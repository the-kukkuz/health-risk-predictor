import { Link } from "react-router-dom";
import Icon from "../components/Icon";

// Sign In page. Design-first stub: form layout only, no auth wiring yet.
// Rendered outside the sidebar shell.
export default function SignIn() {
  return (
    <AuthLayout title="Sign in to Health Risk Predictor" subtitle="Access your risk assessments and analytics.">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label-field" htmlFor="email">Email</label>
          <input id="email" type="email" className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label-field" htmlFor="password">Password</label>
          <input id="password" type="password" className="input-field" placeholder="••••••••" />
        </div>
        <button className="btn-primary w-full" type="submit">
          Sign In
        </button>
      </form>
      <p className="mt-6 text-center text-body-base text-on-surface-variant">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <Icon name="ecg" className="text-[20px]" />
          </div>
          <span className="text-headline-md text-primary">Health Risk Predictor</span>
        </div>
        <div className="card p-8">
          <h1 className="text-headline-lg text-on-surface">{title}</h1>
          <p className="text-body-base text-on-surface-variant mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
        <p className="text-center text-caption text-on-surface-variant mt-6">
          For clinical decision support only. Not a diagnostic tool.
        </p>
      </div>
    </div>
  );
}
