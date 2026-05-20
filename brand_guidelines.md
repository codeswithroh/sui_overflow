# Aether.ai — Brand Guidelines & Design System

These brand guidelines establish the UI/UX design tokens, visual aesthetics, and component behaviors for the **Aether.ai** platform. Our styling philosophy is centered around **Rich Glassmorphism** and **Warm, Clean Pastel Tones**, designed to invoke trust, high tech precision, and premium visual comfort.

---

## 🎨 Color Palette (Design Tokens)

We employ a curated HSL-tailored palette to ensure high contrast, accessibility, and visual harmony. Avoid raw primitive colors (like pure solid red, green, or blue).

### 1. Base Gradients & Overlays
*   **Page Background:** `linear-gradient(135deg, #F0F4FD 0%, #FDF4F5 50%, #F5F9F6 100%)` (A subtle, warm, morphing gradient)
*   **Card Background:** `rgba(255, 255, 255, 0.72)` (Slightly opaque white to allow backdrop blur visibility)
*   **Card Border:** `rgba(255, 255, 255, 0.60)` (Highlights edges, giving a glass refraction effect)

### 2. Functional Pastel Accents (HSL Grounded)
| Use Case | Accent Name | Hex | HSL Representation | Border Color |
| :--- | :--- | :--- | :--- | :--- |
| **Primary/AI Active** | Lavender Pastel | `#F0EDFF` | `hsl(247, 100%, 96%)` | `#D8D6FF` (Text: `#6366F1`) |
| **Success/DeepBook** | Mint Pastel | `#E6F7F0` | `hsl(156, 73%, 94%)` | `#A7F3D0` (Text: `#059669`) |
| **Warning/Danger** | Rose Pastel | `#FFEBEF` | `hsl(348, 100%, 96%)` | `#FBCFE8` (Text: `#DB2777`) |
| **Info/Secure Storage**| Sky Blue Pastel | `#E0F2FE` | `hsl(204, 94%, 94%)` | `#BAE6FD` (Text: `#0284C7`) |
| **Neutral Slate Text** | Slate Main | `#1E293B` | `hsl(217, 33%, 17%)` | — |
| **Neutral Slate Muted**| Slate Muted | `#64748B` | `hsl(215, 16%, 47%)` | — |

---

## ✍️ Typography

To convey a futuristic yet soft, accessible brand identity:

1.  **Headings (`h1`, `h2`, `h3`):** Use **Outfit** (Google Fonts). It features geometric shapes and slightly rounded corners that feel modern, clean, and highly professional.
    *   *Weight:* 700 (Bold) to 800 (Extra Bold).
    *   *Letter Spacing:* `-0.03em` for headers to feel tightly bound.
2.  **Body Text & Labels (`p`, `span`, `input`):** Use **Plus Jakarta Sans** (Google Fonts). It is highly readable at small sizes and has excellent screen spacing.
    *   *Weight:* 400 (Regular), 500 (Medium), and 600 (Semi-Bold) for hierarchy.

---

## 🪟 Glassmorphism & Elevation Parameters

Every card or container representing interface elements must follow these CSS specs to maintain visual consistency:

```css
.glass-panel {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px); /* Safari support */
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 24px;
    box-shadow: 
        0 10px 15px -3px rgba(148, 163, 184, 0.08), 
        0 4px 6px -2px rgba(148, 163, 184, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-panel:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 
        0 20px 25px -5px rgba(148, 163, 184, 0.12), 
        0 10px 10px -5px rgba(148, 163, 184, 0.04);
}
```

---

## 🕹️ Interactive Components Spec

### 1. Buttons & Controls
*   **Default Button:** Solid white background with a light borders. On hover, apply a light slide shadow and scale: `transform: scale(1.02)`.
*   **Primary Active Action:** Soft Lavender background with a deep Indigo label. On hover, background expands into deep indigo with a white label.
*   **Pills & Badges:** Rounded borders (`border-radius: 100px`) with corresponding text and background pastel variations.

### 2. The "Agent Thoughts" Scrolling Feed
*   **Purpose:** Renders the trading rationales fetched from Walrus.
*   **Visual Style:** A scrolling terminal feed inside a dark `#0F172A` box, featuring a typewriter indicator, syntax-highlighted code blocks, and subtle green blinking LEDs (`animation: pulse 1.5s infinite`).
*   **State indicators:**
    *   *Scanning:* Spinning pastel blue circle.
    *   *Decision Made:* Pulsing mint green indicator.
    *   *Hedging Activated:* Alert status with a glowing rose banner.

---

## 📐 Spacing & Layout Rules
*   **Container Width:** Max `1300px` for optimal grid alignment.
*   **Grid Spacing:** `2rem` (`32px`) gap between panels to allow breathing room and prevent visual clutter.
*   **Inner Padding:** Content cards must have `2.5rem` (`40px`) padding on desktop, scaling down to `1.5rem` (`24px`) on mobile devices.
