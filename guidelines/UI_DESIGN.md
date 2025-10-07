# OnlyFHEn – UI Design System (Production Edition)

Name is configurable; "OnlyFHEn" is a placeholder. This document defines brand direction, palette, tokens, and usage
guidelines for a warm, engaging, privacy‑first creator patronage platform. It targets the existing Tailwind + shadcn
setup in `frontend/`.

## Brand Concept

- **Privacy‑first patronage**: Trustworthy, modern, secure with end-to-end encryption
- **Personality**: Bold, energetic, creator-focused, warm, and approachable
- **Visual feel**: Vibrant gradients, generous whitespace, playful depth, smooth animations, production-ready polish
- **Inspiration**: Tipeee/Patreon aesthetic with modern creator economy energy

## Core Palette (Hex)

**Current Active Palette (Earth Tones):**
- Primary (brand): `#003D29` (Pine Green)
- Secondary: `#0DAB0D` (Lime Green)
- Accent: `#FF7500` (Carrot Orange)
- Background: `#FFFADB` (White Argile - warm beige)
- Neutrals:
  - Surface: `#FFFFFF` (pure white for cards)
  - Border: `#d4cba4` (beige border)
  - Muted background: `#F5F0D0` (light beige)
  - Text strong: `#003D29` (Pine Green)
  - Text muted: `#4a6356` (muted green-gray)
- Functional:
  - Success: `#0DAB0D` (Lime Green)
  - Warning: `#FF7500` (Carrot Orange)
  - Error (destructive): `#d32f2f`
  - Info: `#0DAB0D` (Lime Green)
- Focus ring: `#0DAB0D` (Lime Green)
- Chart accents:
  - `#003D29`, `#0DAB0D`, `#FF7500`, `#4a6356`, `#8ab894`

**Previous Palette (Purple/Blue - Reference):**
- Primary (brand): `#635BFF`
- Secondary: `#00D4FF`
- Accent: `#FF6B6B`
- Neutrals:
  - Background: `#FFFFFF`
  - Surface: `#FAFAFA`
  - Border: `#E5E7EB`
  - Text strong: `#0B0F19`
  - Text muted: `#6B7280`
- Functional:
  - Success: `#16A34A`
  - Warning: `#F59E0B`
  - Error (destructive): `#DC2626`
  - Info: `#0EA5E9`
- Focus ring: `#5B8CFF` (accessible on white)
- Chart accents:
  - `#5B8CFF`, `#22C55E`, `#A855F7`, `#F97316`, `#06B6D4`

## Component Usage

- Primary: key CTAs (Register, Send Tip, Request Withdraw), main highlights, filled buttons.
- Secondary: supporting CTAs, chips/badges, subdued highlights.
- Accent: sparse emotional emphasis (celebrations, badges) — avoid for core actions.
- Neutrals: cards/sections; keep large canvas white for clarity.
- Functional: toasts, validation, banners; don’t mix with brand colors.

## Radii, Elevation, Motion

- **Radius**: 10px base (sm: 6px, lg: 14px, xl: 20px for hero cards)
- **Elevation** (enhanced with custom properties):
  - `--shadow-sm`: `0 2px 8px rgba(10,20,40,0.06)` - surface elements
  - `--shadow-md`: `0 8px 30px rgba(10,20,40,0.08)` - cards, modals
  - `--shadow-lg`: `0 12px 40px rgba(10,20,40,0.12)` - elevated cards on hover
  - `--shadow-xl`: `0 20px 50px rgba(10,20,40,0.15)` - modals, popovers
  - `--shadow-primary`: `0 12px 40px rgba(99,91,255,0.25)` - primary button hover
  - `--shadow-card-glow`: `0 8px 32px rgba(99,91,255,0.12)` - special card effects
- **Motion** (enhanced for production polish):
  - Transitions: 200-300ms ease-out for smoothness
  - Hover lift: `translateY(-0.5px)` to `translateY(-2px)` with scale effects
  - Active press: `scale(0.98)` for tactile feedback
  - Button hover: shadow expansion + slight lift
  - Card hover: lift + shadow + internal element transforms

