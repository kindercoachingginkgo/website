window.addEventListener("load", resizeTextContainer);
window.addEventListener("resize", resizeTextContainer);

function resizeTextContainer() {
  let imageWidth = document.getElementById("img-ginkgo-2").clientWidth;
  // textContainer = 100% - (imageWidth) - (spacingCSSVariable);
  document.querySelector(
    "#naam-uitleg_ginkgo > article > .blue-bar-text-container"
  ).style.width =
    "calc(100% - " +
    document.getElementById("img-ginkgo-2").clientWidth +
    "px - var(--spc_small))";

  // If resize made text wrap down resize again.
  if (imageWidth != document.getElementById("img-ginkgo-2").clientWidth) {
    resizeTextContainer();
  }
}
