(function(){
  var b = document.querySelector(".menu-btn"), n = document.getElementById("nav");
  if (b && n) b.addEventListener("click", function(){
    var open = n.classList.toggle("open"); b.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
// new client form
(function(){
  var f = document.getElementById("intake");
  if (!f) return;
  var $ = function(id){ return document.getElementById(id); };
  function toggle(){
    f.querySelectorAll("[data-show-name]").forEach(function(el){
      var c = f.querySelector('input[name="' + el.getAttribute("data-show-name") + '"]:checked:not(:disabled)');
      el.hidden = !(c && el.getAttribute("data-show-value").split("|").indexOf(c.value) > -1);
      el.querySelectorAll("input,textarea,select").forEach(function(i){ i.disabled = el.hidden; });   // hidden questions are never required
    });
    f.querySelectorAll(".form-sec").forEach(function(sec){            // hide a section when all its questions are hidden
      var flds = sec.querySelectorAll(".fld"); if (!flds.length) return;
      sec.hidden = Array.prototype.every.call(flds, function(x){ return x.hidden; });
    });
  }
  f.addEventListener("change", toggle); toggle();
  f.addEventListener("submit", function(e){
    e.preventDefault();
    $("intake-error").hidden = true; $("intake-notready").hidden = true;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var ep = f.getAttribute("data-endpoint");
    if (!ep) { $("intake-notready").hidden = false; return; }
    if (f.website && f.website.value) return;              // filled in by a spam robot
    var data = { "Form": f.getAttribute("data-form"), "Language": f.getAttribute("data-lang") }, fd = new FormData(f);
    fd.forEach(function(v, k){
      if (k === "website") return;
      var el = f.querySelector('[name="' + k + '"]'), box = el && el.closest("[data-show-name]");
      if (box && box.hidden) return;                        // skip answers to hidden questions
      v = String(v).trim(); if (!v) return;
      data[k] = data[k] ? data[k] + "; " + v : v;
    });
    var btn = f.querySelector('button[type="submit"]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = f.getAttribute("data-sending");
    fetch(ep, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function(){ f.hidden = true; $("intake-done").hidden = false; $("intake-done").focus(); window.scrollTo(0, $("intake-done").offsetTop - 120); })
      .catch(function(){ $("intake-error").hidden = false; btn.disabled = false; btn.textContent = label; });
  });
})();

// preselect the meeting on the consultation form from ?meeting=N
(function(){
  var f = document.getElementById("intake"); if (!f) return;
  var m = new URLSearchParams(location.search).get("meeting"); if (m === null) return;
  var r = f.querySelectorAll('input[name="Meeting type"]')[+m];
  if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
})();

// breastfeeding check
(function(){
  var box = document.getElementById("bfq"), dataEl = document.getElementById("bfq-data");
  if (!box || !dataEl) return;
  var D = JSON.parse(dataEl.textContent), T = D.t, Q = D.questions;
  var ans = {}, path = [], pos = 0, seenFirst = false;
  var ICONS = {
    baby: '<circle cx="24" cy="16" r="7"/><path d="M11 40c1.5-8 6.5-12.5 13-12.5S35.5 32 37 40"/><path d="M21.5 15.5h.01M26.5 15.5h.01M22 19c1.3 1 2.7 1 4 0"/>',
    heart: '<path d="M24 39s-13-7.8-13-17.8A7.7 7.7 0 0 1 24 16a7.7 7.7 0 0 1 13 5.2C37 31.2 24 39 24 39z"/>',
    drop: '<path d="M24 8c6 9 12 15 12 22a12 12 0 0 1-24 0c0-7 6-13 12-22z"/><path d="M19 31a5 5 0 0 0 5 5"/>',
    wave: '<path d="M7 26h5l3-8 5 16 4-12 3 6 3-3h11"/>',
    clock: '<circle cx="24" cy="25" r="14"/><path d="M24 17v8l6 4"/>',
    timer: '<circle cx="24" cy="27" r="13"/><path d="M24 20v7M20 8h8M24 8v6M34 15l2-2"/>',
    nappy: '<path d="M8 15h32v5c0 10-7 18-16 18S8 30 8 20z"/><path d="M8 21h32M17 15v6M31 15v6"/>',
    face: '<circle cx="24" cy="24" r="14"/><path d="M19 21h.01M29 21h.01"/><circle cx="24" cy="29" r="2.6"/>',
    smile: '<circle cx="24" cy="24" r="14"/><path d="M18.5 21c1-1.2 2.6-1.2 3.6 0M25.9 21c1-1.2 2.6-1.2 3.6 0M18 28c3.4 3.6 8.6 3.6 12 0"/>',
    moon: '<path d="M30 9a14 14 0 1 0 9 22A11 11 0 0 1 30 9z"/><path d="M33 12h4l-4 5h4"/>',
    sun: '<circle cx="24" cy="24" r="7"/><path d="M24 8v4M24 36v4M8 24h4M36 24h4M12.7 12.7l2.8 2.8M32.5 32.5l2.8 2.8M12.7 35.3l2.8-2.8M32.5 15.5l2.8-2.8"/>',
    bottle: '<path d="M20 7h8v5l3 4v22a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V16l3-4z"/><path d="M17 25h14M17 31h14"/>',
    round: '<path d="M5 40h38"/><path d="M13 40c0-15 5-25 11-25s11 10 11 25"/>',
    lipstick: '<path d="M5 40h38"/><path d="M13 40c0-11 2-19 6-25l16 7c1 6 0 12 0 18"/>',
    whitetip: '<path d="M5 40h38"/><path d="M13 40c0-15 5-25 11-25s11 10 11 25"/><path d="M18.5 21c3-2.5 8-2.5 11 0" stroke-width="4" stroke="#D9C9C6"/>'
  };
  function svg(name, size){ return '<svg viewBox="0 0 48 48" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function visible(){ var age = ans.age; return Q.filter(function(q){ return q.id === "age" || (age !== undefined && q.ages.indexOf(age) > -1); }); }
  function swap(html){
    var old = box.firstElementChild;
    function put(){ box.innerHTML = html; var c = box.firstElementChild; var h = c.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }
    if (!old || reduce) return put();
    old.classList.add("bfq-leave"); setTimeout(put, 220);
  }
  function showQ(){
    path = visible(); var q = path[pos], t = T.q[q.id], total = path.length;
    var pct = Math.round(pos / total * 100);
    var opts = t.o.map(function(o, i){ var sel = ans[q.id] === i ? " is-on" : "";
      var ic = q.optIcons ? '<span class="bfq-opt-ic">' + svg(q.optIcons[i], 42) + "</span>" : "";
      return '<button type="button" class="bfq-opt' + sel + (ic ? " has-ic" : "") + '" style="--i:' + i + '" data-i="' + i + '">' + ic + "<span>" + esc(o) + "</span></button>"; }).join("");
    swap('<div class="bfq-card"><div class="bfq-top"><span>' + esc(T.qOf.replace("{n}", pos + 1).replace("{t}", total)) + '</span>' +
      (pos > 0 ? '<button type="button" class="bfq-back" data-back>← ' + esc(T.back) + "</button>" : "") + '</div>' +
      '<div class="bfq-bar"><i style="width:' + pct + '%"></i></div>' + (q.icon ? '<div class="bfq-qic">' + svg(q.icon, 40) + "</div>" : "") + '<h2>' + esc(t.q) + '</h2><div class="bfq-opts">' + opts + "</div></div>");
  }
  function firstDays(){
    var F = T.firstDays, max = 60;
    var sizes = F.sizes.map(function(z, i){ var r = [9, 15, 21][i];
      return '<div class="bfq-tum" style="--i:' + i + '"><svg viewBox="0 0 48 48" width="64" height="64" aria-hidden="true"><circle cx="24" cy="24" r="' + r + '" fill="var(--blush)" stroke="var(--clay)" stroke-width="1.8"/></svg>' +
        "<b>" + esc(z.d) + "</b><span>" + esc(z.s) + "</span><small>" + esc(z.ml) + "</small></div>"; }).join("");
    swap('<div class="bfq-card bfq-first"><div class="bfq-qic">' + svg("baby", 40) + "</div><h2>" + esc(F.title) + "</h2><p>" + esc(F.text) + '</p><div class="bfq-tums">' + sizes + "</div>" +
      '<ul class="bfq-notes bfq-tips">' + F.points.map(function(n, i){ return '<li style="--i:' + (i + 3) + '">' + esc(n) + "</li>"; }).join("") + "</ul>" +
      '<p class="bfq-ctas"><button type="button" class="btn btn-clay" data-continue>' + esc(F.cont) + " →</button></p></div>");
  }
  function status(q, i){
    if (q.type === "wet") return q.values[i] < q.need[ans.age] ? "urgent" : "ok";
    var s = q.s[i]; if (s !== "ok" && q.okAges && q.okAges[i] && q.okAges[i].indexOf(ans.age) > -1) s = "ok"; return s;
  }
  var lastResult = null;
  function leadForm(){
    var L = T.lead, opts = L.contactO.map(function(o, i){ return '<label class="opt"><input type="radio" name="contact" value="' + esc(o) + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(o) + "</span></label>"; }).join("");
    return '<form class="bfq-lead" novalidate><h3>' + esc(L.title) + "</h3><p>" + esc(L.text) + "</p>" +
      '<div class="form-grid"><div class="fld"><label for="bl-n">' + esc(L.name) + ' <span class="req">*</span></label><input id="bl-n" name="name" type="text" autocomplete="name" required></div>' +
      '<div class="fld"><label for="bl-p">' + esc(L.phone) + ' <span class="req">*</span></label><input id="bl-p" name="phone" type="tel" autocomplete="tel" required></div>' +
      '<div class="fld full"><label for="bl-e">' + esc(L.email) + '</label><input id="bl-e" name="email" type="email" autocomplete="email"></div>' +
      '<fieldset class="fld full"><legend>' + esc(L.contact) + '</legend><div class="opts">' + opts + "</div></fieldset></div>" +
      '<div class="hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<label class="opt bfq-consent"><input type="checkbox" name="consent" required><span>' + esc(L.consent) + ' <span class="req">*</span> <a href="' + D.links.privacy + '" target="_blank" rel="noopener">' + esc(L.privacy) + "</a></span></label>" +
      '<p class="form-msg err" hidden>' + esc(L.error) + "</p>" +
      '<p class="bfq-ctas"><button type="submit" class="btn btn-clay">' + esc(L.send) + '</button><button type="button" class="btn btn-line" data-restart>' + esc(T.restart) + "</button></p>" +
      '<p class="small"><a href="' + D.links.consult + '">' + esc(L.or) + " →</a></p></form>";
  }
  box.addEventListener("submit", function(e){
    var f = e.target; if (!f.classList.contains("bfq-lead")) return;
    e.preventDefault();
    var err = f.querySelector(".form-msg"); err.hidden = true;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    if (f.website.value) return;
    var data = { "Form": "Breastfeeding check", "Language": D.lang, "Full name": f.name.value.trim(), "Phone": f.phone.value.trim(), "Email": f.email.value.trim(),
      "Preferred contact": (f.querySelector('input[name="contact"]:checked') || {}).value || "", "Result": T.results[lastResult.level].title,
      "Noticed": lastResult.notes.join("\n"), "Consent to hold this information": "Yes" };
    visible().forEach(function(q){ if (ans[q.id] !== undefined) data[q.label] = T.q[q.id].o[ans[q.id]]; });
    var btn = f.querySelector('button[type="submit"]'), label = btn.textContent; btn.disabled = true; btn.textContent = T.lead.sending;
    fetch(D.links.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function(){ f.outerHTML = '<div class="bfq-sent"><div class="bfq-badge" aria-hidden="true">' + svg("heart", 44) + "</div><p>" + esc(T.lead.thanks) + "</p></div>"; })
      .catch(function(){ err.hidden = false; btn.disabled = false; btn.textContent = label; });
  });
  function result(){
    var notes = { urgent: [], help: [] }, tips = [], level = "ok";
    visible().forEach(function(q){ if (q.id === "age" || ans[q.id] === undefined) return;
      var i = ans[q.id], tt = T.q[q.id].tip;
      if (q.tips && q.tips[i] && q.tips[i].indexOf(ans.age) > -1 && tt && tt[i]) tips.push(tt[i]);
      var st = status(q, i); if (st === "ok") return;
      var w = T.q[q.id].why; notes[st].push(typeof w === "string" ? w : w[ans[q.id]]);
      if (st === "urgent") level = "urgent"; else if (level === "ok") level = "help"; });
    var R = T.results[level], list = notes.urgent.concat(notes.help);
    var href = R.ctaHref === "consult" ? D.links.consult : D.links.whatsapp;
    var ext = R.ctaHref === "consult" ? "" : ' target="_blank" rel="noopener"';
    var icon = { ok: "M14 25l7 7 13-15", help: "M21 21a6 6 0 1 1 6 6v4M27 36v.5", urgent: "M24 13v14M24 34v.5" }[level];
    swap('<div class="bfq-card bfq-result bfq-' + level + '"><div class="bfq-badge" aria-hidden="true"><svg viewBox="0 0 48 48" width="56" height="56"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="' + icon + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      "<h2>" + esc(R.title) + "</h2><p>" + esc(R.text) + "</p>" +
      (list.length ? '<h3>' + esc(T.noticed) + '</h3><ul class="bfq-notes">' + list.map(function(n, i){ return '<li style="--i:' + i + '">' + esc(n) + "</li>"; }).join("") + "</ul>" : "") +
      (tips.length ? '<h3>' + esc(T.goodToKnow) + '</h3><ul class="bfq-notes bfq-tips">' + tips.map(function(n, i){ return '<li style="--i:' + (i + list.length) + '">' + esc(n) + "</li>"; }).join("") + "</ul>" : "") +
      (R.extra ? '<p class="bfq-999">' + esc(R.extra) + "</p>" : "") + (R.after ? "<p>" + esc(R.after) + "</p>" : "") +
      (level === "ok" || !D.links.endpoint ?
        '<p class="bfq-ctas"><a class="btn btn-clay" href="' + href + '"' + ext + ">" + esc(R.cta) + '</a><button type="button" class="btn btn-line" data-restart>' + esc(T.restart) + "</button></p>" :
        leadForm()) + "</div>");
    lastResult = { level: level, notes: list };
  }
  box.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-bfq-start") || b.hasAttribute("data-restart")) { ans = {}; pos = 0; seenFirst = false; return showQ(); }
    if (b.hasAttribute("data-continue")) { seenFirst = true; path = visible(); pos = 1; return showQ(); }
    if (b.hasAttribute("data-back")) { pos = Math.max(0, pos - 1); return showQ(); }
    if (b.classList.contains("bfq-opt")) {
      var q = path[pos]; ans[q.id] = +b.getAttribute("data-i"); b.classList.add("is-on");
      setTimeout(function(){
        if (q.id === "age" && ans.age <= 1 && !seenFirst && T.firstDays) return firstDays();
        path = visible(); pos++; if (pos >= path.length) result(); else showQ(); }, reduce ? 0 : 180);
    }
  });
})();
