# Design System Specification: Kinetic Precision

## 1. Overview & Creative North Star
The objective of this design system is to transform the traditional, utility-heavy elevator maintenance interface into an executive-grade command center. We are moving away from the cluttered, "legacy software" feel of the reference material and toward a philosophy we call **"Kinetic Precision."**

**The Creative North Star: Kinetic Precision**
This system treats data as a high-performance instrument. It breaks the "template" look by utilizing intentional asymmetry, high-contrast editorial typography, and sophisticated tonal layering. We prioritize "Atmospheric Efficiency"—where the interface feels light and breathable yet possesses an underlying gravity and authority. By replacing rigid borders with subtle depth and whitespace, we create a professional environment that feels less like a database and more like a curated dashboard.

## 2. Colors
This palette moves away from saturated industrial greens and blues toward a sophisticated neutral foundation punctuated by high-performance accents.

*   **Primary Identity:** The core of the system is `primary` (#0040df), a vibrant tech-blue that signifies intelligence and action. 
*   **The "No-Line" Rule:** To achieve a premium, editorial feel, designers are **strictly prohibited** from using 1px solid borders to section off the UI. Separation must be achieved through background color shifts. For example, a `surface_container_low` (#f1f4f7) side-panel should sit directly against a `background` (#f7fafd) workspace without a stroke.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers of fine material. 
    *   **Level 0 (Base):** `background` (#f7fafd)
    *   **Level 1 (Sections):** `surface_container_low` (#f1f4f7)
    *   **Level 2 (Cards/Modules):** `surface_container_lowest` (#ffffff)
    *   **Level 3 (Interactive/Active):** `surface_container_high` (#e5e8eb)
*   **The "Glass & Gradient" Rule:** For floating elements or critical CTAs, use a subtle gradient transitioning from `primary` (#0040df) to `primary_container` (#2d5bff). To add "soul" to the dashboard, incorporate Glassmorphism on overlays using a semi-transparent `surface` color with a 20px backdrop-blur.

## 3. Typography
We utilize **Inter** to provide a clean, Swiss-inspired structure. Typography is not just for reading; it is a spatial element that defines the layout's rhythm.

*   **Editorial Contrast:** Use `display-md` (2.75rem) for high-level KPIs (like "Active Jobs") to create a clear visual anchor. Pair this with `label-sm` (0.6875rem) in `on_surface_variant` (#434656) for metadata to create a sophisticated "Big/Small" contrast.
*   **Hierarchy as Authority:** 
    *   **Headlines:** Use `headline-sm` (1.5rem) for major module titles, ensuring they have significant `on_surface` (#181c1e) weight.
    *   **Body:** `body-md` (0.875rem) is the workhorse for technical data and logs, providing maximum legibility without crowding the layout.
    *   **Labels:** All caps `label-md` with +5% letter spacing should be used for status badges (e.g., "INVOICE READY") to evoke a professional, architectural feel.

## 4. Elevation & Depth
In this design system, depth is conveyed through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Rather than using a shadow to show a card, place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f1f4f7) background. The 12px (`md`) rounded corners will create a soft, natural lift.
*   **Ambient Shadows:** When an element must "float" (e.g., a dropdown or a critical modal), use a high-diffusion shadow.
    *   **Value:** 0px 12px 32px rgba(24, 28, 30, 0.06).
    *   The shadow must use a tinted version of `on_surface` rather than pure black to maintain a high-end, organic look.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a border, use a "Ghost Border": `outline_variant` (#c4c5d9) at 15% opacity. Never use a 100% opaque border.

## 5. Components

### Buttons
*   **Primary:** High-contrast `primary` (#0040df) background with `on_primary` (#ffffff) text. Use a 12px (`md`) corner radius. Apply a 2px "inner glow" via a subtle top-down gradient for a tactile, premium feel.
*   **Secondary:** `surface_container_highest` (#e0e3e6) background with `on_surface` text. These should feel like part of the surface, only becoming prominent on hover.

### Work Order Cards
Unlike the reference image which uses heavy color-coded headers, these cards use a "Quiet Header" approach.
*   **Structure:** Pure white `surface_container_lowest` (#ffffff) background. 
*   **The "Status Pillar":** Instead of a full-width colored bar, use a 4px thick vertical accent of `primary` or `tertiary` (#993100) on the far left edge of the card to indicate status. 
*   **Spacing:** Use generous 24px internal padding to allow the data to "breathe."

### Status Chips
*   **Visual Style:** Low-saturation backgrounds (e.g., `secondary_container`) with high-saturation text (`on_secondary_container`). 
*   **Rounding:** Use `full` (9999px) for chips to contrast against the 12px corners of the containers.

### Data Lists & Logs
*   **Separation:** Forbid the use of horizontal divider lines. Instead, use alternating background tints (`surface` vs `surface_container_low`) or simply 16px of vertical whitespace.
*   **Typography:** Use `body-sm` for secondary technical details to maintain a clean information density.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts where one column is significantly wider than the others to create a modern, editorial feel.
*   **Do** lean into `surface_container_lowest` (#ffffff) for primary content areas to maximize the feeling of cleanliness and "newness."
*   **Do** use `tertiary` (#993100) sparingly for alerts; its warm, earthy tone is more sophisticated than a standard "emergency red."

### Don'ts
*   **Don't** use 1px solid dividers. If you feel the need to separate two things, increase the margin or shift the background tone.
*   **Don't** use high-contrast drop shadows. If the shadow is easily visible, it's too dark. It should feel like "ambient light," not a "drop shadow."
*   **Don't** use "Alert Green" for success states. Use a muted version of the tech-blue or a subtle icon change to maintain the "Kinetic Precision" aesthetic.