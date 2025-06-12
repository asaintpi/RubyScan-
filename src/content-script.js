(() => {
  const KEY_F = "f";
  const SCAN_DURATION = 1000; // ms – total sweep time
  let box; // Search UI element
  let cleanupFns = []; // Active clean‑ups per scan

  // === 1. Intercept Ctrl+F ===
  document.addEventListener("keydown", (e) => {
    const tag = (e.target || {}).tagName;
    const editable =
      e.target &&
      (e.target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA");
    if (editable) return;
    if (
      e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      e.key.toLowerCase() === KEY_F
    ) {
      e.preventDefault();
      openSearchBox();
    }
  });

  // === 2. Search Box UI ===
  function openSearchBox() {
    if (box) return; // already open
    box = document.createElement("div");
    box.id = "rubyscan-box";
    box.innerHTML = `
      <input type="text" id="rubyscan-input" placeholder="Search…" autofocus />
      <button id="rubyscan-close" title="Close">✕</button>
    `;
    document.body.appendChild(box);

    const input = document.getElementById("rubyscan-input");
    // No manual focus call – autofocus attribute handles it.

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const query = input.value.trim();
        if (query) startScan(query);
      } else if (ev.key === "Escape") {
        closeEverything();
      }
    });
    document.getElementById("rubyscan-close").onclick = closeEverything;
  }

  // === 3. Start Scan Logic ===
  function startScan(query) {
    runCleanups();
    const line = document.createElement("div");
    line.id = "rubyscan-line";
    line.style.setProperty("--rs-duration", SCAN_DURATION + "ms");
    document.body.appendChild(line);
    const removeLine = () => line.remove();
    line.addEventListener("animationend", removeLine, { once: true });
    cleanupFns.push(removeLine);

    const unwrap = wrapAndAnimateWords(query.toLowerCase(), SCAN_DURATION);
    cleanupFns.push(unwrap);

    const timer = setTimeout(runCleanups, SCAN_DURATION + 300);
    cleanupFns.push(() => clearTimeout(timer));
  }

  // === 4. Word wrapping + animation assignment ===
  function wrapAndAnimateWords(queryLower, duration) {
    const spansToUnwrap = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (
            node.parentElement.closest(
              "#rubyscan-box, script, style, noscript, textarea, input, select, code, pre"
            )
          )
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    nodes.forEach((textNode) => {
      if (!textNode.parentElement) return;
      const frag = document.createDocumentFragment();
      const parts = textNode.nodeValue.split(/(\s+)/);
      parts.forEach((token) => {
        if (!token) return;
        if (/\s+/.test(token)) {
          frag.appendChild(document.createTextNode(token));
        } else {
          const span = document.createElement("span");
          span.className = "rs-word";
          span.textContent = token;

          const rect = textNode.parentElement.getBoundingClientRect();
          const absTop = rect.top + window.scrollY;
          const delay = Math.floor((absTop / pageHeight) * duration);
          span.style.animation = `rs-flash 40ms linear ${delay}ms forwards`;

          if (token.toLowerCase() === queryLower) {
            span.classList.add("rs-hit");
            // Halo handled purely in CSS – no extra JS animation needed.
          } else {
            spansToUnwrap.push(span);
          }
          frag.appendChild(span);
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });

    return () => {
      spansToUnwrap.forEach((span) => {
        if (span.parentNode)
          span.replaceWith(document.createTextNode(span.textContent));
      });
    };
  }

  // === 5. Cleanup helpers ===
  function runCleanups() {
    while (cleanupFns.length) {
      try {
        cleanupFns.pop()();
      } catch (_) {}
    }
  }

  function closeEverything() {
    runCleanups();
    if (box) {
      box.remove();
      box = null;
    }
  }
})();
