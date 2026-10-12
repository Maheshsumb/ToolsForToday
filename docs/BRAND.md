# ToolsForToday brand

Tagline: **Everyday Tools. One Simple Place.**
Domain: https://toolsfortoday.online

## Official palette

| Colour | Hex | Token |
| --- | --- | --- |
| Portland Orange | #F26136 | portland-orange |
| Princeton Orange | #F18033 | princeton-orange |
| Indian Yellow | #F1A951 | indian-yellow |
| Gold Crayola | #E8BA80 | gold-crayola |
| Medium Aquamarine | #66CDB0 | medium-aquamarine |
| Max Blue | #4AAFD5 | max-blue |
| Deep Navy | #16233F | deep-navy |
| Mist Gray | #E9EEF5 | mist-gray |
| White | #FFFFFF | white |

Tailwind v4 maps these official colour names in `src/app/globals.css`. Semantic tokens in the same file cover actions, text, surfaces, borders, focus, success, errors, and disabled states. Use navy on light brand colours and white. Do not assume white text on orange or other light palette colours meets contrast expectations. The primary button uses white on deep navy; orange is an accent and secondary-action border.

## Typography

Poppins 600 is used for headings. Inter 400, 500, and 600 support body text, labels, buttons, navigation, and forms. Font files are bundled locally with Fontsource. System sans-serif fallbacks are defined in CSS. Latin subsets are bundled; add suitable local subsets when other scripts are needed.

## Logo policy and locations

The approved logo contains the geometric multicolour T toolkit icon and curly orange script “For” between bold navy “Tools” and “Today”. Do not recreate, recolour, skew, or stretch the identity.

Optimized runtime assets live in `public/brand/`: a transparent horizontal logo for header/footer and a tightly cropped icon-only mark for compact placements on white. Original supplied PNGs are preserved under `docs/brand/source/`. The brand kit poster is documentation/reference material, not a standalone logo. Asset inventory and usage notes are in `public/brand/README.md`.
