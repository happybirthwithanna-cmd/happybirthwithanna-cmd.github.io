/* Builds the finished website into _site/ (English at /, Russian at /ru/).
   Runs automatically on GitHub after every change. You don't need to edit this file.
   Local preview:  node build.js preview   (links end in .html so files open directly) */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PREVIEW = process.argv[2] === "preview";
const OUT = path.join(ROOT, PREVIEW ? "_preview" : "_site");

const win = {};
new Function("window", fs.readFileSync(path.join(ROOT, "content.js"), "utf8"))(win);
const SITE = win.SITE, S = SITE.settings, D = S.domain;

const PAGES = ["home", "pregnancy", "postnatal", "children", "adults", "mentoring", "about", "team", "reviews", "payment", "contact"];
const NAV = ["pregnancy", "postnatal", "children", "adults", "mentoring", "about", "reviews", "articles", "contact"];
const PARTNERS = SITE.partners || [];
const ARTICLES = SITE.articles || [];
const LANDINGS = SITE.landings || [];
const landIn = (lang) => LANDINGS.filter((l) => l[lang]);
const artIn = (lang) => ARTICLES.filter((a) => a[lang]);
const slug = (p) => (p === "home" ? "" : p);
const VER = Date.now().toString(36);

/* ---------- helpers ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const absUrl = (lang, p) => D + (lang === "ru" ? "/ru/" : "/") + slug(p);
// link from a page in `fromLang` to page `p` in `lang`
function href(fromLang, lang, p) {
  if (!PREVIEW) return (lang === "ru" ? "/ru/" : "/") + slug(p);
  let prefix = "";
  if (fromLang === "ru" && lang === "en") prefix = "../";
  if (fromLang === "en" && lang === "ru") prefix = "ru/";
  return prefix + (p === "home" ? "index.html" : p + ".html");
}
const asset = (lang, f) => (PREVIEW ? (lang === "ru" ? "../" : "") + f : "/" + f);
const wa = () => "https://wa.me/" + S.whatsapp;
const tg = () => "https://t.me/" + S.telegram;

function img(lang, name, alt, cls) {
  const jpg = path.join(ROOT, "images", name + ".jpg");
  if (fs.existsSync(jpg)) {
    const webp = fs.existsSync(path.join(ROOT, "images", name + ".webp"));
    return `<picture class="${cls}">${webp ? `<source srcset="${asset(lang, "images/" + name + ".webp")}" type="image/webp">` : ""}<img src="${asset(lang, "images/" + name + ".jpg")}" alt="${esc(alt)}" loading="lazy" width="900" height="1125"></picture>`;
  }
  return `<div class="${cls} ph" role="img" aria-label="${esc(alt)}"><span></span></div>`;
}

/* ---------- shared pieces ---------- */
function header(lang, page, alts = ["en", "ru"]) {
  const T = SITE[lang], other = lang === "en" ? "ru" : "en", otherPage = alts.includes(other) ? page : "home";
  const links = NAV.map((p) => `<a href="${href(lang, lang, p)}"${p === page ? ' aria-current="page"' : ""}>${esc(T.nav[p])}</a>`).join("");
  return `<a class="skip" href="#main">${esc(T.ui.skip)}</a>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="${href(lang, lang, "home")}"><img class="brand-mark" src="${asset(lang, "images/logo-mark-128.png")}" alt="" width="46" height="43"><span class="brand-txt"><span class="brand-name">Happy Birth <i>with Anna</i></span><span class="brand-sub">${esc(T.ui.brandSub)}</span></span></a>
    <nav class="nav" id="nav" aria-label="Main">${links}</nav>
    <a class="lang" href="${href(lang, other, otherPage)}" hreflang="${other}" lang="${other}">${other.toUpperCase()}</a>
    <a class="btn btn-clay btn-sm hide-sm" href="${S.calendly}" target="_blank" rel="noopener">${esc(T.ui.bookShort)}</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">${esc(T.ui.menu)}</button>
  </div>
</header>`;
}

