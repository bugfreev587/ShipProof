(function() {
  window.addEventListener("message", function(e) {
    if (!e.data || e.data.type !== "shipproof-resize") return;
    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === e.source) {
        iframes[i].style.height = e.data.height + "px";
        break;
      }
    }
  });
})();
