const video = document.getElementById('video');
const mainCanvas = document.getElementById('mainCanvas');
const mainCtx = mainCanvas.getContext('2d');
const smallCanvas = document.getElementById('smallCanvas');
const smallCtx = smallCanvas.getContext('2d');

const prediction = document.getElementById('prediction');

(async () => {
    console.log('Cargando modelo...')
    model = await tf.loadLayersModel("./model_CNN/model.json")
    console.log('Modelo cargado');
})()
window.onload = () => {
    // activateCamera();
}

function activateCamera() {
    // const options = {
    //     audio: false,
    //     video: {
    //         width: 1280,
    //         height: 720
    //     }
    // }
    // if (navigator.mediaDevices.getUserMedia) {
    //     navigator.mediaDevices.getUserMedia(options).then((stream) => {
    //         video.srcObject = stream;
            processCamera();
    //         console.log('Cámara funcionando');
    //     })
    //     .catch((err) => {
            
    //         console.log(`No se pudo utilizar la cámara :( porque:\n${err}`);
    //     })
    // } else {
    //     console.log('No existe la función getUserMedia');
    // }
    

}
document.getElementById('btnProof').onclick = () => {
    mainCanvas.width = video.width;
    mainCanvas.height = video.height;
    mainCtx.drawImage(video, 0, 0, video.width, video.height,);
    smallCtx.drawImage(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height, 0, 0, 100, 100);
    
    predict();
}

function predict() {
    let imgData = smallCtx.getImageData(0, 0, 100, 100);
    let imgDataArray = imgData.data;
    let imgDataArray2D = [];
    let imgDataArray1D = [];
    for (let i = 0; i < imgDataArray.length; i += 4) {
        let r = imgDataArray[i]/255;
        let g = imgDataArray[i+1]/255;
        let b = imgDataArray[i+2]/255;
        let alpha = (r+g+b)/3;

        imgDataArray1D.push([alpha]);
        if(imgDataArray1D.length == 100) {
            imgDataArray2D.push(imgDataArray1D);
            imgDataArray1D = [];
        }

    }
    imgDataArray2D = [imgDataArray2D];
    const tensor = tf.tensor(imgDataArray2D);
    const prediction = model.predict(tensor).dataSync();
    let result = '';
    if(prediction[0] <= 0.5) {
        result = 'cat';
    } else {
        result = 'dog';
    }
    console.log(prediction);
    document.getElementById('prediction').innerHTML = result;

}
function processCamera() {
    ctx.drawImage(video, 0, 0, video.width, video.height, 0, 0, 100, 100);
}