class Skipper {
    constructor() {
        this.workingVideo = this.#getWorkingVideo();

        if (!this.workingVideo) {
            console.log("There is no working video");
            return;
        }

        this.workingVideo.playbackRate = 20;
    }

    #getWorkingVideo() {
        return document.querySelector("video");
    }
}

const skipper = new Skipper();
// At each ad end the playback rate should be set again