## Typography

- **Family**: Inter (loaded via Tailwind config)
- **Sizes** (responsive, mobile→desktop):
  - **Hero H1**: 3xl→5xl→7xl (large, impactful headlines on landing)
  - **H1**: 2xl→3xl→4xl (page titles)
  - **H2**: xl→2xl→3xl (section headers)
  - **H3**: lg→xl (card titles, subsections)
  - **Body**: base→lg (primary content)
  - **Small**: sm→base (helper text, labels)
  - **Micro**: xs (captions, metadata)
- **Weight**:
  - Hero headlines: 900 (black) for maximum impact
  - Headings: 700 (bold) for hierarchy
  - Buttons: 600 (semibold) for confidence
  - Body: 400 (normal) / 500 (medium) for emphasis
- **Special effects**:
  - Gradient text: `bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent`
  - Drop shadows on large text for depth
  - Letter spacing: slightly tighter on display text (-0.02em)

## Iconography & Imagery

- **Icons**: Lucide React (installed via `lucide-react` package)
  - Style: Simple, rounded, consistent 2px stroke
  - Sizes: size-4 (16px), size-5 (20px), size-6 (24px)
  - Usage: Paired with text in buttons, labels, nav items for clarity
  - Common icons: UserPlus, Heart, Lock, Wallet, Coins, ArrowDownToLine, Shield, DollarSign
- **Imagery**:
  - Creator photos: Bright, positive, aspirational
  - Carousel cards: 3:4 portrait aspect ratio
  - Hover effects: scale(1.1) with smooth transitions
  - Overlays: Dark gradients (from-black/80 to transparent) for text legibility
  - Blur/saturation: Subtle desaturation (85%) on background imagery to keep CTAs prominent

## Accessibility

- Contrast: primary on white passes AA; use white for primary‑foreground.
- Focus: visible 2px ring with offset; never rely on color alone.
- States: pair color + icon + text (e.g., ✓ “Tip sent”).

## Design Tokens (Tailwind/shadcn)

**IMPORTANT: All styling MUST use CSS custom properties defined in `frontend/app/app.css`.** This allows changing the entire color scheme by editing a single file.

### Current Active Tokens (Earth Tone Theme)

