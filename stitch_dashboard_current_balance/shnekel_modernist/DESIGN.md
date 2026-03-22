# Design System Document

## 1. Overview & Creative North Star: "The Financial Sanctuary"
This design system is engineered to transform the often-stressful act of budgeting into a calm, editorial experience. We depart from the cluttered, data-heavy "dashboard" look in favor of **Soft Minimalism**. Our Creative North Star is **The Financial Sanctuary**: a space that feels open, authoritative, and breathable.

To achieve this high-end editorial feel, the layout rejects rigid, boxed-in grids. Instead, it utilizes **Intentional Asymmetry** and **Tonal Depth**. By layering surfaces of varying "weights" and employing a drastic typography scale, we guide the eye toward the most critical data point—the balance—without the need for aggressive visual cues.

---

## 2. Colors
Our palette balances the gravity of financial responsibility with the optimism of growth.

### Core Palette
*   **Primary (#1A2634):** The "Deep Slate." Used for high-emphasis actions, primary buttons, and heavy headings. It provides a grounded, premium foundation.
*   **Secondary/Positive (#00C853):** The "Vibrant Growth." Reserved exclusively for positive progress, surplus balances, and successful completions. 
*   **Surface (#F8F9FA):** The "Crisp Canvas." Our default background, providing a clean, high-contrast base for all elements.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. In this system, boundaries are defined strictly through background color shifts. For example, a `surface-container-low` card sits on a `surface` background to create a "ghost" boundary. We use negative space, not lines, to organize information.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
*   **Surface (Base):** The foundation.
*   **Surface-Container-Lowest:** Floating "hero" elements.
*   **Surface-Container-High:** Nested internal data points or secondary lists.
Use these tiers to create a sense of organic depth. An inner container should always be slightly lighter or darker than its parent to signal containment.

---

## 3. Typography
We use a high-contrast typographic pairing to achieve an editorial feel.

*   **Display & Headlines (Manrope):** A modern sans-serif with geometric properties. Use `display-lg` (3.5rem) for the Hebrew currency symbol (₪) and monetary values to create an "unapologetic" focus on the numbers.
*   **Body & Labels (Inter):** A highly legible, neutral sans-serif. This provides a functional counterpoint to the bold display weights.

**Hierarchy as Identity:** By making monetary values 3x larger than their labels (e.g., `display-md` for the amount vs `label-md` for "left today"), we create a clear "Data-First" narrative that feels premium and custom-built for the user's goals.

---

## 4. Elevation & Depth
Elevation is achieved through **Tonal Layering** rather than structural shadows.

*   **The Layering Principle:** Stacking a `surface-container-lowest` (#FFFFFF) card on top of a `surface` (#F8F9FA) background creates a soft, natural lift. 
*   **Ambient Shadows:** For floating primary CTAs, use an extra-diffused shadow.
    *   *Spec:* `Box-shadow: 0px 20px 40px rgba(26, 38, 52, 0.06);`
    *   The shadow must be tinted with the `on-surface` color, never pure black, to mimic natural ambient light.
*   **Glassmorphism:** For overlays or navigation bars, use `surface` colors at 80% opacity with a `backdrop-blur: 20px`. This softens the transition between layers and feels more integrated into the "Sanctuary" environment.

---

## 5. Components

### Buttons
*   **Primary:** Deep Slate (#1A2634) background, White text. Large radius (`xl`: 1.5rem). Use a subtle gradient from `primary` to `primary_container` for a "satin" finish.
*   **Secondary:** Ghost Border style. Use `outline-variant` at 20% opacity. No fill.

### Circular Progress Gauges
*   **Track:** Use `surface-container-highest` with a thick stroke.
*   **Progress:** Use `secondary` (#00C853). The gauge should be the centerpiece of the dashboard, surrounding the large `display-lg` monetary value.

### Cards & Lists
*   **Constraint:** Zero dividers. Use vertical spacing (`spacing-6`: 1.5rem) to separate list items.
*   **Recent Expenses:** Each item should sit on a `surface-container-low` background with a `xl` corner radius. Icons should be housed in a soft-tinted square (e.g., `primary-fixed-dim`) to provide a pop of color without breaking the minimalist aesthetic.

### Monetary Inputs
*   The Hebrew symbol (₪) must always be at least 120% of the size of the numerical input. It acts as a structural anchor for the layout.

---

## 6. Do's and Don'ts

### Do
*   **DO** use white space aggressively. If a screen feels "full," increase the spacing between groups.
*   **DO** use the `xl` (1.5rem) corner radius for all primary containers to maintain a friendly, modern touch.
*   **DO** ensure the ₪ symbol is prominent and bolded; it is the signature mark of the brand.

### Don't
*   **DON'T** use 100% opaque borders. They create "visual noise" that contradicts the Sanctuary philosophy.
*   **DON'T** use standard drop shadows. If it looks like a "default" shadow, it is too heavy.
*   **DON'T** use more than three different font sizes on a single card. Stick to a clear Headline/Body/Label hierarchy.