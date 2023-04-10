const video = document.getElementById("video");
const p_canvas = document.getElementById("p_canvas");
const face_scan = document.getElementById("face_scan");

let faceIndex = 1;

// 사전에 학습한 모델
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
]).then(start);

function start() {
  face_scan.addEventListener("click", async function () {
    //face_scan 버튼을 누를 때
    let context = p_canvas.getContext("2d");
    context.drawImage(video, 0, 0, p_canvas.width, p_canvas.height); // (0,0)에 비디오 생성

    let dataURL = p_canvas.toDataURL();
    let _file = dataURLtoFile(dataURL, "capture.png"); // 버튼을 누를 때의 사진 저장

    video.remove();
    face_scan.remove();
    p_canvas.remove(); // 사용한 비디오, 캔버스 삭제

    const container = document.createElement("div");
    container.style.cssText = "position: absolute; top: 0; left: 0;";

    document.body.append(container);

    const image = await faceapi.bufferToImage(_file);
    container.append(image);

    const canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);

    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // 각 인식된 얼굴마다 반복
    resizedDetections.forEach(async (detection) => {
      const box = detection.detection.box;
      const faceCanvas = document.createElement("canvas");
      const faceContext = faceCanvas.getContext("2d");

      faceCanvas.width = box.width;
      faceCanvas.height = box.height;

      faceContext.drawImage(
        image,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        box.width,
        box.height
      );

      const dataUrl = faceCanvas.toDataURL();
      const linkContainer = document.createElement("div");

      linkContainer.style.cssText =
        "position: absolute; display: flex; flexDirection: column; alignItems: center;";
      linkContainer.style.top = `${box.y + box.height}px`;
      linkContainer.style.left = `${box.x}px`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `얼굴${faceIndex}.png`;
      link.innerHTML = `얼굴${faceIndex} 다운로드`;

      const img = document.createElement("img");
      img.src = dataUrl;
      img.style.maxWidth = "100%";

      linkContainer.append(link);
      linkContainer.append(img);
      container.append(linkContainer);
      faceIndex++;
    });
  });
}

function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
