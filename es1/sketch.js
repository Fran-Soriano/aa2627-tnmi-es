
// E1. Ricombinare una fotografia interattiva
//
// Fotografia:
// Giuseppe Arcimboldo - Rudolf II as Vertumnus
//
// La fotografia parte integra.
// Cliccando si seleziona un tassello.
// Il programma analizza il suo colore medio
// e cerca una zona cromaticamente simile.
// Il tassello si sposta automaticamente.
//
// Puntatore personalizzato:
// giallo canarino misto a senape chiaro.

const canvasWidth = 800;
const canvasHeight = 600;
const tileSize = 45;

const animationSpeed = 0.07;
const searchStep = 15;
const minimumDistance = 90;

// Colore del puntatore
const pointerColor = "#F5D547";

let photoLayer;
let tiles = [];

let statusMessage = "Caricamento dell'immagine...";

// Puntatore personalizzato
let mousePointer;
let pointerMoved = false;

// ==========================================
// SETUP
// ==========================================

async function setup() {

  createCanvas(canvasWidth, canvasHeight);
  pixelDensity(1);

  // Nasconde il cursore originale
  noCursor();

  try {

    const photo = await loadImage("./arcimboldo.png");

    // Carica il puntatore PNG
    mousePointer = await loadImage("./puntatore.png");

    // Applica il nuovo colore
    coloraPuntatore(mousePointer);

    photoLayer = makePhotoLayer(photo);
    photoLayer.loadPixels();

    statusMessage = "";

  } catch (error) {

    statusMessage = "Immagine non trovata.";
    photoLayer = null;
  }
}

// ==========================================
// COLORAZIONE DEL PUNTATORE
// ==========================================

function coloraPuntatore(img) {

  img.loadPixels();

  const colore = color(pointerColor);

  const r = red(colore);
  const g = green(colore);
  const b = blue(colore);

  // Cambia il colore mantenendo
  // la trasparenza originale del PNG
  for (let i = 0; i < img.pixels.length; i += 4) {

    const alpha = img.pixels[i + 3];

    if (alpha > 0) {

      img.pixels[i] = r;
      img.pixels[i + 1] = g;
      img.pixels[i + 2] = b;
    }
  }

  img.updatePixels();
}

// ==========================================
// DRAW
// ==========================================

function draw() {

  background("#d8d6d1");

  if (!photoLayer) {

    fill(255);
    noStroke();
    textSize(18);

    text(statusMessage, 24, 36);

    return;
  }

  // Fotografia originale
  image(photoLayer, 0, 0);

  // Disegno e animazione dei tasselli
  for (const tile of tiles) {

    if (!tile.arrived) {

      // Movimento verso la destinazione
      tile.x = lerp(
        tile.x,
        tile.targetX,
        animationSpeed
      );

      tile.y = lerp(
        tile.y,
        tile.targetY,
        animationSpeed
      );

      // Controllo dell'arrivo
      const distance = dist(
        tile.x,
        tile.y,
        tile.targetX,
        tile.targetY
      );

      if (distance < 0.5) {

        tile.x = tile.targetX;
        tile.y = tile.targetY;

        tile.arrived = true;
      }
    }

    // Mantiene i pixel originali
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
  }

  // ========================================
  // PUNTATORE PERSONALIZZATO
  // ========================================

  if (mousePointer) {

    push();

    imageMode(CORNER);

    if (!pointerMoved) {

      // Posizione iniziale:
      // in basso al centro
      image(
        mousePointer,
        canvasWidth / 2 - 30,
        canvasHeight - 85,
        60,
        60
      );

    } else if (
      mouseX >= 0 &&
      mouseX < canvasWidth &&
      mouseY >= 0 &&
      mouseY < canvasHeight
    ) {

      // Il puntatore segue il mouse
      image(
        mousePointer,
        mouseX - 30,
        mouseY - 25,
        60,
        60
      );
    }

    pop();
  }
}

// ==========================================
// MOVIMENTO DEL MOUSE
// ==========================================

function mouseMoved() {
  pointerMoved = true;
}

// ==========================================
// SELEZIONE DI UN TASSELLO
// ==========================================

