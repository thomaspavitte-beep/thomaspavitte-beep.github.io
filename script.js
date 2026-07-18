// Renders the projects array as the list.

(function () {
  "use strict";

  // Hover video previews: a square card that follows the cursor.
  // One shared card, lerped toward the pointer; videos only load on first hover,
  // and only on hover-capable devices without prefers-reduced-motion.
  var CARD = 250; // square card edge in px
  var HOVER_OK =
    window.matchMedia("(hover: hover)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var card = null, cardVid = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  function cardTick() {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    card.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
    if (card.classList.contains("on") || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) {
      raf = requestAnimationFrame(cardTick);
    } else {
      raf = null;
    }
  }

  function cardTarget(e) {
    var pad = 12, off = 20;
    tx = Math.min(e.clientX + off, window.innerWidth - CARD - pad);
    ty = Math.min(e.clientY + off, window.innerHeight - CARD - pad);
    if (ty < e.clientY + off) ty = e.clientY - CARD - off; // flip above near the bottom
    ty = Math.max(pad, ty);
  }

  function attachHoverVideo(row, src) {
    row.addEventListener("mouseenter", function (e) {
      if (!card) {
        card = document.createElement("div");
        card.id = "vidcard";
        cardVid = document.createElement("video");
        cardVid.muted = true;
        cardVid.loop = true;
        cardVid.playsInline = true;
        card.appendChild(cardVid);
        document.body.appendChild(card);
      }
      if (cardVid.getAttribute("src") !== src) cardVid.src = src;
      cardTarget(e);
      cx = tx;
      cy = ty;
      card.classList.add("on");
      cardVid.play().catch(function () {});
      if (!raf) raf = requestAnimationFrame(cardTick);
    });
    row.addEventListener("mousemove", cardTarget);
    row.addEventListener("mouseleave", function () {
      card.classList.remove("on");
      cardVid.pause();
    });
  }

  // Theme kinship: hovering a row keeps rows that share one of its themes bright
  // and fades the rest, so related experiments quietly find each other.
  function attachKinship(list, rowEls) {
    rowEls.forEach(function (entry) {
      entry.row.addEventListener("mouseenter", function () {
        list.classList.add("focusing");
        rowEls.forEach(function (other) {
          var kin =
            other === entry ||
            (entry.themes || []).some(function (t) {
              return (other.themes || []).indexOf(t) !== -1;
            });
          other.row.classList.toggle("kin", kin);
        });
      });
      entry.row.addEventListener("mouseleave", function () {
        list.classList.remove("focusing");
        rowEls.forEach(function (other) {
          other.row.classList.remove("kin");
        });
      });
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var list = document.getElementById("projects");
  var frag = document.createDocumentFragment();
  var total = projects.length;
  var rowEls = [];

  projects.forEach(function (p, i) {
    var li = document.createElement("li");
    var row = document.createElement(p.url ? "a" : "span");
    row.className = "row";
    if (p.url) row.href = p.url;
    var count = String(total - i).padStart(2, "0");
    row.innerHTML =
      '<span class="text">' +
      '<span class="title">' + esc(p.title) + "</span>" +
      '<span class="desc">' + esc(p.description) + "</span>" +
      "</span>" +
      '<span class="count">' + count + "</span>";
    if (p.video && HOVER_OK) attachHoverVideo(row, p.video);
    rowEls.push({ row: row, themes: p.themes });
    li.appendChild(row);
    frag.appendChild(li);
  });

  list.appendChild(frag);
  if (HOVER_OK) attachKinship(list, rowEls);
})();
