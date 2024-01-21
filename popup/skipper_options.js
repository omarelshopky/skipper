/**
 * Generate playback speed datalist options
 */
const playbackSpeedDataList = document.querySelector("#playback-speeds");

for (let value = 3; value >= 0.25; value -= 0.25) {
  const playbackSpeedOption = document.createElement("option");
  playbackSpeedOption.value = value;
  playbackSpeedDataList.appendChild(playbackSpeedOption);
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForEvents() {
  const switchWrapper = document.querySelector("#skipper__switch-btn");
  const speedSelectorInput = document.querySelector("#skipper__speed-selector-input");

  switchWrapper.addEventListener("click", (e) => {
    /**
     * Switch the skipper state on/off for the active tab,
     * send a "switch-on/switch-off" message to the content script in the active tab.
     */
    function switchState(tabs) {
      const nextState = e.target.parentElement.classList.contains("skipper__switch-btn-wrapper--off") ? "switch-on" : "switch-off";

      if (nextState === "switch-on") {
        switchOn(e.target.parentElement);
      } else {
        switchOff(e.target.parentElement);
      }

      browser.tabs.sendMessage(tabs[0].id, {
        command: nextState,
      });

      setCurrentPlaybackRateSpeed();
    }

    browser.tabs.query({active: true, currentWindow: true})
      .then(switchState)
      .catch((error) => console.error(`Could not skipper: ${error}`));
  });

  speedSelectorInput.addEventListener("change", (e) => {
    /**
     * Switch the skipper state on/off for the active tab,
     * send a "change-speed" message to the content script in the active tab.
     */
    function changeSpeedPlayback(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "change-speed",
        playbackRate: e.target.value
      });
    }

    browser.tabs.query({active: true, currentWindow: true})
      .then(changeSpeedPlayback)
      .catch((error) => console.error(`Could not skipper: ${error}`));
  });

  speedSelectorInput.addEventListener("keyup", (e) => {
    const errorElement = document.querySelector("#skipper__speed-selector-error");
    const value = parseFloat(e.target.value);

    if (typeof value === "number" && value >= 0) {
      errorElement.classList.add("hidden");
    } else {
      errorElement.classList.remove("hidden");
    }
  });
}

/**
 * Display an error message as a modal above the normal UI
 */
function showExtensionError(error) {
  document.querySelector("#skipper__error-overlay").classList.remove("hidden");
  const errorModal = document.querySelector("#skipper__error-modal");
  errorModal.classList.remove("hidden");
  errorModal.textContent = error;
}

function reportExecuteScriptError(error) {
  showExtensionError("Failed to execute skipper content script, please reload the page." + error.message)
  console.error(`Failed to execute skipper content script: ${error.message}`);
}

function switchOn(switchWrapper) {
  switchWrapper.classList.remove("skipper__switch-btn-wrapper--off");
  switchWrapper.classList.add("skipper__switch-btn-wrapper--on");
  document.querySelector("#skipper__speed-selector-input").disabled = false;
  document.querySelector("#skipper__speed-selector-label").classList.remove("disabled");
}

function switchOff(switchWrapper) {
  switchWrapper.classList.remove("skipper__switch-btn-wrapper--on");
  switchWrapper.classList.add("skipper__switch-btn-wrapper--off");
  document.querySelector("#skipper__speed-selector-input").disabled = true;
  document.querySelector("#skipper__speed-selector-label").classList.add("disabled");
}

function setCurrentPlaybackRateSpeed() {
  browser.tabs.executeScript({ code: "document.querySelector('video').playbackRate" })
    .then(results => {
      if (results[0]) {
        document.querySelector("#skipper__speed-selector-input").value = results[0];
      }
    })
    .catch(reportExecuteScriptError);
}

function setSwitchState() {
  browser.tabs.executeScript({ code: "window.skipperIsWorking" })
    .then(results => {
      if (results[0]) {
        switchOn(document.querySelector("#skipper__switch-btn-wrapper"));
      }
    })
    .catch(reportExecuteScriptError);
}

function initializePopupState() {
  setSwitchState();
  setCurrentPlaybackRateSpeed();
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler. (in case the current tab contains a video)
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ code: "document.querySelector('video') ? true : false" })
  .then(results => {
    if (results[0]) {
      browser.tabs.executeScript({file: "/content_scripts/skipper.js"})
        .then(listenForEvents)
        .catch(reportExecuteScriptError);

      initializePopupState();
    } else {
      showExtensionError("The current tab does not contain any videos.");
    }
  })
  .catch(reportExecuteScriptError);