function mousePressed() {

  if (!photoLayer) return;

  // Evita clic fuori dal canvas
  if (
    mouseX < 0 ||
    mouseX >= canvasWidth ||
    mouseY < 0 ||
    mouseY >= canvasHeight
  ) {
    return;
  }

  // Posizione iniziale del tassello
  const tileX = constrain(
    mouseX - tileSize / 2,
    0,
    canvasWidth - tileSize
  );

  const tileY = constrain(
    mouseY - tileSize / 2,
    0,
    canvasHeight - tileSize
  );

  // Analizza il colore medio
  const sourceColor = getAverageColor(
    tileX,
    tileY,
    tileSize,
    tileSize
  );

  // Cerca una zona cromaticamente simile
  const destination = findSimilarArea(
    tileX,
    tileY,
    sourceColor
  );

  // Crea il tassello
  const tile = {

    x: tileX,
    y: tileY,

    w: tileSize,
    h: tileSize,

    sourceX: tileX,
    sourceY: tileY,

    targetX: destination.x,
    targetY: destination.y,

    arrived: false
  };

  tiles.push(tile);
}

// ==========================================
// CALCOLO DEL COLORE MEDIO
// ==========================================

function getAverageColor(x, y, w, h) {

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  let count = 0;

  const startX = floor(x);
  const startY = floor(y);

  // Campionamento dei pixel
  for (
    let py = startY;
    py < startY + h;
    py += 3
  ) {

    for (
      let px = startX;
      px < startX + w;
      px += 3
    ) {

      const index = 4 * (
        py * canvasWidth + px
      );

      totalR += photoLayer.pixels[index];
      totalG += photoLayer.pixels[index + 1];
      totalB += photoLayer.pixels[index + 2];

      count++;
    }
  }

  return {

    r: totalR / count,
    g: totalG / count,
    b: totalB / count
  };
}

// ==========================================
// DISTANZA CROMATICA
// ==========================================

function colorDistance(colorA, colorB) {

  const differenceR =
    colorA.r - colorB.r;

  const differenceG =
    colorA.g - colorB.g;

  const differenceB =
    colorA.b - colorB.b;

  // Distanza cromatica RGB
  return sqrt(
    differenceR * differenceR +
    differenceG * differenceG +
    differenceB * differenceB
  );
}

// ==========================================
// RICERCA DELLA ZONA SIMILE
// ==========================================

function findSimilarArea(
  sourceX,
  sourceY,
  sourceColor
) {

  let bestX = sourceX;
  let bestY = sourceY;

  let bestDifference = Infinity;

  // Analizza diverse zone della fotografia
  for (
    let y = 0;
    y <= canvasHeight - tileSize;
    y += searchStep
  ) {

    for (
      let x = 0;
      x <= canvasWidth - tileSize;
      x += searchStep
    ) {

      // Evita zone troppo vicine all'origine
      const spatialDistance = dist(
        sourceX,
        sourceY,
        x,
        y
      );

      if (spatialDistance < minimumDistance) {
        continue;
      }

      // Colore medio della zona candidata
      const candidateColor = getAverageColor(
        x,
        y,
        tileSize,
        tileSize
      );

      // Differenza cromatica
      const difference = colorDistance(
        sourceColor,
        candidateColor
      );

      // Conserva la zona più simile
      if (difference < bestDifference) {

        bestDifference = difference;

        bestX = x;
        bestY = y;
      }
    }
  }

  return {
    x: bestX,
    y: bestY
  };
}

// ==========================================
// RIDIMENSIONAMENTO FOTOGRAFIA
// ==========================================

function makePhotoLayer(photo) {

  const scale = Math.max(
    canvasWidth / photo.width,
    canvasHeight / photo.height
  );

  const imageWidth = photo.width * scale;
  const imageHeight = photo.height * scale;

  const imageX =
    (canvasWidth - imageWidth) / 2;

  const imageY =
    (canvasHeight - imageHeight) / 2;

  const layer = createGraphics(
    canvasWidth,
    canvasHeight
  );

  layer.pixelDensity(1);

  layer.image(
    photo,
    imageX,
    imageY,
    imageWidth,
    imageHeight
  );

  return layer;
}
