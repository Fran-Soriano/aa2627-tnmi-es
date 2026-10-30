// E1. Ricombinare una fotografia interattiva
//
// Tessere e rettangoli numerosi, di formati differenti, distribuiti unicamente all'interno 
// della silhouette, interattivi e con posizioni che cambiano ad ogni aggiornamento della pagina.

const canvasWidth = 800;
const canvasHeight = 600;
const faceClearBoundary = 415; // Limite sinistro del volto da lasciare pulito
const faceTop = 160;
const faceBottom = 420;
const backgroundColorTolerance = 88;
const backgroundMaximumBrightness = 105;
const silhouetteSampleSpacing = 4;
const shadowColor = "rgba(20, 18, 16, 0.4)";

let photoLayer;
let silhouetteMask;
let tiles = [];
let statusMessage = "Caricamento dell'immagine...";
let selectedTile = null;
let offsetX = 0;
let offsetY = 0;

async function setup() {
  createCanvas(canvasWidth, canvasHeight);
  pixelDensity(1);
  connectUploadControls();

  try {
    const photo = await loadImage("./arcimboldo.png");
    setPhotograph(photo);
  } catch (error) {
    console.error("Impossibile caricare arcimboldo.png.", error);
    statusMessage = "Immagine non trovata. Caricane una con il pulsante.";
    loop();
  }
}

function draw() {
  background("#d8d6d1");

  if (!photoLayer) {
    fill("#ffffff");
    noStroke();
    textSize(18);
    text(statusMessage, 24, 36);
    return;
  }

  // Disegna l'immagine di sfondo di base
  image(photoLayer, 0, 0);

  // Disegna tutte le tessere confinate rigorosamente dentro la silhouette
  for (const tile of tiles) {
    push();
    noStroke();
    
    // Ombra per staccare la tessera
    fill(shadowColor);
    rect(tile.x + 2, tile.y + 3, tile.w, tile.h, 2);

    // Mostra il frammento proveniente da un punto differente dell'immagine
    image(
      photoLayer,
      tile.x,
      tile.y,
      tile.w,
      tile.h,
      tile.sourceX,
      tile.sourceY,
      tile.w,
      tile.h
    );

    // Evidenzia leggermente la tessera se è selezionata
    if (tile === selectedTile) {
      noFill();
      stroke(255, 200, 0, 200);
      strokeWeight(2);
      rect(tile.x, tile.y, tile.w, tile.h);
    }
    pop();
  }
}

function mousePressed() {
  for (let i = tiles.length - 1; i >= 0; i--) {
    let tile = tiles[i];
    if (
      mouseX >= tile.x &&
      mouseX <= tile.x + tile.w &&
      mouseY >= tile.y &&
      mouseY <= tile.y + tile.h
    ) {
      selectedTile = tile;
      offsetX = tile.x - mouseX;
      offsetY = tile.y - mouseY;
      
      tiles.splice(i, 1);
      tiles.push(selectedTile);
      break;
    }
  }
}

function mouseDragged() {
  if (selectedTile) {
    selectedTile.x = mouseX + offsetX;
    selectedTile.y = mouseY + offsetY;
  }
}

function mouseReleased() {
  if (selectedTile) {
    let validSource = false;
    let sX, sY;
    let attempts = 0;
    while (!validSource && attempts < 50) {
      sX = random(0, canvasWidth - selectedTile.w);
      sY = random(0, canvasHeight - selectedTile.h);
      if (isInSilhouette(sX + selectedTile.w / 2, sY + selectedTile.h / 2)) {
        validSource = true;
      }
      attempts++;
    }
    if (validSource) {
      selectedTile.sourceX = sX;
      selectedTile.sourceY = sY;
    }
  }
  selectedTile = null;
}

function setPhotograph(photo) {
  const scale = Math.max(canvasWidth / photo.width, canvasHeight / photo.height);
  const imageWidth = photo.width * scale;
  const imageHeight = photo.height * scale;
  const imageX = (canvasWidth - imageWidth) / 2;
  const imageY = (canvasHeight - imageHeight) / 2;

  photoLayer = createGraphics(canvasWidth, canvasHeight);
  photoLayer.pixelDensity(1);
  photoLayer.image(photo, imageX, imageY, imageWidth, imageHeight);
  buildSilhouetteMask();
  buildTiles();
  statusMessage = "";
  loop();
}

