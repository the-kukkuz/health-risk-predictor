import { useState } from "react";
import Icon from "../components/Icon";
import AuthLayout from "../components/AuthLayout";

// Privacy Policy page. Design-first stub: placeholder content.
export default function PrivacyPolicy() {
  return (
    <AuthLayout title="Privacy Policy" subtitle="Last updated: August 2026">
      <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
        <p>
          At Health Risk Predictor, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
        </p>
        <h3 className="text-headline-sm text-on-surface">1. Information We Collect</h3>
        <p>
          We collect information you provide directly, including:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Account information (name, email, password)</li>
          <li>Clinical inputs for risk assessment (age, BMI, glucose levels, etc.)</li>
          <li>Usage data (interaction with the platform, assessment history)</li>
        </ul>
        <h3 className="text-headline-sm text-on-surface">2. How We Use Your Information</h3>
        <p>
          We use your information to:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Provide and maintain the risk assessment platform</li>
          <li>Process your clinical inputs and generate risk predictions</li>
          <li>Improve our services and user experience</li>
          <li>Communicate with you about account-related matters</li>
        </ul>
        <h3 className="text-headline-sm text-on-surface">3. Data Security</h3>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
        </p>
        <h3 className="text-headline-sm text-on-surface">4. Data Retention</h3>
        <p>
          We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
        </p>
        <h3 className="text-headline-sm text-on-surface">5. Your Rights</h3>
        <p>
          You have the right to:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of non-essential communications</li>
        </ul>
        <h3 className="text-headline-sm text-on-surface">6. Contact Us</h3>
        <p>
          If you have questions about this privacy policy, please contact us at{" "}
          <a href="mailto:privacy@healthrisk.example" className="text-primary hover:underline">
            privacy@healthrisk.example
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
