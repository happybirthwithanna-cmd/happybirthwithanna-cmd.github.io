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
