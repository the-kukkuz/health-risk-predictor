import { Link } from "react-router-dom";
import Icon from "../components/Icon";

// Sample SHAP data for diabetes features (based on actual model output)
// Declared here (above component) to avoid TDZ / hoisting issues with const.
const shapData = [
  { feature: "Glucose", shapValue: 0.35 },
  { feature: "BMI", shapValue: 0.28 },
  { feature: "Age", shapValue: 0.22 },
  { feature: "Pregnancies", shapValue: 0.15 },
  { feature: "SkinThickness", shapValue: 0.12 },
  { feature: "Insulin", shapValue: -0.08 },
  { feature: "DiabetesPedigreeFunction", shapValue: 0.05 },
  { feature: "BloodPressure", shapValue: -0.03 },
];

const HOW_IT_WORKS = [
  {
    icon: "data_usage",
    title: "1. Enter Data",
    desc: "Input relevant health metrics securely.",
  },
  {
    icon: "analytics",
    title: "2. Get Estimate",
    desc: "Receive an explained risk assessment.",
  },
  {
    icon: "forum",
    title: "3. Ask Questions",
    desc: "Clarify results with interactive support.",
  },
  {
    icon: "monitoring",
    title: "4. Track Results",
    desc: "Monitor changes over time to measure progress.",
  },
];

