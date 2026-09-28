# Happy Birth Doula — website

## Change text or prices
1. Open **content.js** on GitHub → ✏️ Edit.
2. English is under `en:`, Russian under `ru:`. Change only the words inside "quotes".
3. **Commit changes**. The site updates in 1–2 minutes (check the Actions tab for the green tick).

Rules: keep quotes, commas and brackets; inside text use « » or ’ instead of a plain ".

## Common changes
| What | Where in content.js |
|---|---|
| Phone, WhatsApp, Telegram, Instagram, email, Calendly link | `settings` |
| Google review link | `settings` → `googleReview` |
| Visitor statistics | `settings` → `goatcounter` |
| Prices and services | `pregnancy`, `postnatal`, `children`, `adults` → `services` (both languages) |
| Reviews | `reviews` → `items` (`featured: true` shows it on the home page) |
| Questions & answers | `faq` → `items` |
| Google search titles | `meta` |
| Articles | bottom of the file → `articles` (copy a block, new `slug`, write the text) |

## Photos
Put photos in the `images` folder with these names (JPG):
`anna-round.jpg` (home, square), `anna-hero.jpg`, `anna-about.jpg` (about), `pregnancy.jpg`, `postnatal.jpg`, `children.jpg`, `adults.jpg`.

## Files
- `content.js`: all text (the only file you normally edit)
- `build.js`, `style.css`, `site.js`: design and build (don't edit)
