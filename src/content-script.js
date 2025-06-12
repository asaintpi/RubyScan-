(() => {
  const KEY_F = "f";
  const DEFAULT_SPEED = 1000;
  const PAGE_MARGIN = 400; // tighter margin for perf

  let SCAN_DURATION = DEFAULT_SPEED;
  let box, line;
  let cleanupFns = [];
  let hits = [];
  let currentIdx = 0;
  let observer;

  chrome.storage.sync.get(["speed"], (res) => {
    if (res.speed) SCAN_DURATION = res.speed;
  });

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
      return;
    }
    if (box && e.key === "F3") {
      e.preventDefault();
      e.shiftKey ? prevMatch() : nextMatch();
    }
  });

  function openSearchBox() {
    if (box) return;
    box = document.createElement("div");
    box.id = "rubyscan-box";
    box.innerHTML = `
      <input type="text" id="rubyscan-input" placeholder="Search…" autofocus />
      <span id="rubyscan-count"></span>
      <button id="rubyscan-prev" title="Prev (Shift+F3)">↑</button>
      <button id="rubyscan-next" title="Next (F3)">↓</button>
      <button id="rubyscan-close" title="Close">✕</button>`;
    document.body.appendChild(box);

    const input = box.querySelector("#rubyscan-input");
    const countLbl = box.querySelector("#rubyscan-count");
    box.updateCounter = () => {
      countLbl.textContent = hits.length
        ? `${currentIdx + 1} / ${hits.length}`
        : "";
    };

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const q = input.value.trim();
        if (q) startScan(q);
      } else if (ev.key === "Escape") closeEverything();
    });
    box.querySelector("#rubyscan-next").onclick = nextMatch;
    box.querySelector("#rubyscan-prev").onclick = prevMatch;
    box.querySelector("#rubyscan-close").onclick = closeEverything;
  }

  function startScan(query) {
    runCleanups();
    hits = [];
    currentIdx = 0;
    const queryLower = query.toLowerCase();

    line = document.createElement("div");
    line.id = "rubyscan-line";
    line.style.setProperty("--rs-duration", SCAN_DURATION + "ms");
    document.body.appendChild(line);
    cleanupFns.push(() => line.remove());

    observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: `${PAGE_MARGIN}px 0px ${PAGE_MARGIN}px 0px`,
      threshold: 0,
    });
    document
      .querySelectorAll("body *:not(script):not(style):not(#rubyscan-box)")
      .forEach((el) => {
        if ([...el.childNodes].some((n) => n.nodeType === 3))
          observer.observe(el);
      });

    const timer = setTimeout(() => line.remove(), SCAN_DURATION);
    cleanupFns.push(() => clearTimeout(timer));

    function handleIntersect(entries) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        wrapElement(entry.target, queryLower);
        observer.unobserve(entry.target);
      });
    }
  }

  function wrapElement(el, queryLower) {
    el.childNodes.forEach((node) => {
      if (node.nodeType !== 3 || !node.nodeValue.trim()) return;
      const words = node.nodeValue.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach((tok) => {
        if (/\s+/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
        } else {
          const span = document.createElement("span");
          span.className = "rs-word";
          span.textContent = tok;
          const ratio =
            (window.scrollY + window.innerHeight / 2) /
            document.documentElement.scrollHeight;
          const delay = Math.floor(ratio * SCAN_DURATION);
          span.style.animation = `rs-flash 40ms linear ${delay}ms forwards`;
          if (tok.toLowerCase() === queryLower) {
            span.classList.add("rs-hit");
            hits.push(span);
            if (hits.length === 1) {
              highlightActive(0);
            }
          }
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    if (box) box.updateCounter();
  }

  function highlightActive(idx) {
    hits.forEach((el, i) => el.classList.toggle("rs-active", i === idx));
    if (hits[idx])
      hits[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    if (box) box.updateCounter();
  }
  function nextMatch() {
    if (!hits.length) return;
    currentIdx = (currentIdx + 1) % hits.length;
    highlightActive(currentIdx);
  }
  function prevMatch() {
    if (!hits.length) return;
    currentIdx = (currentIdx - 1 + hits.length) % hits.length;
    highlightActive(currentIdx);
  }

  function runCleanups() {
    if (observer) observer.disconnect();
    while (cleanupFns.length) {
      try {
        cleanupFns.pop()();
      } catch (_) {}
    }
    document
      .querySelectorAll(".rs-word")
      .forEach((sp) => sp.replaceWith(document.createTextNode(sp.textContent)));
    hits = [];
  }
  function closeEverything() {
    runCleanups();
    if (box) {
      box.remove();
      box = null;
    }
  }
})();