```css
:root {
  /* Radii */
  --radius: 0.625rem; /* 10px */
  --radius-sm: 0.375rem; /* 6px */
  --radius-lg: 0.875rem; /* 14px */
  --radius-xl: 1.25rem; /* 20px */

  /* Base & text */
  --background: #FFFADB; /* White Argile */
  --foreground: #003D29; /* Pine Green */

  /* Surfaces */
  --card: #FFFFFF;
  --card-foreground: #003D29; /* Pine Green */
  --popover: #FFFFFF;
  --popover-foreground: #003D29; /* Pine Green */

  /* Brand */
  --primary: #003D29; /* Pine Green */
  --primary-foreground: #FFFADB; /* White Argile */
  --primary-hover: #002d1f; /* Darker Pine Green for hover */
  --primary-active: #001e15; /* Even darker for active */
  --secondary: #0DAB0D; /* Lime Green */
  --secondary-foreground: #FFFFFF;
  --secondary-hover: #0a8f0a; /* Darker Lime Green */
  --accent: #FF7500; /* Carrot Orange */
  --accent-foreground: #FFFFFF;

  /* Neutrals */
  --muted: #F5F0D0; /* Lighter beige */
  --muted-foreground: #4a6356; /* Muted green-gray */
  --border: #d4cba4; /* Beige border */
  --input: #F5F0D0; /* Light beige */
  --ring: #0DAB0D; /* Lime Green for focus rings */

  /* Functional */
  --destructive: #d32f2f;
  --destructive-foreground: #FFFFFF;
  --success: #0DAB0D; /* Lime Green */
  --success-foreground: #FFFFFF;
  --warning: #FF7500; /* Carrot Orange */
  --warning-foreground: #FFFFFF;
  --info: #0DAB0D; /* Lime Green */
  --info-foreground: #FFFFFF;

  /* Charts */
  --chart-1: #003D29; /* Pine Green */
  --chart-2: #0DAB0D; /* Lime Green */
  --chart-3: #FF7500; /* Carrot Orange */
  --chart-4: #4a6356; /* Muted green-gray */
  --chart-5: #8ab894; /* Light sage green */

  /* Sidebar */
  --sidebar: #FFFFFF;
  --sidebar-foreground: #003D29; /* Pine Green */
  --sidebar-primary: #003D29; /* Pine Green */
  --sidebar-primary-foreground: #FFFADB;
  --sidebar-accent: #0DAB0D; /* Lime Green */
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: #d4cba4; /* Beige border */
  --sidebar-ring: #0DAB0D; /* Lime Green */

  /* Gradients - reusable CSS custom properties */
  --gradient-hero: linear-gradient(135deg, #003D29 0%, #0DAB0D 50%, #FF7500 100%); /* Pine Green → Lime Green → Orange */
  --gradient-hero-subtle: linear-gradient(180deg, rgba(0, 61, 41, 0.08) 0%, rgba(13, 171, 13, 0.06) 100%);
  --gradient-radial-hero: radial-gradient(circle at 50% 30%, rgba(0, 61, 41, 0.12) 0%, transparent 50%);
  --gradient-primary-button: linear-gradient(to bottom right, #003D29, #002d1f);

  /* Enhanced shadows */
  --shadow-sm: 0 2px 8px rgba(0, 61, 41, 0.08);
  --shadow-md: 0 8px 30px rgba(0, 61, 41, 0.12);
  --shadow-lg: 0 12px 40px rgba(0, 61, 41, 0.15);
  --shadow-xl: 0 20px 50px rgba(0, 61, 41, 0.18);
  --shadow-primary: 0 12px 40px rgba(0, 61, 41, 0.25);
  --shadow-card-glow: 0 8px 32px rgba(13, 171, 13, 0.15);

  /* Page background washes - subtle color overlays */
  --bg-wash-primary: linear-gradient(to bottom right, rgba(0, 61, 41, 0.04) 0%, transparent 50%, rgba(13, 171, 13, 0.04) 100%);
  --bg-wash-secondary: linear-gradient(to bottom right, rgba(13, 171, 13, 0.05) 0%, transparent 100%);
  --bg-wash-accent: linear-gradient(to bottom right, rgba(255, 117, 0, 0.05) 0%, transparent 50%, rgba(0, 61, 41, 0.05) 100%);
}

.dark {
  --background: #001a12; /* Very dark green */
  --foreground: #FFFADB; /* White Argile */
  --card: #002d1f; /* Dark pine green */
  --card-foreground: #FFFADB;
  --popover: #002d1f;
  --popover-foreground: #FFFADB;
  --primary: #0DAB0D; /* Lime Green */
  --primary-foreground: #001a12;
  --secondary: #FF7500; /* Carrot Orange */
  --secondary-foreground: #FFFFFF;
  --muted: #1a3329; /* Dark muted green */
  --muted-foreground: #a8b8af; /* Light muted green */
  --accent: #FF7500; /* Carrot Orange */
  --accent-foreground: #FFFFFF;
  --destructive: #ef5350;
  --border: rgba(13, 171, 13, 0.2);
  --input: rgba(13, 171, 13, 0.15);
  --ring: #0DAB0D;
  --chart-1: #0DAB0D;
  --chart-2: #FF7500;
  --chart-3: #8ab894;
  --chart-4: #4a6356;
  --chart-5: #FFFADB;
  --sidebar: #002d1f;
  --sidebar-foreground: #FFFADB;
  --sidebar-primary: #0DAB0D;
  --sidebar-primary-foreground: #001a12;
  --sidebar-accent: #FF7500;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: rgba(13, 171, 13, 0.2);
  --sidebar-ring: #0DAB0D;
}
```

### Utility Classes for Gradients

Use these utility classes instead of hardcoded gradient values:

