const speedEl = document.getElementById("speed");
const speedVal = document.getElementById("speed-val");
const themeEl = document.getElementById("theme");
const disableEl = document.getElementById("disable-site");

chrome.storage.sync.get(["speed", "theme"], (res) => {
  speedEl.value = res.speed || 1000;
  speedVal.textContent = speedEl.value;
  themeEl.value = res.theme || "ruby";
});

speedEl.addEventListener(
  "input",
  (e) => (speedVal.textContent = e.target.value)
);

document.body.addEventListener("change", () => {
  chrome.storage.sync.set({ speed: +speedEl.value, theme: themeEl.value });
});
