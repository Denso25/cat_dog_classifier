
if ('function' === typeof importScripts) {
    importScripts("https://unpkg.com/@tensorflow/tfjs");
    tf.setBackend('cpu');
    let model;
    const setup = async () => {
        try {
            console.log("[Worker]: Loading model...");
            model = await tf.loadLayersModel("../model_CNN/model.json");
            console.log("[Worker]: Loaded model");
        } catch (error) {
            console.log('[Worker]: Can not load model:',error);
            return postMessage({modelIsReady: false});
        }
        postMessage({ modelIsReady: true})
    }
    setup();
    onmessage = async (e) => {
        const imgDataArray = e.data.img;
        const predict = model.predict(tf.tensor(imgDataArray))
        postMessage({ prediction: Array.from(await predict.data())[0] });
    }
}