```css
@layer utilities {
  .bg-gradient-hero {
    background: var(--gradient-hero);
  }
}
```

Optional: expose `--success`, `--warning`, `--info` via utility classes or component tokens (shadcn has `destructive` by
default). Example usage in Tailwind:

```tsx
<span className="text-[color:var(--success)]">Tip sent</span>
<div className="border border-[color:var(--warning)] bg-[oklch(0.97_0.03_80)]">Pending</div>
<Button className="ring-2 ring-[color:var(--ring)]">Focus</Button>
```

## Landing Page Design (Updated - Tipeee-Inspired)

### Hero Section - Bold & Colorful

The landing page hero is designed for maximum impact and energy:

**Background Treatment:**

- **Vibrant gradient**: `bg-gradient-to-br from-[#635BFF] via-[#7B73FF] to-[#00D4FF]`
- **Full-width colored section** with white text for dramatic contrast
- **Decorative elements**:
  - Floating blur circles (`size-32` and `size-40` with `blur-3xl`)
  - Large decorative icons (Sparkles, Heart) at low opacity (20%)
- **Wave divider** at bottom using SVG path for smooth transition to white content

**Typography & Content:**

- **Hero headline**:
  - Size: `text-5xl sm:text-6xl md:text-7xl lg:text-8xl`
  - Weight: `font-black` (900) for maximum impact
  - Color: White text on colored background
  - Decorative elements: Underline SVG on key words, animated heart icon
- **Subheadline**: `text-xl md:text-2xl lg:text-3xl` with privacy messaging
- **Privacy badge**: White/20 backdrop-blur with lock icon and encryption message

**CTA Buttons:**

- **Primary (Creator)**: White background with primary text
  - `bg-white text-primary hover:bg-white/90`
  - Large size: `h-14 px-8 text-lg`
  - Icons: UserPlus for creator registration
- **Secondary (Supporter)**: Semi-transparent dark
  - `bg-black/30 backdrop-blur-sm text-white border-white/30`
  - Hover: `hover:bg-black/40`

### Creator Carousel Section

Below the hero, a clean white section showcasing featured creators:

**Layout:**

- **Section spacing**: `py-16 md:py-24` for generous whitespace
- **Centered header**: Large title + descriptive subtitle
- **Carousel**: shadcn carousel component with responsive breakpoints
  - Mobile: 1 card
  - md: 2 cards (basis-1/2)
  - lg: 3 cards (basis-1/3)
  - xl: 4 cards (basis-1/4)

**Creator Cards:**

- **Aspect ratio**: 3:4 portrait for creator photos
- **Base state**: Gradient card with border and shadow
- **Hover effects** (layered transitions):
  1. Image scales to 110% (500ms transform)
  2. Dark gradient overlay fades in (from-black/80)
  3. Card lifts with `-translate-y-2`
  4. Shadow intensifies (shadow-md → shadow-lg)
  5. "Soutenir" button fades in at center
  6. Creator info slides up (`translate-y-2` → `translate-y-0`)
- **Content**: Creator name, category badge, support button overlay

**Navigation:**

- Previous/Next arrows: Hidden on mobile, visible on md+
- Positioned outside carousel (`-left-12`, `-right-12`)
- Styled with white background and subtle shadows

**Call to Action:**

- "Discover all creators" button centered below carousel
- Large outline button linking to browse page

## States

- Hover: +2 elevation, 2–3% color deepen.
- Focus: 2px solid `--ring` with offset.
- Disabled: 50% opacity, no shadow, no pointer events.
- Loading: use primary spinner; maintain width to avoid layout shift.

## Component Library (Enhanced)

### Button Component (`~/components/ui/button.tsx`)

Enhanced with gradient variant and improved hover states:

**Variants:**

- `default`: Gradient primary button with shadow
  - `bg-[image:var(--gradient-primary-button)]`
  - Hover: `shadow-[var(--shadow-primary)] hover:-translate-y-0.5`
- `secondary`: Subtle secondary with border
  - `bg-secondary/10 border-secondary/20`
  - Hover: `bg-secondary/20 border-secondary/30`
