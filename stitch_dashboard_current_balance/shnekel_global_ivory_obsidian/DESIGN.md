# High-End Financial Design System: Editorial Precision

## 1. Overview & Creative North Star: "The Digital Private Bank"
This design system moves beyond the "fintech startup" aesthetic into the realm of high-end editorial finance. Our Creative North Star is **"The Digital Private Bank"**—a philosophy that treats financial data as a premium asset. 

We reject the cluttered, boxy grids of traditional banking. Instead, we utilize **intentional asymmetry, expansive breathing room, and tonal depth** to guide the user’s eye. The interface should feel like a bespoke financial broadsheet: authoritative, whisper-quiet, and meticulously curated. We use weight and scale (Lexend) for data-heavy moments and Swiss-style functionalism (Inter) for utility.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a sophisticated deep navy (`primary_container`: #131B2E) and grounded by a spectrum of architectural grays.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined through background color shifts or tonal transitions.
- Use `surface_container_low` (#F2F4F6) for the main page background.
- Use `surface_container_lowest` (#FFFFFF) for primary content modules.
- The contrast between these two tokens creates a "soft edge" that feels integrated, not "boxed in."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Base Layer:** `surface` (#F7F9FB).
- **Secondary Sectioning:** `surface_container` (#ECEEF0).
- **Interactive Elevated Cards:** `surface_container_lowest` (#FFFFFF).
- **Signature Accents:** Use `tertiary_container` (#002113) with `on_tertiary_container` (#009668) for positive financial growth indicators to provide a lush, "Emerald" success state.

### The "Glass & Gradient" Rule
To elevate the "Premium" feel, use **Glassmorphism** for floating action bars or navigation overlays. 
- **Recipe:** `surface_container_lowest` at 80% opacity + `backdrop-blur: 24px`.
- **Signature Texture:** For hero headers, use a subtle radial gradient transitioning from `primary_container` (#131B2E) to a slightly deeper `on_primary_fixed` (#131B2E) to add "soul" to the dark sections.

---

## 3. Typography: The Editorial Scale
We use a dual-font strategy to balance character with legibility.

*   **Display & Headlines (Lexend):** Used for large numbers, account balances, and section titles. Lexend’s geometric clarity provides a modern, "tech-forward" authority.
    *   *Headline-LG:* 2rem. Use for Page Titles.
    *   *Display-MD:* 2.75rem. Reserved for primary balance figures.
*   **Body & Labels (Inter):** Used for all functional text, descriptions, and data tables. Inter’s tall x-height ensures readability at small sizes.
    *   *Body-MD:* 0.875rem. The workhorse for transaction lists.
    *   *Label-SM:* 0.6875rem. Used for micro-data (timestamps, metadata).

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "cheap" for this system. We convey depth through light and tone.

*   **The Layering Principle:** Place a `surface_container_lowest` card atop a `surface_container_low` background. This creates a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** If an element must float (e.g., a Modal), use an ultra-diffused shadow:
    *   `box-shadow: 0 20px 40px rgba(19, 27, 46, 0.06);` (using a tinted version of `on_surface` rather than pure black).
*   **The Ghost Border Fallback:** If a divider is essential for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism Depth:** When using glass containers, a 1px "Ghost Border" at the top edge of the container helps simulate a light-catching glass rim.

---

## 5. Components
Our components prioritize white space and "The No-Line Rule."

*   **Primary Buttons:** High-contrast `primary_container` (#131B2E) with `on_primary` (#FFFFFF). Use `DEFAULT` (8px) roundness. 
*   **Secondary Buttons:** `secondary_container` (#D5E0F8) with `on_secondary_container`. No border.
*   **Input Fields:** Use `surface_container` as the background. On focus, transition to a `ghost-border` of `primary`. Use `label-md` for floating labels to maintain the editorial hierarchy.
*   **Cards & Lists:** **Prohibit dividers.** Separate transaction items using `8 (2rem)` spacing or a subtle hover state shift to `surface_container_highest`. 
*   **Financial Chips:** For "Success/Positive" trends, use `tertiary_fixed` (#6FFBBE) text on a `tertiary_container` (#002113) background. 
*   **Wealth Charts:** Avoid harsh lines. Use area charts with a gradient fill from `on_tertiary_container` (Emerald) to transparent.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use the `12 (3rem)` and `16 (4rem)` spacing tokens to create "Hero" breathing room around account balances.
*   **Do** use `Lexend` for all currency symbols and numbers.
*   **Do** lean into "Asymmetric Balance"—place a large display balance on the left and a small "view history" button on the far right without a containing box.

### Don't
*   **Don't** use 1px solid dividers between transaction list items. Use white space.
*   **Don't** use pure black (#000000) for text. Use `on_surface` (#191C1E) for better optical comfort.
*   **Don't** use "Alert Red" for minor negative trends. Reserve `error` (#BA1A1A) for critical system failures or depleted balances only. For standard negative trends, use a muted `on_surface_variant`.
*   **Don't** exceed `xl` (1.5rem) roundness. We want "Sophisticated Softness," not "Playful Bubbles."