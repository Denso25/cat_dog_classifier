
const listImages = [
    "https://i.postimg.cc/6qytqMDr/dog-100x100.png",
    "https://i.postimg.cc/JnTRRfd7/cat-100x100.png",
]
const UploadedImages = {};
loadImages(listImages);

/**
 * Load images from list images
 * @param {string[]} listImages 
 */
function loadImages(listImages) {
    for (let i = 0; i < listImages.length; i++) {
        const img = new Image(90);
        img.src = listImages[i];
        UploadedImages[getImageName(img.src)] = img;
    }
}

/**
 * Get image name without url extension
 * @param {string} urlImg 
 */
function getImageName(urlImg) {
    let nameImg = urlImg;
    nameImg = nameImg.substring(nameImg.lastIndexOf('/') + 1, nameImg.lastIndexOf('.'));
    return nameImg;
}


