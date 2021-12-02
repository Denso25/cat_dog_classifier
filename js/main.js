let worker = null;
let webWorkerIsReady = false;
let isWaiting = false;
let workerModelIsReady = false;
let stopPrediction = false; // true: stop, false: start
let frontCamera = false;
let model;
const DOM_EL = {
    video: null,
    canvas: null,
    ctx: null,
    btnPredictionControl: null,
    btnSwitchCamera: null,
    txtPredictionResult: null,
    imgPredictionResult: null,
}

window.addEventListener('DOMContentLoaded', async() => {
    DOM_EL.video = document.getElementById('video');
    DOM_EL.canvas = document.getElementById('smallCanvas');
    DOM_EL.ctx = DOM_EL.canvas.getContext('2d');
    DOM_EL.btnPredictionControl = document.getElementById('btnPredictionControl');
    DOM_EL.btnSwitchCamera = document.getElementById('btnSwitchCamera');
    DOM_EL.txtPredictionResult = document.getElementById('txtPredictionResult');
    DOM_EL.imgPredictionResult = document.getElementById('imgPredictionResult');
    await init();
    document.querySelector('.preloader_wrapper').style.display = 'none';
})

const init = async () => {
    try {
        DOM_EL.video.srcObject = await getFrames();
    } catch (error) {
        console.log(error)
    }
    setupModel();

    DOM_EL.video.onloadeddata = () => {
        DOM_EL.video.play();
        if (window.Worker) {
            offLoadPrediction();
        } else {
            predict()
        }
    }
    DOM_EL.btnPredictionControl.onclick = () => {
        stopPrediction = !stopPrediction;
        if (stopPrediction) {
            DOM_EL.btnPredictionControl.innerHTML = 'Start';
        } else {
            DOM_EL.btnPredictionControl.innerHTML = 'Stop';
            if (window.Worker) {
                offLoadPrediction();
            } else {
                predict()
            }
        }
    }

    DOM_EL.btnSwitchCamera.onclick = async () => {
        frontCamera = !frontCamera;
        try {
            DOM_EL.video.srcObject = await getFrames();
        } catch (error) {
            console.log(error)
        }
    }
}

const setupModel = async () => {
    if (window.Worker) {    
        worker = new Worker("web-worker/worker.js");
        worker.onmessage = (e) => {
            isWaiting = !isWaiting;
            if (e.data.modelIsReady) {
                workerModelIsReady = true;
                console.log('[Main]: Model from Worker is ready');      
            }
            const resultPrediction = e.data.prediction;
            printResult(resultPrediction);
        }

    } else {
        
        try {
            console.log('[Main]: Loading model...');
            model = await tf.loadLayersModel("../model_CNN/model.json");
            console.log('[Main]: Loaded model');
        } catch (error) {
            console.log('[Main]: Can not load model:', error);
        }
    }
}
const printResult = (result) => {
    if (result != undefined && !stopPrediction) {
        document.getElementById('imgGif').style.visibility = 'visible';
        if (result < 0.5) {
            DOM_EL.txtPredictionResult.innerHTML = '[Cat]';
            DOM_EL.imgPredictionResult.innerHTML = '';
            DOM_EL.imgPredictionResult.appendChild(UploadedImages['cat-100x100']);
        } else {
            DOM_EL.txtPredictionResult.innerHTML = '[Dog]';
            DOM_EL.imgPredictionResult.innerHTML = '';
            DOM_EL.imgPredictionResult.appendChild(UploadedImages['dog-100x100']);
        }
    } else {
        DOM_EL.txtPredictionResult.innerHTML = 'Waiting...';
        DOM_EL.imgPredictionResult.innerHTML = '';
        document.getElementById('imgGif').style.visibility = 'hidden';
    }
}

async function predict() {
    const imgDataArray = setupImg();
    const resultPrediction = Array.from(await model.predict(tf.tensor(imgDataArray)).data())[0];
    printResult(resultPrediction);
    if (!stopPrediction) {
        setTimeout(offLoadPrediction, 1500);
    }
}
function offLoadPrediction() {
    if (workerModelIsReady && isWaiting) {
        worker.postMessage({ img: setupImg() });
        isWaiting = !isWaiting;
    }
    if (!stopPrediction) {
        setTimeout(offLoadPrediction, 100);
    }
}
function setupImg() {
    DOM_EL.ctx.drawImage(DOM_EL.video, 0, 0, DOM_EL.canvas.width, DOM_EL.canvas.height);
    let imgDataArray = DOM_EL.ctx.getImageData(0, 0, 100, 100).data;
    let imgDataArray2D = [];
    let imgDataArray1D = [];
    for (let i = 0; i < imgDataArray.length; i += 4) {
        let r = imgDataArray[i] / 255;
        let g = imgDataArray[i + 1] / 255;
        let b = imgDataArray[i + 2] / 255;
        let alpha = (r + g + b) / 3;

        imgDataArray1D.push([alpha]);
        if (imgDataArray1D.length == 100) {
            imgDataArray2D.push(imgDataArray1D);
            imgDataArray1D = [];
        }
    }
    return [imgDataArray2D];
}

const getFrames = async () => {
    if (DOM_EL.video.srcObject) {
        DOM_EL.video.srcObject.getTracks().forEach(track => track.stop());
    }
    let facingMode = frontCamera ? 'environment' : 'user';
    const minMaxWH = {
        width: { min: 200, max: 640 },
        height: { min: 200, max: 480 }
    }
    const vertical = 'portrait-primary';
    if((screen.orientation.type == vertical) && (screen.width <= 600)){ 
        minMaxWH.width = {
            min: screen.width,
            max: screen.width,
        }
        minMaxWH.height = {
            min: screen.width,
            max: maxVideoHeigth(DOM_EL.video)
        }
        
    }
    const options = {
        audio: false,
        video: {
            facingMode: facingMode,
            width: minMaxWH.width,
            height: minMaxWH.height,
        }
    }
    return navigator.mediaDevices.getUserMedia(options)
        .then((stream) => stream)
        .catch((err) => {
            alert('[Main]: Can not get camera:', err);
            console.error("Oops. Something is broken.", err);
        })
}

/**
 * videoMaxHeight = [ body.offsetHeight - ( allElementsOfBody.offsetHeight - video.offsetHeight) ]
 * @param {HTMLVideoElement} video 
 */
function maxVideoHeigth (video) {
    const windowIH = window.innerHeight;
    const bodyH = document.body.offsetHeight;
    const videoH = video.offsetHeight;
    const noVideoH = bodyH - videoH;
    const maxVideoH = windowIH - noVideoH;
    return maxVideoH < screen.width ? screen.width : maxVideoH;
}
