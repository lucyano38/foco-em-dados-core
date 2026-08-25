---
version: alpha
name: Foco em Dados CRM
description: OpenSquad UI-inspired design system for the Foco em Dados CRM. Warm Parchment / Soft Charcoal palette with amber interaction color, clear typographic hierarchy, and restrained elevation.
colors:
  primary: "#B45309"
  secondary: "#92400E"
  tertiary: "#D97706"
  neutral: "#6b6b6b"
  background: "#EFECE5"
  surface: "#FFFFFF"
  surfaceMuted: "#F4F1EA"
  border: "#DAD6CD"
  textPrimary: "#3f3f3f"
  textSecondary: "#6b6b6b"
  textMuted: "#6b6b6b"
  success: "#B45309"
  danger: "#DC2626"
typography:
  display:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  heading-md:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body-md:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
spacing:
  xs: 6px
  sm: 10px
  md: 16px
  lg: 22px
  xl: 28px
  xxl: 36px
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.border}"
  card-muted:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.border}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
    height: "40px"
  input:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
    border: "1px solid {colors.border}"
  input-focus:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
    border: "1px solid {colors.primary}"
elevation:
  sm: "0 1px 2px rgba(0,0,0,0.04)"
  md: "0 4px 12px rgba(0,0,0,0.06)"
  lg: "0 10px 25px rgba(0,0,0,0.08)"
shapes:
  card: "{rounded.lg}"
  button: "{rounded.lg}"
  input: "{rounded.md}"
  modal: "{rounded.xl}"
---

## Overview

This CRM design system favors readability, restraint, and warmth. The interface uses a parchment base with soft charcoal text and a single amber accent for actions and emphasis. Cards, inputs, and modals use consistent 1px borders and rounded corners to create clear grouping without heavy shadows.

## Colors

- **Primary (#B45309):** Amber accent for primary actions, active states, and emphasis.
- **Secondary (#92400E):** Hover/active variant of primary for interactive feedback.
- **Tertiary (#D97706):** Lighter accent for secondary highlights.
- **Neutral (#6b6b6b):** Supporting text, captions, and disabled states.
- **Background (#EFECE5):** Page background; warm parchment tone.
- **Surface (#FFFFFF):** Cards, panels, and elevated surfaces.
- **Surface Muted (#F4F1EA):** Inputs, fields, and secondary backgrounds.
- **Border (#DAD6CD):** Subtle 1px borders for cards, inputs, dividers.
- **Text Primary (#3f3f3f):** High-emphasis body and headline text.
- **Success (#B45309):** Uses the same amber as primary for consistency.
- **Danger (#DC2626):** Destructive actions and error messaging.

## Typography

- **Display:** Hanken Grotesk for page titles and hero headings.
- **Heading MD:** Hanken Grotesk for section headings and card titles.
- **Body MD / SM:** Manrope for UI text, labels, and form content.
- **Mono:** Geist Mono for numeric counters, metadata, and tabular data.

Use mono sparingly for counts, IDs, and status labels. Keep body text at 14px/16px equivalent for comfortable reading on tablet and desktop.

## Layout

- Page padding: 24px desktop, 16px tablet/mobile.
- Max content width: 1400px centered.
- Vertical rhythm: 16px baseline spacing between sections.
- Grid gaps: 16px cards, 12px tight lists, 24px section spacing.

## Elevation & Depth

Prefer borders over shadows. When elevation is needed:
- **SM:** `0 1px 2px rgba(0,0,0,0.04)`
- **MD:** `0 4px 12px rgba(0,0,0,0.06)`
- **LG:** `0 10px 25px rgba(0,0,0,0.08)`

## Shapes

- **Card / Button:** 14px radius
- **Input:** 10px radius
- **Modal:** 18px radius
- **Badge / Chip:** 9999px for pill shapes

## Components

### Card
White surface with 1px border, 14px radius, and 16px padding. Use for pipeline stages, metrics, and content blocks.

### Button Primary
Amber background, white text, 14px radius, 40px height. Use for primary actions like "Nova Prospecção", "Gerar Contrato", "Prospectar".

### Input
Warm muted background (#F4F1EA), 1px border (#DAD6CD), 10px radius. On focus, border becomes primary amber.

### Modal / Dialog
Centered panel with 18px radius and dark overlay. Use for forms, contract panel, and confirmations.

## Do's and Don'ts

- Do keep contrast high: primary text on light surfaces should meet WCAG AA.
- Do use the single amber accent consistently for actions and active states.
- Do use 1px borders for separation; avoid heavy drop shadows.
- Don't introduce new accent colors without updating this spec.
- Don't mix font families within the same line of text.
