
# PatternCraft — AI-Powered 2D Pattern Generator

## Overview
An AI-powered tool that lets users upload a photo of any 3D object and generates editable 2D cutting patterns/templates. Designed for tailors, leatherworkers, upholsterers, and other craftspeople. Warm, earthy aesthetic with no login required.

## Pages & Flow

### 1. Landing Page
- Hero with tagline: "Turn any object into a cutting pattern"
- Brief how-it-works steps (Upload → AI Analyzes → Edit → Download)
- CTA button to start uploading
- Examples gallery showing sample objects → patterns

### 2. Upload & Generate Page
- Drag-and-drop or click-to-upload image area
- Optional: user enters object dimensions (height/width) for scale reference
- Optional: select material type (fabric, leather, paper, foam) — affects seam allowances
- "Generate Pattern" button → sends image to AI via Lovable Cloud edge function
- Loading state with progress indicator

### 3. Pattern Editor Page
- SVG pattern preview rendered on-screen with labeled pieces
- Interactive controls:
  - Adjust dimensions (scale up/down)
  - Toggle seam allowance on/off with configurable width
  - Add/remove pattern piece labels and grain lines
  - Zoom & pan the pattern
- Material info panel showing estimated material needed
- "Download as PDF" button — generates print-ready PDF at actual size

## Design
- **Palette**: Warm earth tones — tan, terracotta, cream, soft brown
- **Typography**: Friendly serif headings, clean sans-serif body
- **Textures**: Subtle linen/fabric background textures
- **Icons**: Hand-drawn style craft icons

## Technical Approach
- Lovable Cloud edge function calling Lovable AI (Gemini) to analyze the uploaded image and return pattern piece data (SVG paths, dimensions, labels)
- Client-side SVG rendering for the interactive editor
- PDF generation via the edge function for downloadable patterns
