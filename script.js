document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('graphicCanvas');
  const ctx = canvas.getContext('2d');
  const imageUpload = document.getElementById('imageUpload');
  const downloadBtn = document.getElementById('downloadBtn');
  const placeholderText = document.querySelector('.placeholder-text');

  const CANVAS_SIZE = [1800, 2250];
  const FRAME_PATH = 'frame.png';

  let frameImage = new Image();
  let userImage = null;
  let isFrameLoaded = false;
  let rotation = 0;
  let scale = 1;
  let imageOffsetX = 0;
  let imageOffsetY = 0;
  let isDragging = false, startX, startY;

  canvas.width = CANVAS_SIZE[0];
  canvas.height = CANVAS_SIZE[1];

  // Load frame
  frameImage.onload = () => { isFrameLoaded = true; if(userImage) drawGraphic(); };
  frameImage.src = FRAME_PATH;

  // Drag & zoom
  const zoomSlider = document.getElementById("zoomSlider");
  zoomSlider?.addEventListener("input", e => { scale = parseFloat(e.target.value); drawGraphic(); });

  canvas.addEventListener("mousedown", e => { isDragging = true; startX = e.offsetX; startY = e.offsetY; });
  canvas.addEventListener("mousemove", e => { 
    if(!isDragging) return;
    imageOffsetX += e.offsetX - startX;
    imageOffsetY += e.offsetY - startY;
    startX = e.offsetX; startY = e.offsetY; drawGraphic();
  });
  canvas.addEventListener("mouseup", () => isDragging=false);
  canvas.addEventListener("mouseleave", () => isDragging=false);

  // Touch
  canvas.addEventListener("touchstart", e => { 
    isDragging = true;
    const t = e.touches[0]; const rect = canvas.getBoundingClientRect();
    startX = t.clientX - rect.left; startY = t.clientY - rect.top;
  });
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if(!isDragging) return;
    const t = e.touches[0]; const rect = canvas.getBoundingClientRect();
    const x = t.clientX - rect.left; const y = t.clientY - rect.top;
    imageOffsetX += x - startX; imageOffsetY += y - startY;
    startX = x; startY = y;
    drawGraphic();
  }, { passive: false });
  canvas.addEventListener("touchend", () => isDragging=false);

  // Rotate buttons
  document.getElementById("rotateLeft").addEventListener("click", () => { rotation -= 30; if(rotation<0) rotation=330; drawGraphic(); });
  document.getElementById("rotateRight").addEventListener("click", () => { rotation += 30; if(rotation>=360) rotation=0; drawGraphic(); });

  // Image upload
  imageUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
      const img = new Image();
      img.onload = async () => {
        userImage = img;
        scale = 1; rotation = 0; imageOffsetX = 0; imageOffsetY = 0;
        if(zoomSlider) zoomSlider.value = 1;
        drawGraphic();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  
  // Draw function
  function drawGraphic(){
    if(!userImage || !isFrameLoaded) return;

    ctx.clearRect(0,0,canvas.width, canvas.height);
    const targetX = 575, targetY=855, targetW=626, targetH=630;

    const imageRatio = userImage.width / userImage.height;
    const targetRatio = targetW/targetH;

    let drawWidth, drawHeight;
    if(imageRatio>targetRatio){ drawHeight=targetH; drawWidth=userImage.width*(targetH/userImage.height); }
    else{ drawWidth=targetW; drawHeight=userImage.height*(targetW/userImage.width); }

    ctx.save();
    ctx.translate(targetX+targetW/2+imageOffsetX, targetY+targetH/2+imageOffsetY);
    ctx.rotate(rotation*Math.PI/180);
    ctx.scale(scale, scale);
    ctx.drawImage(userImage, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
    ctx.restore();

    ctx.drawImage(frameImage, 0,0, canvas.width, canvas.height);

    downloadBtn.disabled = false;
    placeholderText.style.display='none';
  }


downloadBtn.onclick = async function () {
  const dataURL = canvas.toDataURL("image/png");

  // Save to Google Drive
  const formData = new FormData();
formData.append("image", dataURL);
  
  // Download locally
  downloadFile(dataURL, "Attending Graphics.png");
  
fetch(
  "https://script.google.com/macros/s/AKfycbyQE_8jlstd7dV5KhvH07T7TY44-a5QL98aNrOfLhKqNc2ejOFNlkI73IVeoKsvug9NMQ/exec",
  {
    method: "POST",
    body: formData
  }
);

};

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isIOSChrome() {
  return /CriOS/.test(navigator.userAgent);
}

function downloadFile(url, filename = "download.png") {

  // iPhone Chrome & iOS workaround
  if (isIOS() && isIOSChrome()) {
    const win = window.open();
    win.document.write(`<img src="${url}" style="width:100%"/>`);
    return;
  }

  // Normal browsers
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


});