// Landing page — shown at "/" before auth. Matches design in docs/landingpage/.
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top Nav ─────────────────────────────────────────── */}
      <header className="bg-surface-container-lowest border-b border-outline-variant shadow-sm w-full sticky top-0 z-50">
        <div className="flex justify-between items-center h-14 px-4 md:px-8 max-w-[1280px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
            <span className="text-headline-sm text-primary tracking-tight font-semibold">
              Health Risk Predictor
            </span>
          </div>
          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="hidden sm:flex items-center text-label-md text-on-surface-variant px-3 py-1.5 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center text-label-md text-white bg-[#1d4ed8] px-4 py-1.5 rounded-lg shadow-sm hover:bg-primary transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* ── Hero Section ────────────────────────────────────── */}
        <section className="w-full px-4 md:px-8 max-w-[1280px] mx-auto py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left: copy */}
          <div className="flex flex-col gap-5">
            <h1 className="text-display-lg text-on-surface leading-tight">
              Early Awareness for Your Long-term Health
            </h1>
            <p className="text-body-base text-on-surface-variant max-w-md leading-relaxed">
              A decision-support tool for diabetes and heart disease risk estimation. Input your data, get explained results, and take the first step toward prevention.
            </p>
            {/* Disclaimer badge */}
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant w-fit">
              <Icon name="info" className="text-outline text-[14px]" />
              <p className="text-caption text-on-surface-variant">
                This is a decision-support tool, not a medical diagnosis.
              </p>
            </div>
            {/* CTA */}
            <Link
              to="/signup"
              className="inline-flex items-center justify-center text-label-md font-medium text-white bg-[#1d4ed8] px-7 py-2.5 rounded-lg shadow-sm hover:bg-primary hover:shadow-md transition-all w-fit"
            >
              Get Started
            </Link>
          </div>

          {/* Right: hero image */}
          <div className="hidden md:block w-full rounded-xl overflow-hidden border border-outline-variant shadow-md relative aspect-[3/2] bg-surface-container">
            <img
              src="/assets/hero-medical.jpg"
              alt="Advanced medical analytics visualization"
              className="w-full h-full object-cover"
            />
            {/* Risk Estimate overlay card */}
            <div className="absolute bottom-4 right-4 bg-surface-container-lowest/95 backdrop-blur-sm px-4 py-3 rounded-lg border border-outline-variant shadow-lg flex flex-col gap-2 w-44">
              <div className="flex justify-between items-center">
                <span className="text-caption text-on-surface-variant">Risk Estimate</span>
                <span className="text-label-md text-error font-medium">Elevated</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full" style={{ width: "72%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────── */}
        <section className="bg-surface-container-lowest w-full border-t border-b border-outline-variant py-14">
          <div className="px-4 md:px-8 max-w-[1280px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-headline-lg text-on-surface">How It Works</h2>
              <p className="text-body-base text-on-surface-variant mt-2">
                A streamlined process for clinical insights.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.title}
                  className="bg-surface p-6 rounded-xl border border-outline-variant shadow-card flex flex-col items-center text-center gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-1">
                    <Icon name={step.icon} className="text-[22px]" />
                  </div>
                  <h3 className="text-headline-sm text-on-surface">{step.title}</h3>
                  <p className="text-body-base text-on-surface-variant">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Clinical Scope ───────────────────────────────────── */}
        <section className="w-full px-4 md:px-8 max-w-[1280px] mx-auto py-14">
          <div className="text-center mb-10">
            <h2 className="text-headline-lg text-on-surface">Clinical Scope</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Diabetes */}
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-card flex flex-col sm:flex-row hover:shadow-card-hover transition-shadow duration-200">
              <div className="sm:w-1/3 bg-surface-container-low flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-outline-variant">
                <Icon name="medical_services" className="text-primary text-[44px]" />
              </div>
              <div className="p-6 sm:w-2/3 flex flex-col justify-center gap-2">
                <h3 className="text-headline-md text-on-surface">Diabetes Risk Screening</h3>
                <p className="text-body-base text-on-surface-variant leading-relaxed">
                  Evaluate metabolic indicators to estimate the likelihood of developing diabetes, supporting early intervention strategies.
                </p>
              </div>
            </div>
            {/* Heart Disease */}
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-card flex flex-col sm:flex-row hover:shadow-card-hover transition-shadow duration-200">
              <div className="sm:w-1/3 bg-surface-container-low flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-outline-variant">
                <Icon name="monitor_heart" className="text-primary text-[44px]" />
              </div>
              <div className="p-6 sm:w-2/3 flex flex-col justify-center gap-2">
                <h3 className="text-headline-md text-on-surface">Heart Disease Decision Support</h3>
                <p className="text-body-base text-on-surface-variant leading-relaxed">
                  Analyze cardiovascular risk factors to provide actionable insights for long-term heart health management.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Explainable AI / SHAP Trust Section ─────────────── */}
        <section className="bg-surface-container-lowest w-full border-t border-outline-variant py-14">
          <div className="px-4 md:px-8 max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            {/* SHAP image */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-sm border border-outline-variant rounded-xl shadow-card overflow-hidden bg-surface">
                <div className="px-4 pt-4 pb-2 border-b border-outline-variant">
                  <h4 className="text-headline-sm text-on-surface">Feature Importance: SHAP Summary</h4>
                  <p className="text-caption text-on-surface-variant mt-0.5">Impact on diabetes risk prediction</p>
                </div>
                {/* Inline bar chart using shapData */}
                <div className="p-4 space-y-2">
                  {shapData.map((item) => (
                    <div key={item.feature} className="flex items-center gap-2">
                      <span className="text-caption text-on-surface-variant w-32 text-right shrink-0 truncate">
                        {item.feature}
                      </span>
                      <div className="flex-1 flex items-center gap-0.5">
                        {/* Negative bar */}
                        <div className="flex-1 flex justify-end">
                          {item.shapValue < 0 && (
                            <div
                              className="h-3.5 rounded-l-full"
                              style={{
                                width: `${Math.abs(item.shapValue) * 260}%`,
                                backgroundColor: "#00501f",
                                opacity: 0.85,
                              }}
                            />
                          )}
                        </div>
                        {/* Center axis */}
                        <div className="w-px h-4 bg-outline-variant shrink-0" />
                        {/* Positive bar */}
                        <div className="flex-1">
                          {item.shapValue > 0 && (
                            <div
                              className="h-3.5 rounded-r-full"
                              style={{
                                width: `${item.shapValue * 260}%`,
                                backgroundColor: "#ba1a1a",
                                opacity: 0.85,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-5 px-4 pb-4 pt-2 border-t border-outline-variant">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#00501f]" />
                    <span className="text-caption text-on-surface-variant">Negative Impact</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <span className="text-caption text-on-surface-variant">Positive Impact</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: copy */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <h2 className="text-headline-lg text-on-surface">Explainable AI for Clinical Trust</h2>
              <p className="text-body-base text-on-surface-variant leading-relaxed">
                Our platform prioritizes transparency. Using SHAP (SHapley Additive exPlanations) values, every risk estimate is broken down to show exactly which health metrics contributed to the result—and by how much.
              </p>
              <p className="text-body-base text-on-surface-variant leading-relaxed">
                Grounded in validated clinical datasets, our models are designed to complement, not replace, professional medical judgment.
              </p>
              <div className="mt-2">
                <a href="#" className="text-label-md text-primary flex items-center gap-1 hover:underline w-fit">
                  Learn about our methodology <Icon name="arrow_forward" className="text-[14px]" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-8 py-5 max-w-[1280px] mx-auto gap-4">
          {/* Brand & Disclaimer */}
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <span className="text-label-md text-on-surface font-semibold">Health Risk Predictor</span>
            <span className="text-caption text-on-surface-variant">
              © 2026 Health Risk Predictor. For clinical decision support only.
            </span>
          </div>
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#" className="text-caption text-on-surface-variant hover:text-primary transition-colors">
              Documentation
            </a>
            <a href="#" className="text-caption text-on-surface-variant hover:text-primary transition-colors">
              About HRP
            </a>
            <Link to="/privacy" className="text-caption text-on-surface-variant hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
          {/* Auth links */}
          <div className="flex gap-4">
            <Link to="/signin" className="text-caption text-primary hover:underline">Sign In</Link>
            <Link to="/signup" className="text-caption text-primary hover:underline">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
