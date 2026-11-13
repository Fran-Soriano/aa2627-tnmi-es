
// E1. Ricombinare una fotografia interattiva
//
// Fotografia: https://commons.wikimedia.org/wiki/File:Giuseppe_Arcimboldo_-_Rudolf_II_of_Habsburg_as_Vertumnus_-_Google_Art_Project.jpg
// Autore: Giuseppe Arcimboldo
//
// Procedimento:
// La fotografia parte integra.
// Cliccando su un punto si seleziona un tassello.
// Il programma analizza il suo colore medio e cerca
// automaticamente una zona cromaticamente simile.
// Il tassello si sposta autonomamente verso la zona trovata.
//
// Non è previsto il trascinamento manuale.
// Tutti i tasselli rimangono a colori.

const canvasWidth = 800;
const canvasHeight = 600;
const tileSize = 45;

const animationSpeed = 0.07;
const searchStep = 15;
const minimumDistance = 90;

let photoLayer;
let tiles = [];
let statusMessage = "Caricamento dell'immagine...";

// Puntatore personalizzato
let mousePointer;
let pointerMoved = false;

// Caricamento delle immagini
// p5.js 2 utilizza async function setup()
async function setup() {
  createCanvas(canvasWidth, canvasHeight);
  pixelDensity(1);

  // Nasconde il cursore originale
  noCursor();

  try {
    const photo = await loadImage("./arcimboldo.png");

    // Carica il puntatore PNG
    mousePointer = await loadImage("./puntatore.png");

    photoLayer = makePhotoLayer(photo);
    photoLayer.loadPixels();

    statusMessage = "";
  } catch (error) {
    statusMessage = "Immagine non trovata.";
    photoLayer = null;
  }
}

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

      // Movimento progressivo verso la destinazione
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

    // Il frammento mantiene i pixel originali
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

  // PUNTATORE PERSONALIZZATO
  // Posizione iniziale: basso al centro

  if (mousePointer) {
    push();

    imageMode(CORNER);

    if (!pointerMoved) {

      // Posizione iniziale del puntatore
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

// Rileva il movimento del mouse
function mouseMoved() {
  pointerMoved = true;
}

// Selezione di un tassello tramite clic
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

  // Analizza il colore medio del frammento
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

// Calcola il colore medio di una zona
function getAverageColor(x, y, w, h) {

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  const startX = floor(x);
  const startY = floor(y);

  // Campionamento dei pixel
  for (let py = startY; py < startY + h; py += 3) {
    for (let px = startX; px < startX + w; px += 3) {

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

// Confronta due colori
function colorDistance(colorA, colorB) {

  const differenceR = colorA.r - colorB.r;
  const differenceG = colorA.g - colorB.g;
  const differenceB = colorA.b - colorB.b;

  // Distanza cromatica RGB
  return sqrt(
    differenceR * differenceR +
    differenceG * differenceG +
    differenceB * differenceB
  );
}

// Cerca la zona più simile cromaticamente
function findSimilarArea(sourceX, sourceY, sourceColor) {

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

      // Calcola il colore medio della zona candidata
      const candidateColor = getAverageColor(
        x,
        y,
        tileSize,
        tileSize
      );

      // Misura la differenza cromatica
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

// Ridimensiona la fotografia per riempire il canvas
function makePhotoLayer(photo) {

  const scale = Math.max(
    canvasWidth / photo.width,
    canvasHeight / photo.height
  );

  const imageWidth = photo.width * scale;
  const imageHeight = photo.height * scale;

  const imageX = (canvasWidth - imageWidth) / 2;
  const imageY = (canvasHeight - imageHeight) / 2;

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