function footer(lang) {
  const T = SITE[lang];
  const ex = ["pregnancy", "postnatal", "children", "adults", "mentoring", "about", "team", "reviews", "articles", "payment", "contact"].map((p) => `<li><a href="${href(lang, lang, p)}">${esc(T.nav[p])}</a></li>`).join("");
  const land = landIn(lang).map((l) => `<li><a href="${href(lang, lang, l.slug)}">${esc(l[lang].h1)}</a></li>`).join("");
  return `<div class="rebozo" aria-hidden="true"></div>
<footer class="foot">
  <div class="wrap foot-grid">
    <div><img src="${asset(lang, "images/logo-full.png")}" alt="Happy Birth with Anna" width="160" height="194" class="foot-logo" loading="lazy"><p class="muted">${esc(T.ui.footerAbout)}</p></div>
    <div><p class="foot-h">${esc(T.ui.footerExplore)}</p><ul class="foot-list">${ex}</ul></div>
    <div><p class="foot-h">${lang === "ru" ? "Услуги по районам" : "Doula services"}</p><ul class="foot-list">${land}</ul></div>
    <div><p class="foot-h">${esc(T.ui.footerContact)}</p><ul class="foot-list">
      <li><a href="tel:${S.phone.replace(/\s/g, "")}">${esc(S.phone)}</a></li>
      <li><a href="mailto:${S.email}">${esc(S.email)}</a></li>
      <li><a href="${wa()}" target="_blank" rel="noopener">WhatsApp</a> · <a href="${tg()}" target="_blank" rel="noopener">Telegram</a> · <a href="https://www.instagram.com/${S.instagram}/" target="_blank" rel="noopener">Instagram</a></li>
      <li class="muted">${esc(S.town)} ${esc(S.postcode)}</li></ul></div>
  </div>
  <div class="wrap small muted">© ${new Date().getFullYear()} ${esc(T.ui.rights)}</div>
</footer>`;
}

function partnersBand(lang) {
  if (!PARTNERS.length) return "";
  const T = SITE[lang];
  const items = PARTNERS.map((p) => {
    const hasLogo = p.logo && fs.existsSync(path.join(ROOT, "images", p.logo));
    const mark = hasLogo
      ? `<img class="pt-logo" src="${asset(lang, "images/" + p.logo)}" alt="${esc(p.name)}" loading="lazy">`
      : `<span class="pt-name">${esc(p.name)}</span>`;
    return `<li class="pt"><a href="${p.url}" target="_blank" rel="noopener">${mark}<span class="pt-text">${esc(p[lang] || "")}</span></a></li>`;
  }).join("");
  return `<section class="sec sand"><div class="wrap">
  <h2>${esc(T.ui.partnersTitle)}</h2><p class="lead-sm">${esc(T.ui.partnersLead)}</p>
  <ul class="partners">${items}</ul>
</div></section>`;
}

function ctaBand(lang, title, text) {
  const T = SITE[lang];
  return `<section class="cta-band"><div class="wrap cta-inner">
  <div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
  <div class="cta-btns"><a class="btn btn-cream" href="${S.calendly}" target="_blank" rel="noopener">${esc(T.ui.book)}</a>
  <a class="btn btn-ghost-light" href="${wa()}" target="_blank" rel="noopener">${esc(T.ui.whatsapp)}</a>
  <a class="btn btn-ghost-light" href="${tg()}" target="_blank" rel="noopener">${esc(T.ui.telegram)}</a></div>
</div></section>`;
}

function pageHead(lang, P, photoName) {
  return `<section class="page-head"><div class="wrap ph-grid">
  <div><p class="eyebrow">${esc(P.eyebrow)}</p><h1>${esc(P.h1)}</h1><p class="lead">${esc(P.lead)}</p></div>
  ${photoName && fs.existsSync(path.join(ROOT, "images", photoName + ".jpg")) ? img(lang, photoName, P.h1, "arch arch-sm") : ""}
</div></section>`;
}

function stats(list, cls) {
  return `<ul class="stats ${cls || ""}">${list.map((s) => `<li><b>${esc(s.num)}</b><span>${esc(s.text)}</span></li>`).join("")}</ul>`;
}

