import { Link } from "react-router-dom";
import Icon from "../components/Icon";

// Sign Up page. Design-first stub: form layout only, no auth wiring yet.
// Rendered outside the sidebar shell.
export default function SignUp() {
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
          <h1 className="text-headline-lg text-on-surface">Create your account</h1>
          <p className="text-body-base text-on-surface-variant mt-1 mb-6">
            Start assessing diabetes and heart disease risk.
          </p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="label-field" htmlFor="name">Full Name</label>
              <input id="name" type="text" className="input-field" placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="label-field" htmlFor="email">Email</label>
              <input id="email" type="email" className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label-field" htmlFor="password">Password</label>
              <input id="password" type="password" className="input-field" placeholder="••••••••" />
            </div>
            <button className="btn-primary w-full" type="submit">
              Create Account
            </button>
          </form>
          <p className="mt-6 text-center text-body-base text-on-surface-variant">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <p className="text-center text-caption text-on-surface-variant mt-6">
          For clinical decision support only. Not a diagnostic tool.
        </p>
      </div>
    </div>
  );
}
