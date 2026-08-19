import Icon from "./Icon";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

// Shared layout for auth pages (Sign In / Sign Up). Centered card on the
// background canvas with brand logo, title, subtitle, and footer disclaimer.
// Used by both SignIn and SignUp so they stay visually consistent.
export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <Icon name="ecg" className="text-[20px]" />
          </div>
          <span className="text-headline-md text-primary">Health Risk Predictor</span>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-headline-lg text-on-surface">{title}</h1>
          <p className="text-body-base text-on-surface-variant mt-1 mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-caption text-on-surface-variant mt-6">
          For clinical decision support only. Not a diagnostic tool.
        </p>
      </div>
    </div>
  );
}
