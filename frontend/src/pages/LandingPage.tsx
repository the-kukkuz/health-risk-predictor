import { Link } from "react-router-dom";
import Icon from "../components/Icon";

// Landing page — matches the design from docs/design layout/landingpage/
// This is shown at "/" (before auth). Authenticated routes use AppShell with sidebar.
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* TopNav - Landing Page variant */}
      <header className="bg-surface border-b border-outline-variant shadow-sm w-full sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined fill text-primary text-2xl">health_and_safety</span>
            <span className="font-headline-md text-headline-md text-primary tracking-tight">Health Risk Predictor</span>
          </div>
          <div className="flex items-center gap-md">
            <Link to="/signin" className="hidden sm:block font-label-md text-label-md text-primary px-4 py-2 border border-outline-variant rounded hover:bg-surface-container-low transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="font-label-md text-label-md text-on-primary bg-primary-container px-4 py-2 rounded shadow-sm hover:opacity-90 transition-opacity">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="w-full px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
          <div className="flex flex-col gap-lg">
            <h1 className="font-display-lg text-display-lg text-on-surface">
              Early Awareness for Your Long-term Health
            </h1>
            <p className="font-body-base text-body-base text-on-surface-variant max-w-lg">
              A decision-support tool for diabetes and heart disease risk estimation. Input your data, get explained results, and take the first step toward prevention.
            </p>
            <div className="flex items-center gap-sm bg-surface-container-low p-sm rounded border border-outline-variant w-fit">
              <span className="material-symbols-outlined text-outline text-sm">info</span>
              <p className="font-caption text-caption text-on-surface-variant">This is a decision-support tool, not a medical diagnosis.</p>
            </div>
            <div>
              <Link to="/signup" className="inline-flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary-container px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                Get Started
              </Link>
            </div>
          </div>
          
          {/* Medical Analytics Hero Visualization */}
          <div className="hidden md:block w-full h-[400px] rounded-xl overflow-hidden border border-outline-variant shadow-sm relative bg-gradient-to-br from-surface-container-lowest to-surface-container">
            {/* Medical analytics visualization */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c4c5d7" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#e2e7ff', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#f2f3ff', stopOpacity: 0.2 }} />
                </linearGradient>
              </defs>
              <rect width="600" height="400" fill="url(#heroGrad)" />
              <rect width="600" height="400" fill="url(#grid)" />
              
              {/* Human body silhouette (simplified) */}
              <g transform="translate(300, 200)" opacity="0.15">
                <ellipse cx="0" cy="-80" rx="25" ry="30" fill="#0037b0" />
                <path d="M-20,-50 Q-30,-20 -25,20 Q-20,60 -15,100 L15,100 Q20,60 25,20 Q30,-20 20,-50 Z" fill="#0037b0" />
                <path d="M-25,-30 Q-60,-10 -70,30 L-60,35 Q-50,0 -20,-20 Z" fill="#0037b0" />
                <path d="M25,-30 Q60,-10 70,30 L60,35 Q50,0 20,-20 Z" fill="#0037b0" />
              </g>
              
              {/* Data nodes and connections */}
              <g opacity="0.6">
                {/* Node: Precision Medicine */}
                <circle cx="120" cy="80" r="8" fill="#0037b0" />
                <text x="120" y="65" textAnchor="middle" className="text-caption" fill="#0037b0" fontSize="10" fontWeight="600">PRECISION</text>
                <text x="120" y="75" textAnchor="middle" className="text-caption" fill="#0037b0" fontSize="10" fontWeight="600">MEDICINE</text>
                
                {/* Node: Clinical Insights */}
                <circle cx="80" cy="180" r="8" fill="#006398" />
                <text x="80" y="165" textAnchor="middle" className="text-caption" fill="#006398" fontSize="10" fontWeight="600">CLINICAL</text>
                <text x="80" y="175" textAnchor="middle" className="text-caption" fill="#006398" fontSize="10" fontWeight="600">INSIGHTS</text>
                
                {/* Node: Real-time Monitoring */}
                <circle cx="480" cy="100" r="8" fill="#0037b0" />
                <text x="480" y="85" textAnchor="middle" className="text-caption" fill="#0037b0" fontSize="10" fontWeight="600">REAL-TIME</text>
                <text x="480" y="95" textAnchor="middle" className="text-caption" fill="#0037b0" fontSize="10" fontWeight="600">MONITORING</text>
                
                {/* Node: Data Driven Healthcare */}
                <circle cx="150" cy="320" r="8" fill="#006398" />
                <text x="150" y="340" textAnchor="middle" className="text-caption" fill="#006398" fontSize="10" fontWeight="600">DATA DRIVEN</text>
                <text x="150" y="350" textAnchor="middle" className="text-caption" fill="#006398" fontSize="10" fontWeight="600">HEALTHCARE</text>
                
                {/* Node: Trusted Analysis */}
                <circle cx="450" cy="300" r="8" fill="#0037b0" />
                <text x="450" y="320" textAnchor="middle" className="text-caption" fill="#0037b0" fontSize="10" fontWeight="600">TRUSTED</text>
                <text x="450" y="330" textAnchor="middle" className="text-caption" fill="#0037b0" fontSize="10" fontWeight="600">ANALYSIS</text>
                
                {/* Connection lines */}
                <line x1="120" y1="80" x2="300" y2="200" stroke="#0037b0" strokeWidth="1" opacity="0.4" />
                <line x1="80" y1="180" x2="300" y2="200" stroke="#006398" strokeWidth="1" opacity="0.4" />
                <line x1="480" y1="100" x2="300" y2="200" stroke="#0037b0" strokeWidth="1" opacity="0.4" />
                <line x1="150" y1="320" x2="300" y2="200" stroke="#006398" strokeWidth="1" opacity="0.4" />
                <line x1="450" y1="300" x2="300" y2="200" stroke="#0037b0" strokeWidth="1" opacity="0.4" />
                
                {/* Central node: Advanced Medical Analytics */}
                <circle cx="300" cy="200" r="15" fill="#0037b0" opacity="0.8" />
                <text x="300" y="195" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">ADVANCED</text>
                <text x="300" y="207" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">MEDICAL</text>
                <text x="300" y="219" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">ANALYTICS</text>
              </g>
              
              {/* Animated pulse rings */}
              <circle cx="300" cy="200" r="40" fill="none" stroke="#0037b0" strokeWidth="1" opacity="0.2">
                <animate attributeName="r" from="40" to="80" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.2" to="0" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="300" cy="200" r="60" fill="none" stroke="#006398" strokeWidth="0.5" opacity="0.15">
                <animate attributeName="r" from="60" to="120" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.15" to="0" dur="4s" repeatCount="indefinite" />
              </circle>
            </svg>
            
            {/* Mock UI overlay card - Risk Estimate */}
            <div className="absolute bottom-6 right-6 bg-surface p-4 rounded-lg border border-outline-variant shadow-md flex flex-col gap-sm w-48">
              <div className="flex justify-between items-center">
                <span className="font-caption text-caption text-on-surface-variant">Risk Estimate</span>
                <span className="font-label-md text-label-md text-error">Elevated</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-error w-3/4"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-surface-container-lowest w-full border-t border-b border-outline-variant py-16">
          <div className="px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">How It Works</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mt-2">A streamlined process for clinical insights.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
              {/* Step 1 */}
              <div className="bg-surface p-lg rounded-lg border border-outline-variant shadow-card flex flex-col items-center text-center gap-sm">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary mb-2">
                  <Icon name="data_usage" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">1. Enter Data</h3>
                <p className="font-body-base text-body-base text-on-surface-variant">Input relevant health metrics securely.</p>
              </div>
              {/* Step 2 */}
              <div className="bg-surface p-lg rounded-lg border border-outline-variant shadow-card flex flex-col items-center text-center gap-sm">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary mb-2">
                  <Icon name="analytics" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">2. Get Estimate</h3>
                <p className="font-body-base text-body-base text-on-surface-variant">Receive an explained risk assessment.</p>
              </div>
              {/* Step 3 */}
              <div className="bg-surface p-lg rounded-lg border border-outline-variant shadow-card flex flex-col items-center text-center gap-sm">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary mb-2">
                  <Icon name="forum" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">3. Ask Questions</h3>
                <p className="font-body-base text-body-base text-on-surface-variant">Clarify results with interactive support.</p>
              </div>
              {/* Step 4 */}
              <div className="bg-surface p-lg rounded-lg border border-outline-variant shadow-card flex flex-col items-center text-center gap-sm">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary mb-2">
                  <Icon name="monitoring" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">4. Track Results</h3>
                <p className="font-body-base text-body-base text-on-surface-variant">Monitor changes over time to measure progress.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Scope Section */}
        <section className="w-full px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto py-16">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Clinical Scope</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {/* Scope 1 */}
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-card flex flex-col sm:flex-row">
              <div className="sm:w-1/3 bg-surface-container-low flex items-center justify-center p-lg border-b sm:border-b-0 sm:border-r border-outline-variant">
                <Icon name="medical_services" className="text-primary text-5xl" />
              </div>
              <div className="p-lg sm:w-2/3 flex flex-col justify-center">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Diabetes Risk Screening</h3>
                <p className="font-body-base text-body-base text-on-surface-variant">Evaluate metabolic indicators to estimate the likelihood of developing diabetes, supporting early intervention strategies.</p>
              </div>
            </div>
            {/* Scope 2 */}
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-card flex flex-col sm:flex-row">
              <div className="sm:w-1/3 bg-surface-container-low flex items-center justify-center p-lg border-b sm:border-b-0 sm:border-r border-outline-variant">
                <Icon name="monitor_heart" className="text-primary text-5xl" />
              </div>
              <div className="p-lg sm:w-2/3 flex flex-col justify-center">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Heart Disease Decision Support</h3>
                <p className="font-body-base text-body-base text-on-surface-variant">Analyze cardiovascular risk factors to provide actionable insights for long-term heart health management.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="bg-surface-container-lowest w-full border-t border-outline-variant py-16">
          <div className="px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            <div className="md:col-span-5 flex justify-center">
              {/* SHAP Summary Visualization */}
              <div className="w-full max-w-sm border border-outline-variant rounded-lg shadow-sm p-6 bg-surface">
                <h4 className="font-headline-sm text-headline-sm text-on-surface mb-4 text-center">Feature Importance: SHAP Summary</h4>
                <p className="text-caption text-on-surface-variant mb-4 text-center">Impact on diabetes risk prediction</p>
                
                {/* SHAP summary chart using Recharts */}
                <div className="space-y-2">
                  {shapData.map((item) => (
                    <div key={item.feature} className="flex items-center gap-3">
                      <span className="text-caption text-on-surface-variant w-28 text-right shrink-0">{item.feature}</span>
                      <div className="flex-1 flex items-center gap-1">
                        {/* Negative impact (left) */}
                        <div className="flex-1 flex justify-end">
                          {item.shapValue < 0 && (
                            <div
                              className="h-4 rounded-l"
                              style={{
                                width: `${Math.abs(item.shapValue) * 100}%`,
                                backgroundColor: '#00501f',
                                opacity: 0.8,
                              }}
                            ></div>
                          )}
                        </div>
                        {/* Center line */}
                        <div className="w-px h-4 bg-outline-variant"></div>
                        {/* Positive impact (right) */}
                        <div className="flex-1">
                          {item.shapValue > 0 && (
                            <div
                              className="h-4 rounded-r"
                              style={{
                                width: `${item.shapValue * 100}%`,
                                backgroundColor: '#ba1a1a',
                                opacity: 0.8,
                              }}
                            ></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-outline-variant">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-tertiary"></div>
                    <span className="text-caption text-on-surface-variant">Negative Impact</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-error"></div>
                    <span className="text-caption text-on-surface-variant">Positive Impact</span>
                  </div>
                </div>
                <p className="text-caption text-on-surface-variant mt-3 text-center">
                  SHAP values show contribution magnitude to model output
                </p>
              </div>
            </div>
            <div className="md:col-span-7 flex flex-col gap-md">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Explainable AI for Clinical Trust</h2>
              <p className="font-body-base text-body-base text-on-surface-variant">
                Our platform prioritizes transparency. Using SHAP (SHapley Additive exPlanations) values, every risk estimate is broken down to show exactly which health metrics contributed to the result—and by how much.
              </p>
              <p className="font-body-base text-body-base text-on-surface-variant">
                Grounded in validated clinical datasets, our models are designed to complement, not replace, professional medical judgment.
              </p>
              <div className="mt-4">
                <a href="#" className="font-label-md text-label-md text-primary flex items-center gap-1 hover:underline">
                  Learn about our methodology <Icon name="arrow_forward" className="text-sm" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-lg max-w-max-width mx-auto gap-md">
          {/* Brand & Disclaimer */}
          <div className="flex flex-col items-center md:items-start gap-xs text-center md:text-left">
            <span className="font-label-md text-label-md text-on-surface font-semibold">Health Risk Predictor</span>
            <span className="font-caption text-caption text-on-surface-variant">© 2026 Health Risk Predictor. For clinical decision support only.</span>
          </div>
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-md">
            <a href="#" className="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors">
              Documentation
            </a>
            <a href="#" className="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors">
              About HRP
            </a>
            <a href="/privacy" className="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors">
              Privacy Policy
            </a>
          </div>
          {/* Sign in / up links in footer */}
          <div className="flex gap-md">
            <a href="/signin" className="font-caption text-caption text-primary hover:underline">Sign In</a>
            <a href="/signup" className="font-caption text-caption text-primary hover:underline">Sign Up</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sample SHAP data for diabetes features (based on actual model output)
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
