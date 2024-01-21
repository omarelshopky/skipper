(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.skipperHasRun) {
    return;
  }
  window.skipperHasRun = true;
  window.skipperIsWorking = false;
  window.skipperVideo = document.querySelector("video");
  window.skipperPlaybackSpeed = window.skipperVideo ? window.skipperVideo.playbackRate : 1;

  function switchState(state) {
    window.skipperIsWorking = state;
  }

  function setSpeedPlaybackRate(playbackRate) {
    window.skipperPlaybackSpeed = playbackRate;
    changeSpeedPlayback(playbackRate)
  }

  function changeSpeedPlayback(playbackRate = null) {
    if (!window.skipperVideo) {
      return;
    }

    if (playbackRate) {
      window.skipperVideo.playbackRate = playbackRate;
    } else {
      window.skipperVideo.playbackRate = window.skipperPlaybackSpeed;
    }
  }

  function observeAds() {
    const target = document.querySelector(".video-ads");

    window.skipperObserver = new MutationObserver(function(mutations) {
        mutations.forEach(() => {
          console.log("Ad Shown");
          changeSpeedPlayback(400);
        });
    });

    const config = { attributes: true, childList: true, characterData: true }
    window.skipperObserver.observe(target, config);
  }

  function disableObserveAds() {
    window.skipperObserver.disconnect();
  }

  /**
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "switch-off") {
      switchState(false);
      changeSpeedPlayback(1);
      disableObserveAds();
    } else if (message.command === "switch-on") {
      switchState(true);
      changeSpeedPlayback();
      observeAds();
    } else if (message.command === "change-speed") {
      setSpeedPlaybackRate(parseFloat(message.playbackRate));
    }
  });
})();