- `outline`: Border style with hover fill
  - Hover: `hover:bg-muted hover:border-primary/40`
- `ghost`: Transparent with hover background
- `link`: Text-style link button
- `success`: Green variant for positive actions
- `warning`: Amber variant for caution

**Sizes:**

- `sm`: `h-8 px-3 text-xs` - compact actions
- `default`: `h-9 px-4` - standard buttons
- `lg`: `h-12 px-8 text-base` - hero CTAs, prominent actions
- `icon`: Square icon-only buttons

**Features:**

- Active press: `active:scale-[0.98]` for tactile feedback
- Smooth transitions: `transition-all duration-200`
- Icon support: Automatic spacing with Lucide icons

### Card Component (`~/components/ui/card.tsx`)

Enhanced with variant system for different contexts:

**Variants:**

- `default`: Clean card with subtle shadow
  - `bg-card border border-border/60 shadow-[var(--shadow-sm)]`
- `gradient`: Gradient background with depth
  - `bg-gradient-to-br from-white to-muted/30`
  - Hover: `hover:shadow-[var(--shadow-lg)] transition-shadow duration-300`
- `elevated`: Accent border with lift on hover
  - `border-t-4 border-t-primary`
  - Hover: `hover:-translate-y-1 transition-all duration-300`

**Subcomponents:**

- `CardHeader`: Icon + title layout support
- `CardTitle`: Semibold, responsive sizing
- `CardDescription`: Muted foreground text
- `CardContent`: Consistent padding
- `CardFooter`: Actions area with border-top option

### Input Component (`~/components/ui/input.tsx`)

Enhanced for better UX:

**Styling:**

- Base: `h-10 rounded-lg bg-muted/30 px-4 shadow-inner`
- Focus: `focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:bg-background`
- Hover: `hover:border-border/80`

### Badge Component (`~/components/ui/badge.tsx`)

Versatile for status, categories, metadata:

**Usage patterns:**

- Privacy indicators: `bg-primary/10 text-primary border-primary/20`
- Status badges: Use success/warning/info colors
- Category tags: Creator categories, content types

### Container Components (`~/components/ui/container.tsx`)

Reusable layout containers:

**PageContainer:**

- Props: `variant?: "default" | "primary" | "secondary" | "accent"`
- Applies background wash based on variant
- Consistent padding: `py-12 md:py-20`

**SectionContainer:**

- Props: `maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"`
- Centers content with responsive max-width
- Container padding: `px-4`

### Navbar Component (`~/components/navbar.tsx`)

Production-ready navigation:

**Features:**

- Logo with gradient background (`bg-gradient-to-br from-primary to-secondary`)
- Icon-paired navigation links
- Active state: `bg-primary/10 text-primary px-3 py-1.5 rounded-lg`
- Token balance pill with gradient background
- Network indicator with colored dot (green=localhost, blue=sepolia)

**Backdrop:**

- `bg-background/80 backdrop-blur-md shadow-sm`

## Form Pages Pattern

### Register Page (`~/routes/register.tsx`)

Two-column layout with benefits sidebar:

**Main Form Card:**

- Variant: `gradient`
- Icon header with UserPlus
- Full-width submit button
- Success/error alerts with appropriate colors

**Benefits Sidebar:**

- Elevated card variant
- Icon + text feature list
- Success card appears after registration
- Call-to-action to view balance

### Form Page Guidelines

Apply these patterns to Tip, Withdraw, Balance pages:

1. **Use PageContainer** with appropriate variant
2. **Card headers** with icons for visual hierarchy
3. **Labels with icons** for input fields
4. **Helper text** below inputs (text-xs text-muted-foreground)
5. **Status alerts** with conditional styling (success/error)
6. **Transaction links** styled as primary underlined text
7. **Loading states** disable buttons with appropriate text

## CSS Variable Architecture & Best Practices

### Core Principle: Single Source of Truth

**All colors, gradients, and shadows MUST be defined as CSS custom properties in `frontend/app/app.css`.** This enables:
- Theme switching by editing one file
- Consistent design system across entire app
- Easy color palette updates
- Dark mode support