function serviceCards(lang, list) {
  const T = SITE[lang];
  return `<div class="svc-grid">${list.map((s) => `
  <article class="svc${s.highlight ? " svc-hl" : ""}">
    <p class="tag">${esc(s.tag)}</p>
    <h3>${esc(s.name)}</h3>
    <p class="price">${esc(s.price || T.ui.priceOnRequest)}</p>
    ${s.who && s.who.length ? `<p class="lbl">${esc(T.ui.whoFor)}</p><ul class="dots">${s.who.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${s.includes && s.includes.length ? `<p class="lbl">${esc(T.ui.includes)}</p><ul class="ticks">${s.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    <div class="svc-foot"><a class="btn btn-clay btn-sm" href="${s.clinic ? S.clinic : S.calendly}" target="_blank" rel="noopener">${esc(s.clinic ? T.ui.bookClinic : T.ui.bookService)}</a></div>
  </article>`).join("")}</div>`;
}

function faqBlock(lang) {
  const F = SITE[lang].faq;
  return `<section class="sec"><div class="wrap narrow"><h2>${esc(F.title)}</h2><div class="faq">${F.items.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div></div></section>`;
}

function reviewCards(lang, items) {
  return `<div class="rev-grid">${items.map((r) => `<figure class="rev${r.featured ? " rev-big" : ""}"><blockquote>${esc(r.text)}</blockquote><figcaption><b>${esc(r.name)}</b><span>${esc(r.context || "")}</span></figcaption></figure>`).join("")}</div>`;
}

/* ---------- articles ---------- */
function articleBody(lines) {
  let out = "", list = [];
  const flush = () => { if (list.length) { out += `<ul class="dots art-list">${list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`; list = []; } };
  for (const l of lines) {
    if (l.startsWith("- ")) { list.push(l.slice(2)); continue; }
    flush();
    out += l.startsWith("## ") ? `<h2>${esc(l.slice(3))}</h2>` : `<p>${esc(l)}</p>`;
  }
  flush();
  return out;
}
const fmtDate = (lang, d) => new Date(d + "T12:00:00Z").toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
function articleCards(lang, list) {
  return `<div class="art-grid">${list.map((a) => `<a class="art-card" href="${href(lang, lang, a.slug)}"><span class="art-date">${esc(fmtDate(lang, a.date))}</span><h3>${esc(a[lang].title)}</h3><p>${esc(a[lang].description)}</p><span class="more">${esc(SITE[lang].ui.readMore)} →</span></a>`).join("")}</div>`;
}
function articlesIndex(lang) {
  const P = SITE[lang].articlesPage;
  return `<section class="page-head"><div class="wrap"><p class="eyebrow">${esc(P.eyebrow)}</p><h1>${esc(P.h1)}</h1><p class="lead">${esc(P.lead)}</p></div></section>
<section class="sec"><div class="wrap">${articleCards(lang, artIn(lang))}</div></section>
${ctaBand(lang, SITE[lang].home.ctaTitle, SITE[lang].home.ctaText)}`;
}
function articlePage(lang, a) {
  const A = a[lang], T = SITE[lang];
  const others = artIn(lang).filter((x) => x.slug !== a.slug);
  return `<article class="sec article"><div class="wrap narrow">
  <p class="eyebrow"><a href="${href(lang, lang, "articles")}">${esc(T.nav.articles)}</a> · ${esc(fmtDate(lang, a.date))}</p>
  <h1>${esc(A.title)}</h1>
  <p class="lead">${esc(A.description)}</p>
  <div class="art-body">${articleBody(A.body)}</div>
  <div class="art-author">${fs.existsSync(path.join(ROOT, "images", "anna-round.jpg")) ? `<img src="${asset(lang, "images/anna-round.jpg")}" alt="Anna Pifko" width="64" height="64" loading="lazy">` : ""}<p><b>Anna Pifko</b><br><span class="muted">${esc(T.home.eyebrow)}</span></p></div>
</div></article>
${others.length ? `<section class="sec sand"><div class="wrap"><h2>${esc(T.nav.articles)}</h2>${articleCards(lang, others)}</div></section>` : ""}
${ctaBand(lang, T.home.ctaTitle, T.home.ctaText)}`;
}

function landingPage(lang, L) {
  const D = L[lang], T = SITE[lang];
  const li = (a) => a.map((x) => `<li>${esc(x)}</li>`).join("");
  const others = landIn(lang).filter((x) => x.slug !== L.slug);
  return `<section class="page-head"><div class="wrap"><h1>${esc(D.h1)}</h1><p class="lead">${esc(D.lead)}</p></div></section>
<section class="sec"><div class="wrap narrow story">${D.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>
<section class="sec sand"><div class="wrap two">
  <div><h2>${esc(D.forWhoTitle)}</h2><ul class="ticks big">${li(D.forWho)}</ul></div>
  <div><h2>${esc(D.coversTitle)}</h2><ul class="ticks">${li(D.covers)}</ul></div>
</div></section>
<section class="sec"><div class="wrap narrow"><h2>${esc(D.howTitle)}</h2>${D.how.map((p) => `<p>${esc(p)}</p>`).join("")}
<h2>${esc(D.priceTitle)}</h2><p>${esc(D.priceText)}</p>
<h2>${lang === "ru" ? "Частые вопросы" : "Common questions"}</h2>
<div class="faq">${D.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
${others.length ? `<p class="more-link">${others.map((o) => `<a href="${href(lang, lang, o.slug)}">${esc(o[lang].h1)}</a>`).join(" · ")}</p>` : ""}
</div></section>
${ctaBand(lang, D.ctaTitle, D.ctaText)}`;
}

/* ---------- page bodies ---------- */
const BODY = {
  home(lang) {
    const T = SITE[lang], H = T.home;
    const round = fs.existsSync(path.join(ROOT, "images", "anna-round.jpg")) ? `<picture class="round">${fs.existsSync(path.join(ROOT, "images", "anna-round.webp")) ? `<source srcset="${asset(lang, "images/anna-round.webp")}" type="image/webp">` : ""}<img src="${asset(lang, "images/anna-round.jpg")}" alt="${esc(H.photoAlt)}" width="220" height="220" fetchpriority="high"></picture>` : "";
    return `<section class="intro"><div class="wrap intro-in">
    ${round}
    <p class="intro-name">Anna Pifko</p>
    <p class="tagline">${esc(H.tagline)}</p>
    <h1>${esc(H.h1)}</h1>
    <p class="lead">${esc(H.lead)}</p>
    <h2 class="choose-h">${esc(H.chooseTitle)}</h2>
    <p class="choose-group">${esc(H.chooseParentTitle)}</p>
    <ul class="choose">${H.choose.map((c) => `<li><a href="${href(lang, lang, c.page)}">${esc(c.text)}<span aria-hidden="true">›</span></a></li>`).join("")}</ul>
    <p class="choose-group second">${esc(H.chooseProTitle)}</p>
    <ul class="choose"><li><a class="choose-pro" href="${href(lang, lang, "mentoring")}"><span><b>${esc(H.chooseProLink)}</b><em>${esc(H.chooseProText)}</em></span><span aria-hidden="true">›</span></a></li></ul>
    <div class="btns"><a class="btn btn-clay" href="${S.calendly}" target="_blank" rel="noopener">${esc(T.ui.book)}</a><a class="btn btn-line" href="${wa()}" target="_blank" rel="noopener">${esc(T.ui.whatsapp)}</a></div>
    <ul class="trust">${H.trust.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
</div></section>
<div class="dot-line" aria-hidden="true"><span></span></div>

<section class="sec"><div class="wrap two">
  <div><h2>${esc(H.whoTitle)}</h2><p class="muted">${esc(H.whoLead)}</p><ul class="ticks big">${H.who.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  <div><h2>${esc(H.doesTitle)}</h2><div class="does">${H.does.map((d) => `<div><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></div>`).join("")}</div></div>
</div></section>

<section class="sec exp"><div class="wrap narrow center">
  <h2>${esc(H.experienceTitle)}</h2>
  <p class="lead-sm">${esc(H.experienceLead)}</p>
  <ul class="exp-list">${H.experienceItems.map((x) => `<li><b>${esc(x.num)}</b><span>${esc(x.text)}</span></li>`).join("")}</ul>
</div></section>

<section class="sec philo"><div class="wrap narrow">
  <h2>${esc(H.philosophyTitle)}</h2>
  ${H.philosophy.map((p) => `<p>${esc(p)}</p>`).join("")}
</div></section>

<section class="sec sand"><div class="wrap">
  <h2>${esc(H.servicesTitle)}</h2>
  <div class="cards4">${H.services.map((s) => `<a class="card-link" href="${href(lang, lang, s.page)}"><span class="from">${esc(s.from)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><span class="more">${esc(T.ui.readMore)} →</span></a>`).join("")}</div>
</div></section>

<section class="sec"><div class="wrap two">
  <div><h2>${esc(H.researchTitle)}</h2>${stats(H.research)}<p class="small muted">${esc(H.researchSource)}</p></div>
  <div><h2>${esc(H.ownTitle)}</h2>${stats(H.own, "stats-sage")}</div>
</div></section>

<section class="photoband"${fs.existsSync(path.join(ROOT, "images", "sunflowers.jpg")) ? ` style="background-image:url('${asset(lang, "images/sunflowers.jpg")}')"` : ""} role="img" aria-label="${esc(H.photoAlt)}"></section>
<section class="sec"><div class="wrap narrow story"><h2>${esc(H.storyTitle)}</h2>${H.story.map((p) => `<p>${esc(p)}</p>`).join("")}<p class="more-link"><a href="${href(lang, lang, "about")}">${esc(T.ui.readMore)} →</a></p></div></section>

<section class="sec"><div class="wrap"><h2>${esc(H.reviewsTitle)}</h2>${reviewCards(lang, T.reviews.items.filter((r) => r.featured))}
<p class="more-link"><a href="${href(lang, lang, "reviews")}">${esc(T.ui.allReviews)} →</a></p></div></section>

<section class="sec sand"><div class="wrap"><h2>${esc(H.areasTitle)}</h2><p class="lead-sm">${esc(H.areasLead)}</p>
<div class="areas">${H.areasGroups.map((a) => `<div><h3>${esc(a.title)}</h3><p>${esc(a.places)}</p></div>`).join("")}</div></div></section>

${artIn(lang).length ? `<section class="sec"><div class="wrap"><h2>${esc(T.nav.articles)}</h2>${articleCards(lang, artIn(lang))}</div></section>` : ""}
${partnersBand(lang)}
${faqBlock(lang)}
${ctaBand(lang, H.ctaTitle, H.ctaText)}`;
  },

  pregnancy(lang) {
    const T = SITE[lang], P = T.pregnancy;
    return `${pageHead(lang, P, "pregnancy")}
<section class="sec tight"><div class="wrap">${stats(P.stats, "stats-row")}</div></section>
<section class="sec"><div class="wrap"><h2>${esc(P.servicesTitle)}</h2>${serviceCards(lang, P.services)}${P.carrotNote ? `<p class="small muted note-under carrot">${esc(P.carrotNote)}</p>` : ""}</div></section>
<section class="sec sand"><div class="wrap narrow"><h2>${esc(P.curriculumTitle)}</h2><ul class="ticks cols2">${P.curriculum.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></section>
${ctaBand(lang, P.ctaTitle, P.ctaText)}`;
  },

  postnatal(lang) {
    const T = SITE[lang], P = T.postnatal;
    return `${pageHead(lang, P, "postnatal")}
<section class="sec tight"><div class="wrap">${stats(P.stats, "stats-row")}<p class="small muted note-under">${esc(P.statsNote)}</p></div></section>
<section class="sec"><div class="wrap"><h2>${esc(P.servicesTitle)}</h2>${serviceCards(lang, P.services)}</div></section>
<section class="sec sand"><div class="wrap two">
  <div><h2>${esc(P.moreTitle)}</h2>${P.more.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <div><h3>${esc(P.alsoTitle)}</h3><ul class="ticks">${P.also.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
</div></section>
${ctaBand(lang, P.ctaTitle, P.ctaText)}`;
  },

  children(lang) {
    const T = SITE[lang], P = T.children;
    return `${pageHead(lang, P, "children")}
<section class="sec"><div class="wrap"><h2>${esc(P.servicesTitle)}</h2>${serviceCards(lang, P.services)}</div></section>
<section class="sec sand"><div class="wrap two">
  <div><h2>${esc(P.whyTitle)}</h2>${P.why.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <div><h2>${esc(P.slingTitle)}</h2><ul class="ticks">${P.sling.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
</div></section>
${ctaBand(lang, P.ctaTitle, P.ctaText)}`;
  },

  adults(lang) {
    const T = SITE[lang], P = T.adults;
    return `${pageHead(lang, P, "adults")}
<section class="sec"><div class="wrap"><h2>${esc(P.servicesTitle)}</h2>${serviceCards(lang, P.services)}</div></section>
<section class="sec sand"><div class="wrap narrow story"><h2>${esc(P.bachTitle)}</h2>${P.bach.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>
${ctaBand(lang, P.ctaTitle, P.ctaText)}`;
  },

  payment(lang) {
    const T = SITE[lang], P = T.payment;
    const block = (title, paras) => `<div><h2>${esc(title)}</h2>${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;
    return `${pageHead(lang, P, "")}
<section class="sec"><div class="wrap narrow story">${block(P.howTitle, P.how)}</div></section>
<section class="sec sand"><div class="wrap two">
  ${block(P.currencyTitle, P.currency)}
  ${block(P.depositTitle, P.deposit)}
</div></section>
<section class="sec"><div class="wrap narrow story">
  <h2>${esc(P.plansTitle)}</h2><p>${esc(P.plansText)}</p>
  <h2>${esc(P.cancelTitle)}</h2>${P.cancel.map((p) => `<p>${esc(p)}</p>`).join("")}
  <h2>${esc(P.questionsTitle)}</h2><p>${esc(P.questionsText)}</p>
</div></section>
${partnersBand(lang)}
${ctaBand(lang, P.ctaTitle, P.ctaText)}`;
  },

  mentoring(lang) {
    const T = SITE[lang], P = T.mentoring;
    return `${pageHead(lang, P, "anna-about")}
<section class="sec"><div class="wrap narrow story"><h2>${esc(P.introTitle)}</h2>${P.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>
<section class="sec sand"><div class="wrap"><h2>${esc(P.servicesTitle)}</h2>${serviceCards(lang, P.services)}<p class="small muted note-under">${esc(P.note)}</p></div></section>
<section class="sec"><div class="wrap narrow"><h2>${esc(P.whyTitle)}</h2><ul class="ticks big">${P.why.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<p class="small muted note-under"><a href="https://doula.org.uk/guide-to-mentoring" target="_blank" rel="noopener">Doula UK — Guide to Mentoring →</a></p></div></section>
${ctaBand(lang, P.ctaTitle, P.ctaText)}`;
  },

  about(lang) {
    const T = SITE[lang], P = T.about;
    return `<section class="page-head"><div class="wrap ph-grid">
  <div><p class="eyebrow">${esc(P.eyebrow)}</p><h1>${esc(P.h1)}</h1><p class="lead">${esc(P.lead)}</p></div>
  ${fs.existsSync(path.join(ROOT, "images", "anna-about.jpg")) ? img(lang, "anna-about", P.photoAlt, "arch arch-sm") : ""}
</div></section>
<section class="sec"><div class="wrap narrow story">${P.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>
<section class="sec exp"><div class="wrap narrow center">
  <h2>${esc(T.home.experienceTitle)}</h2>
  <p class="lead-sm">${esc(T.home.experienceLead)}</p>
  <ul class="exp-list">${T.home.experienceItems.map((x) => `<li><b>${esc(x.num)}</b><span>${esc(x.text)}</span></li>`).join("")}</ul>
</div></section>
<section class="sec sand"><div class="wrap two">
  <div><h2>${esc(P.experienceTitle)}</h2><ul class="ticks">${P.experience.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  <div><h2>${esc(P.qualTitle)}</h2><ul class="ticks">${P.qual.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
</div></section>
<section class="sec"><div class="wrap narrow"><h2>${esc(P.trainingTitle)}</h2><ol class="timeline">${P.training.map((t) => `<li><span>${esc(t.year)}</span><p>${esc(t.text)}</p></li>`).join("")}</ol>
<p class="more-link"><a href="${href(lang, lang, "team")}">${esc(P.teamLink)} →</a></p></div></section>
${faqBlock(lang)}
${ctaBand(lang, T.home.ctaTitle, T.home.ctaText)}`;
  },

  team(lang) {
    const T = SITE[lang], P = T.team;
    return `${pageHead(lang, P)}
<section class="sec"><div class="wrap"><div class="team">${P.people.map((m) => `<article class="person">
  <p class="tag">${esc(m.role)}</p><h3>${esc(m.name)}</h3><p>${esc(m.text)}</p>
  ${m.helps.length ? `<ul class="dots">${m.helps.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
  ${m.offer ? `<p class="offer">${esc(m.offer)}</p>` : ""}
</article>`).join("")}</div></div></section>
${ctaBand(lang, T.home.ctaTitle, T.home.ctaText)}`;
  },

  reviews(lang) {
    const T = SITE[lang], P = T.reviews;
    return `${pageHead(lang, P)}
<section class="sec"><div class="wrap">${reviewCards(lang, P.items)}</div></section>
<section class="sec sand"><div class="wrap narrow center">
  <h2>${esc(P.leaveTitle)}</h2><p>${esc(P.leaveText)}</p>
  <p><a class="btn btn-clay" href="${S.googleReview || "mailto:" + S.email}" target="_blank" rel="noopener">${esc(S.googleReview ? P.leaveButton : S.email)}</a></p>
</div></section>
${ctaBand(lang, T.home.ctaTitle, T.home.ctaText)}`;
  },

  contact(lang) {
    const T = SITE[lang], P = T.contact;
    return `${pageHead(lang, P)}
<section class="sec tight"><div class="wrap contact-grid">
  <div class="cal"><h2>${esc(P.calendarTitle)}</h2>
    <div class="cal-card">
      <p class="cal-lead">${esc(P.calendarText)}</p>
      <a class="btn btn-clay" href="${S.calendly}" target="_blank" rel="noopener">${esc(T.ui.book)}</a>
      <p class="small muted cal-note">${esc(P.calendarNote)}</p>
    </div>
    <h3>${esc(P.addressTitle)}</h3><p>${esc(P.addressText)}</p><p class="small muted">${esc(P.termsText)}</p>
  </div>
  <aside>
    <h2>${esc(P.waysTitle)}</h2>
    <ul class="ways">
      <li><a class="way wa" href="${wa()}" target="_blank" rel="noopener"><b>WhatsApp</b><span>${esc(S.phone)}</span></a></li>
      <li><a class="way tg" href="${tg()}" target="_blank" rel="noopener"><b>Telegram</b><span>@${esc(S.telegram)}</span></a></li>
      <li><a class="way" href="tel:${S.phone.replace(/\s/g, "")}"><b>${esc(T.ui.call)}</b><span>${esc(S.phone)}</span></a></li>
      <li><a class="way" href="mailto:${S.email}"><b>Email</b><span>${esc(S.email)}</span></a></li>
      <li><a class="way ig" href="https://www.instagram.com/${S.instagram}/" target="_blank" rel="noopener"><b>Instagram</b><span>@${esc(S.instagram)}</span></a></li>
    </ul>
  </aside>
</div></section>`;
  }
};

/* ---------- structured data ---------- */
function jsonLd(lang, page, o = {}) {
  const T = SITE[lang];
  const biz = {
    "@type": "ProfessionalService", "@id": D + "/#business", name: "Happy Birth Doula",
    url: D + "/", telephone: S.phone.replace(/\s/g, ""), email: S.email,
    image: [D + "/share.jpg", D + "/images/anna-round.jpg"], logo: D + "/images/logo-full.png", priceRange: "££",
    address: { "@type": "PostalAddress", addressLocality: "Chatham", addressRegion: "Kent", postalCode: S.postcode, addressCountry: "GB" },
    areaServed: ["Kent", "Medway", "Chatham", "Maidstone", "Gravesend", "Dartford", "London"].map((n) => ({ "@type": "Place", name: n })),
    knowsLanguage: ["en", "ru"],
    founder: { "@id": D + "/#anna" },
    sameAs: [`https://www.instagram.com/${S.instagram}/`, tg()]
  };
  const D_ID = D + "/#business";
  const person = { "@type": "Person", "@id": D + "/#anna", name: "Anna Pifko", alternateName: ["Анна Пифко", "Anna Pifko doula", "Anya Pifko"], jobTitle: "Doula", url: absUrl(lang, "about"), image: D + "/images/anna-round.jpg", worksFor: { "@id": D + "/#business" }, alumniOf: "University of East London", knowsLanguage: ["en", "ru"], sameAs: [`https://www.instagram.com/${S.instagram}/`] };
  const site = { "@type": "WebSite", "@id": D + "/#website", url: D + "/", name: "Happy Birth with Anna", inLanguage: ["en-GB", "ru"], publisher: { "@id": D + "/#business" } };
  const graph = [biz, person, site];
  if (o.landing) {
    const D = o.landing[lang];
    graph.push({ "@type": "Service", name: D.h1, description: D.description, provider: { "@id": D_ID }, areaServed: ["Kent", "Medway", "London"].map((n) => ({ "@type": "Place", name: n })), availableChannel: { "@type": "ServiceChannel", serviceUrl: absUrl(lang, page) } });
    graph.push({ "@type": "FAQPage", mainEntity: D.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
    graph.push({ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: T.nav.home, item: absUrl(lang, "home") },
      { "@type": "ListItem", position: 2, name: D.h1, item: absUrl(lang, page) }] });
    return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
  }
  if (o.article) {
    const A = o.article[lang];
    graph.push({ "@type": "BlogPosting", headline: A.title, description: A.description, inLanguage: lang === "ru" ? "ru" : "en-GB", datePublished: o.article.date, dateModified: o.article.date, author: { "@id": D + "/#anna" }, publisher: { "@id": D + "/#business" }, image: D + "/share.jpg", mainEntityOfPage: absUrl(lang, page) });
    graph.push({ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: T.nav.home, item: absUrl(lang, "home") },
      { "@type": "ListItem", position: 2, name: T.nav.articles, item: absUrl(lang, "articles") },
      { "@type": "ListItem", position: 3, name: A.title, item: absUrl(lang, page) }] });
    return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
  }
  if (page !== "home") graph.push({ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: T.nav.home, item: absUrl(lang, "home") },
    { "@type": "ListItem", position: 2, name: T.nav[page], item: absUrl(lang, page) }] });
  if (page === "home" || page === "about") graph.push({ "@type": "FAQPage", mainEntity: T.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const svc = T[page] && T[page].services;
  if (svc && page !== "home") svc.forEach((s) => {
    const m = String(s.price || "").replace(/[\s,]/g, "").match(/£(\d+)/);
    graph.push({ "@type": "Service", name: s.name, provider: { "@id": D + "/#business" }, areaServed: "Kent, Medway, London",
      ...(m ? { offers: { "@type": "Offer", price: m[1], priceCurrency: "GBP" } } : {}) });
  });
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

/* ---------- page shell ---------- */
function render(lang, page, o = {}) {
  const T = SITE[lang], M = o.meta || T.meta[page], alts = o.alts || ["en", "ru"];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(M.title)}</title>
<meta name="description" content="${esc(M.description)}">
<link rel="canonical" href="${absUrl(lang, page)}">
${alts.length > 1 ? `<link rel="alternate" hreflang="en-GB" href="${absUrl("en", page)}">
<link rel="alternate" hreflang="ru" href="${absUrl("ru", page)}">
<link rel="alternate" hreflang="x-default" href="${absUrl("en", page)}">` : ""}${o.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="${o.article ? "article" : "website"}">
<meta property="og:site_name" content="Happy Birth Doula">
<meta property="og:title" content="${esc(M.title)}">
<meta property="og:description" content="${esc(M.description)}">
<meta property="og:url" content="${absUrl(lang, page)}">
<meta property="og:image" content="${D}/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${lang === "ru" ? "ru_RU" : "en_GB"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="${asset(lang, "images/logo-mark-128.png")}" type="image/png">
<link rel="apple-touch-icon" href="${asset(lang, "icon.png")}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap">
<link rel="stylesheet" href="${asset(lang, "style.css")}?v=${VER}">
${o.noindex ? "" : jsonLd(lang, page, o)}
${S.goatcounter ? `<script data-goatcounter="https://${S.goatcounter}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>` : ""}
</head>
<body>
${header(lang, page, alts)}
<main id="main">
${o.body || BODY[page](lang)}
</main>
${footer(lang)}
<a class="float-wa" href="${wa()}" target="_blank" rel="noopener" aria-label="WhatsApp">
<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg></a>
<script src="${asset(lang, "site.js")}?v=${VER}"></script>
</body>
</html>`;
}

/* ---------- write everything ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "ru"), { recursive: true });
const ENTRIES = [];
for (const lang of ["en", "ru"]) {
  for (const page of PAGES) ENTRIES.push({ lang, page, o: {} });
  if (artIn(lang).length) ENTRIES.push({ lang, page: "articles", o: { meta: SITE[lang].articlesPage.meta, body: articlesIndex(lang) } });
  for (const L of landIn(lang)) ENTRIES.push({ lang, page: L.slug, date: L.date, o: { landing: L, alts: ["en", "ru"].filter((l) => L[l]), meta: { title: L[lang].metaTitle, description: L[lang].description }, body: landingPage(lang, L) } });
  for (const a of artIn(lang)) ENTRIES.push({ lang, page: a.slug, date: a.date, o: { article: a, alts: ["en", "ru"].filter((l) => a[l]), meta: { title: a[lang].metaTitle || a[lang].title, description: a[lang].description }, body: articlePage(lang, a) } });
}
for (const e of ENTRIES) {
  const file = path.join(OUT, e.lang === "ru" ? "ru" : "", (e.page === "home" ? "index" : e.page) + ".html");
  fs.writeFileSync(file, render(e.lang, e.page, e.o));
}
// page shown for addresses that don't exist
fs.writeFileSync(path.join(OUT, "404.html"), render("en", "home", { noindex: true, meta: { title: "Page not found | Happy Birth with Anna", description: "This page doesn’t exist." },
  body: `<section class="sec"><div class="wrap narrow center"><h1>Page not found</h1><p class="lead" style="margin-inline:auto">Sorry — this page has moved or doesn’t exist. Страница не найдена.</p><div class="btns" style="justify-content:center"><a class="btn btn-clay" href="${href("en", "en", "home")}">Go to the home page</a><a class="btn btn-line" href="${href("en", "ru", "home")}">На главную (RU)</a></div></div></section>` }));
for (const f of ["style.css", "site.js", "CNAME", "share.jpg", "icon.png", "favicon.svg"])
  if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
if (fs.existsSync(path.join(ROOT, "images"))) {
  fs.mkdirSync(path.join(OUT, "images"), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, "images"))) if (/\.(jpe?g|webp|png)$/i.test(f)) fs.copyFileSync(path.join(ROOT, "images", f), path.join(OUT, "images", f));
}
// search engine verification files
for (const f of fs.readdirSync(ROOT)) if (/^(google[0-9a-z]+\.html|yandex_[0-9a-z]+\.html|BingSiteAuth\.xml)$/i.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));

// redirects from the old Tilda addresses
const OLD = { eng: "/", aboutme: "/about", contactme: "/contact", feedbacks: "/reviews", collegues: "/team", "pregnancy-freebooking": "/contact",
  thankyou: "/", thankyouen: "/", sorry: "/", "leave-feedback": "/ru/reviews", beremenim: "/ru/pregnancy", "posle-rodov": "/ru/postnatal",
  detyam: "/ru/children", vsem: "/ru/adults", obomne: "/ru/about", "contact-me": "/ru/contact", page24024525: "/ru/" };
if (!PREVIEW) for (const [from, to] of Object.entries(OLD)) {
  fs.writeFileSync(path.join(OUT, from + ".html"), `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${D}${to}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"><script>location.replace("${to}")</script><a href="${to}">${D}${to}</a>`);
}

// sitemap + robots
const today = new Date().toISOString().slice(0, 10);
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
for (const e of ENTRIES) {
  const alts = e.o.alts || ["en", "ru"];
  sm += `  <url><loc>${absUrl(e.lang, e.page)}</loc><lastmod>${e.date || today}</lastmod>`;
  if (alts.length > 1) sm += `<xhtml:link rel="alternate" hreflang="en-GB" href="${absUrl("en", e.page)}"/><xhtml:link rel="alternate" hreflang="ru" href="${absUrl("ru", e.page)}"/>`;
  sm += `</url>\n`;
}
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sm + "</urlset>\n");
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${D}/sitemap.xml\n`);
console.log("Built", ENTRIES.length, "pages into", path.basename(OUT));
