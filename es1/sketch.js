// E1. Ricombinare una fotografia interattiva
//
// Fotografia: https://commons.wikimedia.org/wiki/File:Giuseppe_Arcimboldo_-_Rudolf_II_of_Habsburg_as_Vertumnus_-_Google_Art_Project.jpg
// Autore: Giuseppe Arcimboldo
// Procedimento: la fotografia parte integra; trascinando il puntatore nascono dei tasselli
// che mostrano il frammento raccolto nel punto di partenza, spostato in un'altra posizione.
// A ogni spostamento i tasselli alternano gruppi di uno o due esemplari a colori e in bianco e nero.

const canvasWidth = 800;
const canvasHeight = 600;
const tileSize = 45; // lato dei tasselli creati con il puntatore
const groupLengths = [1, 2]; // quanti tasselli consecutivi possono avere lo stesso aspetto

let photoLayer;
let blackAndWhiteLayer;
let tiles = [];
let statusMessage = "Caricamento dell'immagine...";
let selectedTile = null;
let offsetX = 0;
let offsetY = 0;
let groupIsBlackAndWhite = false; // aspetto del gruppo di tasselli in corso
let remainingInGroup = 1; // il primo gruppo è a colori

async function setup() {
  createCanvas(canvasWidth, canvasHeight);
  pixelDensity(1);

  try {
    const photo = await loadImage("./arcimboldo.png");
    const blackAndWhitePhoto = await loadImage("./arcimboldo nero.png.jpg");
    setPhotograph(photo, blackAndWhitePhoto);
  } catch (error) {
    console.error("Impossibile caricare le fotografie.", error);
    statusMessage = "Immagini non trovate.";
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

  // Disegna i tasselli creati dall'utente
  for (const tile of tiles) {
    push();
    noStroke();

    // Mostra il frammento raccolto nel punto di partenza, a colori o in bianco e nero
    const fragmentLayer = tile.blackAndWhite ? blackAndWhiteLayer : photoLayer;
    image(
      fragmentLayer,
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
  if (!photoLayer) return;

  // Se il puntatore è già su un tassello, lo si può spostare di nuovo
  for (let i = tiles.length - 1; i >= 0; i--) {
    const tile = tiles[i];
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
      return;
    }
  }

  // Altrimenti il clic crea un nuovo tassello nel punto premuto
  const tileX = mouseX - tileSize / 2;
  const tileY = mouseY - tileSize / 2;
  const tile = {
    x: tileX,
    y: tileY,
    w: tileSize,
    h: tileSize,
    // il frammento è quello che sta sotto il puntatore al momento del clic
    sourceX: constrain(tileX, 0, canvasWidth - tileSize),
    sourceY: constrain(tileY, 0, canvasHeight - tileSize),
    blackAndWhite: false,
    moved: false
  };

  selectedTile = tile;
  offsetX = -tileSize / 2;
  offsetY = -tileSize / 2;
  tiles.push(tile);
}

function mouseDragged() {
  if (!selectedTile) return;

  // Il sorteggio avviene al primo movimento, non con il semplice clic
  if (!selectedTile.moved) {
    selectedTile.blackAndWhite = nextBlackAndWhiteChoice();
    selectedTile.moved = true;
  }

  selectedTile.x = mouseX + offsetX;
  selectedTile.y = mouseY + offsetY;
}

// Alterna gruppi di 1 o 2 tasselli dello stesso aspetto: così il bianco e nero
// non compare mai per più di due tasselli di seguito
function nextBlackAndWhiteChoice() {
  if (remainingInGroup === 0) {
    groupIsBlackAndWhite = !groupIsBlackAndWhite;
    remainingInGroup = random(groupLengths);
  }
  remainingInGroup -= 1;
  return groupIsBlackAndWhite;
}

function mouseReleased() {
  if (!selectedTile) return;

  // Un semplice clic, senza trascinamento, non aggiunge nessun tassello
  if (!selectedTile.moved) {
    const index = tiles.indexOf(selectedTile);
    if (index !== -1) tiles.splice(index, 1);
    selectedTile = null;
    return;
  }

  selectedTile = null;
}

function setPhotograph(photo, blackAndWhitePhoto) {
  photoLayer = makePhotoLayer(photo);
  // stessa fotografia in bianco e nero, usata dai tasselli sorteggiati
  blackAndWhiteLayer = makePhotoLayer(blackAndWhitePhoto);

  tiles = [];
  statusMessage = "";
  loop();
}

// Ridimensiona la foto sul canvas e la disegna su un livello a sé stante
function makePhotoLayer(photo) {
  const scale = Math.max(canvasWidth / photo.width, canvasHeight / photo.height);
  const imageWidth = photo.width * scale;
  const imageHeight = photo.height * scale;
  const imageX = (canvasWidth - imageWidth) / 2;
  const imageY = (canvasHeight - imageHeight) / 2;

  const layer = createGraphics(canvasWidth, canvasHeight);
  layer.pixelDensity(1);
  layer.image(photo, imageX, imageY, imageWidth, imageHeight);

  return layer;
}

