// Renders the projects array as the list. Glyphs are inline SVG built from the shape value.

(function () {
  "use strict";

  // Archimedean spiral path, centred on (cx, cy)
  function spiralPath(cx, cy, turns, rMax) {
    var steps = Math.round(turns * 36);
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = t * turns * 2 * Math.PI - Math.PI / 2;
      var r = t * rMax;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + " " + (cy + r * Math.sin(a)).toFixed(2));
    }
    return "M" + pts.join(" L");
  }

  var STROKE = 'fill="none" stroke="currentColor" stroke-width="1.5"';

  var GLYPHS = {
    dots: '<circle class="g" cx="11" cy="11" r="4.5" fill="currentColor"/>',
    circles: '<circle class="g" cx="11" cy="11" r="7.5" ' + STROKE + ' pathLength="1"/>',
    spirals: '<path class="g" d="' + spiralPath(11, 11, 2.6, 7.8) + '" ' + STROKE + ' stroke-linecap="round"/>',
    lines: '<line class="g" x1="2.5" y1="11" x2="19.5" y2="11" ' + STROKE + ' stroke-linecap="round" pathLength="1"/>',
    other: '<rect class="g" x="4.5" y="4.5" width="13" height="13" ' + STROKE + "/>"
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

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

  var list = document.getElementById("projects");
  var frag = document.createDocumentFragment();

  projects.forEach(function (p) {
    var shape = GLYPHS.hasOwnProperty(p.shape) ? p.shape : "other";
    var li = document.createElement("li");
    var row = document.createElement(p.url ? "a" : "span");
    row.className = "row row--" + shape;
    if (p.url) row.href = p.url;
    row.innerHTML =
      '<svg class="glyph" viewBox="0 0 22 22" aria-hidden="true">' + GLYPHS[shape] + "</svg>" +
      '<span class="text">' +
      '<span class="title">' + esc(p.title) + "</span>" +
      '<span class="desc">' + esc(p.description) + "</span>" +
      "</span>" +
      '<span class="year">' + esc(p.year) + "</span>";
    if (p.video && HOVER_OK) attachHoverVideo(row, p.video);
    li.appendChild(row);
    frag.appendChild(li);
  });

  list.appendChild(frag);
})();
