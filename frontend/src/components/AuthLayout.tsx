interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">HR</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">Health Risk Predictor</span>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-5">
          For clinical decision support only. Not a diagnostic tool.
        </p>
      </div>
    </div>
  );
}
