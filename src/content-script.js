(() => {
  const KEY_F = "f";
  let box;

  // Listen for Ctrl+F and override default browser finder
  document.addEventListener("keydown", (e) => {
    // Ignore if focus is on an input/textarea/contentEditable element
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
      showSearchBox();
    }
  });

  function showSearchBox() {
    if (box) return; // already open

    box = document.createElement("div");
    box.id = "rubyscan-box";
    box.innerHTML = `
      <input type="text" id="rubyscan-input" placeholder="Search…" autofocus />
      <button id="rubyscan-close" title="Close">✕</button>
    `;
    document.body.appendChild(box);

    // Focus input
    const input = document.getElementById("rubyscan-input");
    input.focus();

    // Close button
    document.getElementById("rubyscan-close").onclick = cleanup;

    // Esc key inside input closes
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        cleanup();
      }
    });
  }

  function cleanup() {
    if (!box) return;
    box.remove();
    box = null;
  }
})();
