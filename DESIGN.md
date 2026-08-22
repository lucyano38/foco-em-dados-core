---
name: Lumina Tech System
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#dcffe2'
  on-tertiary: '#00391d'
  tertiary-container: '#00f990'
  on-tertiary-container: '#006d3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#5bffa1'
  tertiary-fixed-dim: '#00e383'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#00522c'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
  surface-glass: rgba(255, 255, 255, 0.03)
  border-glass: rgba(255, 255, 255, 0.08)
  electric-blue: '#00F0FF'
  emerald-glow: '#00FF94'
  deep-slate: '#121214'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for high-performance SaaS and fintech environments, projecting an aura of "Premium Tech" through a blend of **Corporate Modernism** and **Glassmorphism**. The visual narrative focuses on precision, clarity, and depth, utilizing a sophisticated dark-mode foundation that allows vibrant accent colors to drive conversion.

The emotional response should be one of "effortless power." We achieve this through:
- **Atmospheric Depth:** Using semi-transparent layers and background blurs to create a sense of physical space.
- **High-Conversion Cues:** Strategic use of electric accents to guide the eye toward primary actions.
- **Polished Professionalism:** A balance of generous whitespace and meticulous alignment that mirrors the reliability of the underlying technology.

## Colors

The palette is anchored in a "Deep Slate" and "Neutral Black" foundation to establish a premium, low-fatigue environment. 

- **Primary (Electric Blue):** Used for critical conversion paths, active states, and primary CTAs. It should feel luminous against the dark background.
- **Secondary (Vivid Purple):** Reserved for supplemental highlights, feature categories, or secondary data visualizations.
- **Tertiary (Emerald Green):** Indicates growth, success, and positive financial trends.
- **Glass System:** Backgrounds use a tiered `surface-glass` approach. Level 1 surfaces are opaque `#121214`, while Level 2 overlays use semi-transparency with a 20px-40px backdrop blur to create the signature premium tech look.

## Typography

This design system employs a tri-font strategy to differentiate between branding, reading, and technical data:

1. **Hanken Grotesk (Headlines):** A sharp, contemporary grotesque that feels engineered and modern. Use bold weights for high-impact conversion areas.
2. **Inter (Body):** The industry standard for UI legibility. Used for all descriptive text and form elements to ensure zero friction in information processing.
3. **JetBrains Mono (Data/Labels):** Used sparingly for small labels, status indicators, and numerical data to reinforce the "tech-focused" aesthetic.

All headlines should use tighter letter-spacing (`-0.01em` to `-0.02em`) to maintain a "locked-in" professional appearance.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop dashboards to maintain a "cockpit" feel, transitioning to a fluid stack for mobile devices.

- **Desktop (1440px):** 12-column grid with 24px gutters. Content is often housed in "Widgets" or "Modules" that span 3, 4, 6, or 12 columns.
- **The 8px Rule:** All padding and margins must be multiples of 8px. This ensures a mathematical harmony across the interface.
- **Sidebars:** Persistent left-hand navigation at 280px width, utilizing a semi-transparent glass effect to allow background gradients to peak through.
- **Safe Zones:** High-conversion CTAs should always be surrounded by at least `32px` of whitespace to ensure focus.

## Elevation & Depth

Hierarchy is established through **Tonal Elevation** and **Glassmorphism**, rather than traditional heavy shadows.

- **Level 0 (Base):** Deep Slate (`#0A0A0C`).
- **Level 1 (Cards):** Surface color `#121214` with a 1px `border-glass` (`rgba(255,255,255,0.08)`).
- **Level 2 (Modals/Popovers):** Semi-transparent glass with a `40px` backdrop blur and a soft "Outer Glow" using the primary color at 5% opacity to simulate light emission.
- **Interactive States:** When hovered, cards should subtly lift using a `0px 10px 30px rgba(0, 0, 0, 0.5)` shadow and a slight scale increase (1.02x) to provide tactile feedback.

## Shapes

The shape language is "Sophisticated Softness." We avoid sharp 90-degree angles to keep the interface feeling modern and approachable, but we also avoid overly playful "bubbly" shapes.

- **Standard Radius:** 8px (`0.5rem`) for cards, input fields, and standard buttons.
- **Large Radius:** 16px (`1rem`) for large container modules or featured sections.
- **Pill Shapes:** Reserved exclusively for **Status Chips** (e.g., "Active", "Pending") and **Search Bars** to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Solid Electric Blue gradient background with white text. High-contrast, sharp 8px corners.
- **Secondary:** Transparent background with a 1px border-glass and a subtle hover-glow.
- **Glass CTA:** Semi-transparent white (10% opacity) with heavy blur, used for low-priority actions on vibrant backgrounds.

### Cards & Modules
- Every card must have a 1px top-down linear gradient border (white at 15% to white at 5%) to simulate a "top-light" edge.
- Padding inside cards is strictly 24px or 32px.

### Inputs
- Backgrounds should be darker than the card surface (`#050505`) to create an "inset" 3D feel. 
- Focus state: Border changes to Primary Electric Blue with a 2px outer glow.

### Dashboard Widgets
- Incorporate "Micro-Visualizations": Small sparklines or progress rings using the Secondary and Tertiary colors to show data vitality without cluttering the UI.
- Use JetBrains Mono for all numerical figures within widgets for a "technical readout" vibe.