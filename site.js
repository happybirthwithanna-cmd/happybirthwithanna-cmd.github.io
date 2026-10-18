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
  var ans = {}, path = [], pos = 0;
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
      return '<button type="button" class="bfq-opt' + sel + '" style="--i:' + i + '" data-i="' + i + '">' + esc(o) + "</button>"; }).join("");
    swap('<div class="bfq-card"><div class="bfq-top"><span>' + esc(T.qOf.replace("{n}", pos + 1).replace("{t}", total)) + '</span>' +
      (pos > 0 ? '<button type="button" class="bfq-back" data-back>← ' + esc(T.back) + "</button>" : "") + '</div>' +
      '<div class="bfq-bar"><i style="width:' + pct + '%"></i></div><h2>' + esc(t.q) + '</h2><div class="bfq-opts">' + opts + "</div></div>");
  }
  function status(q, i){
    if (q.type === "wet") return q.values[i] < q.need[ans.age] ? "urgent" : "ok";
    var s = q.s[i]; if (s !== "ok" && q.okAges && q.okAges[i] && q.okAges[i].indexOf(ans.age) > -1) s = "ok"; return s;
  }
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
      '<p class="bfq-ctas"><a class="btn btn-clay" href="' + href + '"' + ext + ">" + esc(R.cta) + '</a><button type="button" class="btn btn-line" data-restart>' + esc(T.restart) + "</button></p></div>");
  }
  box.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-bfq-start") || b.hasAttribute("data-restart")) { ans = {}; pos = 0; return showQ(); }
    if (b.hasAttribute("data-back")) { pos = Math.max(0, pos - 1); return showQ(); }
    if (b.classList.contains("bfq-opt")) {
      var q = path[pos]; ans[q.id] = +b.getAttribute("data-i"); b.classList.add("is-on");
      setTimeout(function(){ path = visible(); pos++; if (pos >= path.length) result(); else showQ(); }, reduce ? 0 : 180);
    }
  });
})();
