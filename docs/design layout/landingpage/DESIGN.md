---
name: Clinical Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#00501f'
  on-tertiary: '#ffffff'
  tertiary-container: '#006b2c'
  on-tertiary-container: '#71ee8a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1280px
---

## Brand & Style

The brand personality is defined by clinical precision and professional reliability. It targets medical practitioners and healthcare analysts who require high-density data visualization without cognitive overload. The UI evokes a sense of "calm authority"—a sterile yet approachable environment where critical decisions are supported by clear, evidence-based visuals.

The design system employs a **Modern Corporate** style with a leaning toward **Minimalism**. It prioritizes extreme legibility, intentional whitespace, and a high-contrast information hierarchy. The interface avoids unnecessary decorative elements, using subtle tonal layers and thin hairline strokes to organize information. The result is a premium SaaS experience that feels like a sophisticated medical instrument: precise, clean, and highly functional.

## Colors

The palette is rooted in medical blues and functional grays to establish trust and neutrality. 

- **Primary & Secondary:** A duo of clinical blues used for primary actions, navigation, and active states. 
- **Functional/Risk Palette:** Highly saturated tones for risk stratification. These colors are reserved strictly for data meaning: Green for low-risk/reduction, Amber for moderate-risk/warnings, and Crimson for high-risk/increased probability.
- **Neutral Stack:** Utilizes a "Cool Slate" scale. The background is a very light slate (`#F8FAFC`) to reduce eye strain, while the text utilizes deep slates (`#0F172A`) to ensure WCAG AAA contrast compliance.
- **Surfaces:** Use pure white (`#FFFFFF`) for cards and containers to create a "layered paper" effect over the sterile background.

## Typography

This design system uses **Inter** for its systematic, utilitarian qualities and exceptional legibility at small sizes. 

- **Data First:** Metrics and risk percentages should use `display-lg` or `headline-lg` with tight tracking to emphasize importance.
- **Hierarchy:** Use weight (SemiBold/Bold) rather than size to differentiate card headers from body content, maintaining a compact vertical footprint.
- **Labels:** Form labels and table headers use `label-md` with Medium weight to remain distinct from user input data.
- **Numbers:** Always use tabular figures if the font variant allows, ensuring that columns of medical data align vertically for rapid scanning.

## Layout & Spacing

The system uses a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile.

- **Grid:** A 12-column grid system with 24px gutters. For the "Predictive Workspace" (the main app view), use a split-pane layout where inputs occupy a 2-column span and results/charts occupy a 3-column span in a 5-column sub-grid.
- **Rhythm:** A strict 4px baseline grid. 
- **Density:** High density for data tables and forms (8px-12px internal padding) to maximize data above the fold, while using more generous spacing (24px-32px) between major functional modules to prevent visual fatigue.
- **Breakpoints:** 
  - **Mobile (<640px):** Single column, 16px margins.
  - **Desktop (>1024px):** 1280px max-width, 32px margins.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines**. 

- **Surfaces:** Use a two-tier elevation model. The background layer is the canvas (`#F8FAFC`). Primary content sits on pure white cards.
- **Outlines:** Cards and inputs use a hairline border (`1px`) in Slate-200 (`#E2E8F0`). This provides structure without the "heavy" look of shadows.
- **Shadows:** Use a single, extra-diffused ambient shadow for cards to suggest a slight lift (`0 1px 3px 0 rgba(0, 0, 0, 0.05)`). Interactive elements (buttons) use a slightly stronger shadow on hover to indicate clickability.
- **Depth through Tinting:** Use subtle background tints (e.g., Green-50) to "recess" risk-state banners into the card, rather than elevating them.

## Shapes

The shape language is **Rounded**, balancing the clinical coldness of the color palette with approachable geometry.

- **Standard Elements:** Buttons, input fields, and small chips use a `0.5rem` (8px) radius.
- **Containers:** Primary cards and risk banners use a `0.75rem` (12px) radius to create a distinct container identity.
- **Data Visuals:** Progress bars and status badges use pill-shaped (fully rounded) ends to distinguish them from structural UI components.

## Components

- **Buttons:** 
  - **Primary:** Solid blue (`#1D4ED8`) with white text, 8px rounded.
  - **Secondary:** White background with Slate-300 border.
- **Input Fields:** White fill, 1px Slate-300 border. On focus, transition to a 1px Blue-500 border with a soft blue 2px ring. Labels are 14px Medium Slate-700.
- **Risk Banners:** High-contrast containers at the top of results. They must include a semantic icon, a bold label (e.g., "HIGH RISK"), and a matching colored progress bar (meter).
- **SHAP Charts:** Horizontal bar charts with 0.5rem rounded ends. Positive impact (risk increase) is Crimson; negative impact (risk decrease) is Green. Labels must be left-aligned and legible.
- **Data Tables:** Minimalist style. No vertical lines. 1px Slate-100 horizontal dividers only. Header row should have a light Slate-50 background.
- **Status Chips:** Small, pill-shaped badges with 10% opacity backgrounds of the status color and 100% opacity text for the label.