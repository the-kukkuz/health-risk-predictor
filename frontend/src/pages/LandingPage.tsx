import { Link } from "react-router-dom";

const shapData = [
  { feature: "Glucose", shapValue: 0.35 },
  { feature: "BMI", shapValue: 0.28 },
  { feature: "Age", shapValue: 0.22 },
  { feature: "Pregnancies", shapValue: 0.15 },
  { feature: "SkinThickness", shapValue: 0.12 },
  { feature: "Insulin", shapValue: -0.08 },
  { feature: "DiabetesPedigree", shapValue: 0.05 },
  { feature: "BloodPressure", shapValue: -0.03 },
];

const maxAbs = Math.max(...shapData.map((d) => Math.abs(d.shapValue)));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold leading-none">HR</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Health Risk Predictor</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-base text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors"
            >
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-5">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-4">
              Clinical decision support tool
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight mb-5">
              Predict diabetes and heart disease risk from clinical measurements
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-xl">
              Enter patient vitals and lab values. The system runs validated machine learning models and returns a risk score with a feature-by-feature explanation of what drove the result.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/signup" className="btn-primary">
                Start an assessment
              </Link>
              <Link to="/signin" className="btn-secondary">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <h2 className="text-base font-semibold text-gray-900 mb-8">How it works</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {[
                {
                  n: "1",
                  title: "Enter patient measurements",
                  desc: "Input clinical values such as glucose, BMI, blood pressure, cholesterol, and age.",
                },
                {
                  n: "2",
                  title: "Model computes risk probability",
                  desc: "Validated Scikit-learn pipelines return a risk score and band (Low / Moderate / High).",
                },
                {
                  n: "3",
                  title: "Review factor explanations",
                  desc: "SHAP values show exactly which measurements pushed risk up or down, and by how much.",
                },
                {
                  n: "4",
                  title: "Ask follow-up questions",
                  desc: "A context-aware assistant can answer clinical questions about the prediction and factors.",
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="text-sm font-mono font-medium text-blue-600 mt-0.5 shrink-0 w-5">
                    {step.n}.
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SHAP explanation preview */}
        <section className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Every result is explained
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                The model doesn't return a number in isolation. SHAP (SHapley Additive exPlanations) values quantify the contribution of each clinical feature to the final risk score — so the result can be interrogated, not just accepted.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Risk expressed as a probability with a clearly labeled band",
                  "Features ranked by magnitude of impact",
                  "Direction shown: which values increased or decreased risk",
                  "Works for both Diabetes and Heart Disease models",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-gray-600">
                    <span className="mt-0.5 w-4 h-4 rounded-full border border-green-600 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* SHAP waterfall preview */}
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 mb-4">
                Example: Diabetes risk factor breakdown (SHAP)
              </p>
              <div className="space-y-2.5">
                {shapData.map((item) => {
                  const isPos = item.shapValue > 0;
                  const pct = (Math.abs(item.shapValue) / maxAbs) * 100;
                  return (
                    <div key={item.feature} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-36 shrink-0 text-right truncate">
                        {item.feature}
                      </span>
                      <div className="flex-1 flex items-center h-4 gap-px">
                        <div className="flex-1 flex justify-end">
                          {!isPos && (
                            <div
                              className="h-2.5 bg-green-500 rounded-l-sm"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                        <div className="w-px h-full bg-gray-300" />
                        <div className="flex-1">
                          {isPos && (
                            <div
                              className="h-2.5 bg-red-500 rounded-r-sm"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-mono w-10 text-right shrink-0 ${
                          isPos ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isPos ? "+" : ""}{item.shapValue.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-green-500" />
                  Decreases risk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-red-500" />
                  Increases risk
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>
            <span className="font-medium text-gray-600">Health Risk Predictor</span>
            {" "}— Clinical decision support only. Does not replace medical diagnosis.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