function buildSilhouetteMask() {
  photoLayer.loadPixels();
  const pixels = photoLayer.pixels;
  const pixelCount = canvasWidth * canvasHeight;
  const backgroundMask = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const backgroundReference = getCornerBackgroundColor(pixels);
  let queueStart = 0;
  let queueEnd = 0;

  function addBackgroundPixel(x, y) {
    const pixelIndex = y * canvasWidth + x;
    if (backgroundMask[pixelIndex]) return;

    const colorIndex = pixelIndex * 4;
    const red = pixels[colorIndex];
    const green = pixels[colorIndex + 1];
    const blue = pixels[colorIndex + 2];
    const brightness = (red + green + blue) / 3;
    const difference = colorDistance(
      { red, green, blue },
      backgroundReference
    );

    if (
      brightness <= backgroundMaximumBrightness
      && difference <= backgroundColorTolerance
    ) {
      backgroundMask[pixelIndex] = 1;
      queue[queueEnd] = pixelIndex;
      queueEnd += 1;
    }
  }

  for (let x = 0; x < canvasWidth; x += 1) {
    addBackgroundPixel(x, 0);
    addBackgroundPixel(x, canvasHeight - 1);
  }

  for (let y = 1; y < canvasHeight - 1; y += 1) {
    addBackgroundPixel(0, y);
    addBackgroundPixel(canvasWidth - 1, y);
  }

  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart];
    queueStart += 1;
    const x = pixelIndex % canvasWidth;
    const y = Math.floor(pixelIndex / canvasWidth);

    if (x > 0) addBackgroundPixel(x - 1, y);
    if (x < canvasWidth - 1) addBackgroundPixel(x + 1, y);
    if (y > 0) addBackgroundPixel(x, y - 1);
    if (y < canvasHeight - 1) addBackgroundPixel(x, y + 1);
  }

  silhouetteMask = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    silhouetteMask[index] = backgroundMask[index] ? 0 : 1;
  }
}

function getCornerBackgroundColor(pixels) {
  const cornerSize = 12;
  const corners = [
    [0, 0],
    [canvasWidth - cornerSize, 0],
    [0, canvasHeight - cornerSize],
    [canvasWidth - cornerSize, canvasHeight - cornerSize]
  ];
  const colorSamples = [];

  for (const [startX, startY] of corners) {
    for (let y = startY; y < startY + cornerSize; y += 2) {
      for (let x = startX; x < startX + cornerSize; x += 2) {
        const index = (y * canvasWidth + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        if ((red + green + blue) / 3 > backgroundMaximumBrightness) continue;
        colorSamples.push({ red, green, blue });
      }
    }
  }

  if (colorSamples.length === 0) {
    return { red: 0, green: 0, blue: 0 };
  }

  return {
    red: average(colorSamples.map((sample) => sample.red)),
    green: average(colorSamples.map((sample) => sample.green)),
    blue: average(colorSamples.map((sample) => sample.blue))
  };
}

function isInSilhouette(x, y) {
  if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return false;
  let overlapsFace = y >= faceTop && y <= faceBottom;
  if (overlapsFace && x < faceClearBoundary) return false;

  return silhouetteMask[Math.floor(y) * canvasWidth + Math.floor(x)] === 1;
}

function buildTiles() {
  tiles = [];
  // Usa millis() per fare in modo che a ogni aggiornamento/ricaricamento della pagina la disposizione cambi
  randomSeed(millis());

  let currentY = 10;
  while (currentY < canvasHeight - 15) {
    let currentX = 50;
    
    while (currentX < canvasWidth - 20) {
      let w = random([20, 30, 45, 60]);
      let h = random([20, 30, 45, 60]);
      
      let offsetXVal = random(-10, 10);
      let offsetYVal = random(-10, 10);

      let finalX = currentX + offsetXVal;
      let finalY = currentY + offsetYVal;

      if (isInSilhouette(finalX + w / 2, finalY + h / 2)) {
        let sourceX = random(0, canvasWidth - w);
        let sourceY = random(0, canvasHeight - h);
        
        tiles.push({ 
          x: finalX, 
          y: finalY, 
          w: w, 
          h: h, 
          sourceX: sourceX, 
          sourceY: sourceY 
        });
      }
      
      currentX += 25;
    }
    currentY += 25;
  }
}

function connectUploadControls() {
  const loadImageButton = document.getElementById("loadImageBtn");
  const fileInput = document.getElementById("fileInput");

  if (!loadImageButton || !fileInput) return;

  loadImageButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    statusMessage = "Caricamento dell'immagine...";
    loop();

    try {
      const photo = await loadImage(imageUrl);
      setPhotograph(photo);
    } catch (error) {
      console.error("Impossibile caricare l'immagine selezionata.", error);
      statusMessage = "Impossibile caricare il file selezionato.";
    } finally {
      URL.revokeObjectURL(imageUrl);
      fileInput.value = "";
    }
  });
}

function colorDistance(firstColor, secondColor) {
  const redDifference = firstColor.red - secondColor.red;
  const greenDifference = firstColor.green - secondColor.green;
  const blueDifference = firstColor.blue - secondColor.blue;

  return Math.sqrt(
    redDifference * redDifference
    + greenDifference * greenDifference
    + blueDifference * blueDifference
  );
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}