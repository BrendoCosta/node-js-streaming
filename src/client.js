window.onload = () => {

    let DEBUG_MODE         = false;

    DEBUG_MODE ? console.log("CLIENT: Initializing...") : null ;

    let IP_ADDRESS         = "192.168.100.39";
    let PORT               = 3000;
    let socket             = io.connect("http://" + IP_ADDRESS + ":" + PORT, { transports : ["websocket"] });

    let inputVideo         = document.getElementById("inputVideo");
        inputVideo.autoplay  = true;
        inputVideo.volume    = 0;
        inputVideo.muted     = true;
        inputVideo.play();

    let outputVideo        = document.getElementById("outputVideo");
        outputVideo.autoplay = true;
        outputVideo.volume   = 1;
        outputVideo.muted    = true; // Set to "false" to hear microphone audio.
    
    const TIME_SLICE       = 500; // Will sent a input video's blob every TIME_SLICE ms
    const VIDEO_MIME_TYPE  = "video/webm; codecs = vp8, opus;";
    const CONSTRAINTS      = {
        audio: {
            sampleRate: 44000,
            channelCount: 1,
            volume: 1,
            echoCancellation: true,
            noiseSuppression: true,
        },
        video: {
            width: { ideal: 480 },
            height: { ideal: 360 },
            frameRate: { ideal: 24 },
            facingMode: "user"
        }
    };

    // Input

    navigator.mediaDevices.getUserMedia(CONSTRAINTS).then((inputStream) => {
        
        DEBUG_MODE ? console.log("CLIENT: Getting user device stream...") : null ;

        inputVideo.srcObject = inputStream;
        
        let mediaRecorder = new MediaRecorder(inputStream, { mimeType: VIDEO_MIME_TYPE });
            mediaRecorder.start(TIME_SLICE);
        
        mediaRecorder.ondataavailable = (event) => {

            socket.emit("videoInputToServer", event.data);

            DEBUG_MODE ? console.log("CLIENT: Packet sent to SERVER at " + new Date()) : null ;

        }

        DEBUG_MODE ? console.log("CLIENT: ... done!") : null ;
        
    });

    // Output

    let mediaSource = new MediaSource();
    let sourceBuffer;
    outputVideo.src = window.URL.createObjectURL(mediaSource);
        outputVideo.play();

    mediaSource.addEventListener("sourceopen", (event) => {
        
        DEBUG_MODE ? console.log("CLIENT: Opening ouput video's buffer...") : null ;
        
        sourceBuffer = mediaSource.addSourceBuffer(VIDEO_MIME_TYPE);
            sourceBuffer.mode = "sequence";
        
        DEBUG_MODE ? console.log("CLIENT: ... done!") : null ;

    });

    socket.on("videoOutputFromServer", async (data) => {

        DEBUG_MODE ? console.log("CLIENT: Packet received from SERVER at " + new Date()) : null ;

        if (mediaSource.readyState === "open") {
        
            const outputVideoBlob   = new Blob([data], { "type" : VIDEO_MIME_TYPE });
            const outputVideoBuffer = await outputVideoBlob.arrayBuffer();
            sourceBuffer.appendBuffer(outputVideoBuffer);
            
            DEBUG_MODE ? console.log("CLIENT: Packet added to buffer at " + new Date()) : null ;

        }
    
    });

    outputVideo.addEventListener("timeupdate", (event) => {

        DEBUG_MODE ?
        console.log("CLIENT: stream's delay time: " + (inputVideo.currentTime - outputVideo.currentTime))
        : null;
        
        /* 
         * Try to keep 2 seconds as maximum delay time between input and output's streams.
         * The output video may be freeze while waits to input's data.
        */

        if (inputVideo.currentTime - outputVideo.currentTime > 2) {

            outputVideo.currentTime = inputVideo.currentTime;

        }

    });

}