### How to Use CSS Variables in Components

#### ✅ CORRECT - Using CSS Variables

```tsx
// Use Tailwind utilities that reference CSS variables
<div className="bg-primary text-primary-foreground" />
<Button className="bg-secondary hover:bg-secondary-hover" />
<section className="bg-gradient-hero" /> {/* Custom utility class */}

// Direct CSS variable reference when needed
<div style={{ boxShadow: 'var(--shadow-lg)' }} />
<Card className="shadow-[var(--shadow-md)]" />
```

#### ❌ INCORRECT - Hardcoded Colors

```tsx
// Never hardcode hex values in components
<div className="bg-[#635BFF]" /> // NO!
<section className="bg-gradient-to-br from-[#635BFF] to-[#00D4FF]" /> // NO!

// Don't use arbitrary RGB values
<div className="bg-[rgb(99,91,255)]" /> // NO!
```

### Variable Reference Guide

All available CSS variables are defined in `frontend/app/app.css:67-146`. Key categories:

#### Brand Colors
- `--primary` / `--primary-foreground` / `--primary-hover` / `--primary-active`
- `--secondary` / `--secondary-foreground` / `--secondary-hover`
- `--accent` / `--accent-foreground`

#### Backgrounds & Surfaces
- `--background` (page background)
- `--card` / `--card-foreground` (card surfaces)
- `--muted` / `--muted-foreground` (subdued backgrounds)

#### Borders & Inputs
- `--border` (all border colors)
- `--input` (input backgrounds)
- `--ring` (focus ring colors)

#### Functional Colors
- `--destructive` / `--destructive-foreground`
- `--success` / `--success-foreground`
- `--warning` / `--warning-foreground`
- `--info` / `--info-foreground`

#### Gradients
- `--gradient-hero` (hero section backgrounds)
- `--gradient-hero-subtle` (subtle overlays)
- `--gradient-radial-hero` (radial effects)
- `--gradient-primary-button` (button gradients)

#### Shadows
- `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-xl`
- `--shadow-primary` (colored shadows)
- `--shadow-card-glow` (special effects)

#### Background Washes
- `--bg-wash-primary` / `--bg-wash-secondary` / `--bg-wash-accent`

### Creating New Gradient Utility Classes

When adding new gradients, follow this pattern in `frontend/app/app.css`:

```css
/* 1. Define the gradient as a CSS variable in :root */
:root {
  --gradient-cta: linear-gradient(to right, var(--primary), var(--secondary));
}

/* 2. Create a utility class in @layer utilities */
@layer utilities {
  .bg-gradient-cta {
    background: var(--gradient-cta);
  }
}
```

Then use in components:
```tsx
<div className="bg-gradient-cta" />
```

### Changing the Color Scheme

To switch color palettes (e.g., from purple/blue to earth tones):

1. **Edit `frontend/app/app.css:67-146`** - Update all CSS variables in `:root`
2. **That's it!** All components automatically use the new colors
3. **Optional**: Update dark mode tokens in `.dark` selector if needed

### Implementation Notes

- All design tokens live in `frontend/app/app.css :root`
- Components use CSS custom properties via Tailwind (`var(--token-name)`)
- Lucide React icons installed: `bun add lucide-react`
- Shadcn components: Badge, Carousel installed and customized
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

## Accessibility Checklist

- ✅ Color contrast meets WCAG AA (primary on white, white on primary)
- ✅ Focus states visible with ring (2px primary/20 opacity)
- ✅ Icons paired with text labels
- ✅ Semantic HTML (nav, section, main, header)
- ✅ Hover states don't rely on color alone (lift + shadow changes)
- ✅ Button states communicate through multiple channels (color + icon + text)

## Future Extensions

- **Dark theme**: Mirror tokens with adjusted chroma, invert gradients
- **Internationalization**: Replace French text with i18n keys
- **Animation library**: Consider Framer Motion for complex interactions
- **Storybook**: Document components with interactive examples
