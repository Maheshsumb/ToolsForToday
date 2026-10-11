# Architecture

## Static application

Next.js App Router exports HTML, CSS, JavaScript, and local font files to out/. Cloudflare Pages Free is the intended host. Static export avoids server operations and supports free access without accounts, a database, or paid APIs. No deployment is configured in Stage 01.

Server Components may render at build time. Client Components will own interactive browser features. Browser APIs must be used in event handlers or effects, not during prerendering. Supported features include static routes, CSS, local assets, and dynamic routes with every path supplied by generateStaticParams. next/image has optimization disabled.

Runtime SSR, Server Actions, request-dependent route handlers, cookies(), runtime redirects/rewrites, ISR, and the default image optimizer are incompatible with this architecture. Do not introduce runtime API endpoints, authentication, databases, Workers, or Pages Functions. New routes must pass a static build.

## Future browser file processing

Files will be selected explicitly by the user and processed locally using browser APIs. Validate type and size, handle errors, release object URLs, and avoid storing file contents in logs or analytics. Consider Web Workers for expensive work and load processing libraries only on relevant tool routes. No file-processing libraries or tools are implemented yet.

## Directories

- src/app: route pages, root metadata, global tokens, and 404 page.
- src/components/layout: shared layout components when needed.
- src/components/ui: reusable interface components when needed.
- src/config: shared configuration when needed.
- src/lib: focused browser utilities when needed.
- src/types: shared types when needed.
- public/brand: approved logo assets, supplied separately.
- docs: project decisions, brand policy, and milestone scope.

Empty directories use .gitkeep only; no placeholder code modules are installed. Fonts are bundled from Fontsource packages and served from the same static host; font-display: swap and system fallbacks keep text readable. Current subsets are Latin; expand subsets when adding other languages.

Reference: https://nextjs.org/docs/app/guides/static-exports
