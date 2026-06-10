# vendor/

Dropping ground for code copied in from sibling repos (yarova.ca, etc.).

## Expected drops from yarova.ca

| What | Where it should go after copy |
|---|---|
| Responsive layout shell (`Layout.astro` / `Base.astro` body) | `src/layouts/Base.astro` (replace the placeholder body) |
| Header / nav component | `src/components/SiteHeader.astro` |
| Footer component | `src/components/SiteFooter.astro` |
| Mobile nav drawer | `src/components/MobileNav.astro` (or `.svelte` if interactive) |
| Theme tokens (extend on top of `src/styles/tokens.css`) | `src/styles/tokens.css` (merge) |
| Tailwind config (if used) | `tailwind.config.ts` at project root |
| Any shared `Button`, `Card`, `Container` components | `src/components/` |

Drop them here first (so they're in git for tracking), then I'll move them
into place + wire them in. Or push them straight into the right paths and
delete this README.
