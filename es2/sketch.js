
// E2. Poesia concreta generativa
//
// Testo: testo proprio («MAKE GOOD THINGS HAPPEN»)
// Font: Sigana Condensed, https://www.dafont.com/sigana.font
//
// Composizione: nove righe di parole ripetute che scorrono in
// direzioni alternate. Le parole cambiano dimensione nel tempo e
// si ingrandiscono vicino al mouse, influenzando anche le righe vicine.
//
// Canvas: 800 x 600 pixel

// ==========================================
// PARAMETRI
// ==========================================

const W = 800;
const H = 600;

const CARTA = "#EFE8DA";
const ROSSO = "#FF0046";

const FILE_ROSSO = "Sigana Condensed.otf";

const PAROLE = [
  "MAKE",
  "GOOD",
  "THINGS",
  "HAPPEN"
];

const N_RIGHE = 9;

// Tre dimensioni di base
const GRANDE = 1.45;
const MEDIA = 1.00;
const PICCOLA = 0.58;

// Velocità dello scorrimento
const VELOCITA = 38;

// Animazione autonoma
const VELOCITA_RESPIRO = 1.25;
const INTENSITA_RESPIRO = 0.30;

// Seconda onda per un movimento più organico
const VELOCITA_ONDA = 0.72;
const INTENSITA_ONDA = 0.12;

// Interazione mouse enfatizzata
const RAGGIO_MOUSE = 185;
const FORZA_MOUSE = 0.95;

// Influenza delle righe vicine
const FORZA_VICINI = 0.32;

// Fluidità delle transizioni
const REATTIVITA = 9;

// Spazio fra le parole
const SPAZIO_PAROLE = 18;

// Dimensione di riferimento
const REF_TESTO = 100;

// ==========================================
// VARIABILI
// ==========================================

let fontRosso;

let righe = [];
let immaginiParole = {};

let altezzaFont = 70;
let centroFont = -35;

let mouseAttivo = false;
let influenzaMouse = 0;

// ==========================================
// SETUP
// ==========================================

async function setup() {

  createCanvas(W, H);

  pixelDensity(1);
  frameRate(60);

  noStroke();

  fontRosso = await loadFont(FILE_ROSSO);

  misuraFont();
  preparaImmagini();
  preparaRighe();
}

// ==========================================
// DRAW
// ==========================================

function draw() {

  background(CARTA);

  const tempo = millis() / 1000;

  const dt = min(deltaTime / 1000, 0.05);

  aggiornaMovimento(tempo, dt);

  disegnaComposizione();
}

// ==========================================
// MISURAZIONE FONT
// ==========================================

function misuraFont() {

  const prova = createGraphics(1400, 300);

  prova.pixelDensity(1);

  prova.textFont(fontRosso);
  prova.textSize(REF_TESTO);
  prova.textAlign(LEFT, BASELINE);

  prova.noStroke();
  prova.fill(255);

  prova.text(
    PAROLE.join(" "),
    40,
    240
  );

  const dati = prova.drawingContext.getImageData(
    0,
    0,
    prova.width,
    prova.height
  ).data;

  let minY = prova.height;
  let maxY = 0;

  for (let y = 0; y < prova.height; y++) {

    for (let x = 0; x < prova.width; x++) {

      const indice =
        (y * prova.width + x) * 4 + 3;

      if (dati[indice] > 8) {

        minY = min(minY, y);
        maxY = max(maxY, y);
      }
    }
  }

  altezzaFont = max(1, maxY - minY + 1);

  centroFont = (minY + maxY) / 2 - 240;

  prova.remove();
}

// ==========================================
// PREPARAZIONE IMMAGINI
// ==========================================

function preparaImmagini() {

  const misura = createGraphics(1200, 300);

  misura.pixelDensity(1);
  misura.textFont(fontRosso);
  misura.textSize(REF_TESTO);
  misura.textAlign(LEFT, BASELINE);

  for (const parola of PAROLE) {

    const larghezzaTesto =
      misura.textWidth(parola);

    const margine = 8;

    const larghezza =
      ceil(larghezzaTesto) + margine * 2;

    const altezza = 150;

    const livello = createGraphics(
      larghezza,
      altezza
    );

    livello.pixelDensity(1);
    livello.clear();

    livello.textFont(fontRosso);
    livello.textSize(REF_TESTO);
    livello.textAlign(LEFT, BASELINE);

    livello.noStroke();
    livello.fill(ROSSO);

    const baseline =
      altezza / 2 - centroFont;

    livello.text(
      parola,
      margine,
      baseline
    );

    immaginiParole[parola] = {
      immagine: livello,
      larghezza: larghezza,
      altezza: altezza,
      larghezzaTesto: larghezzaTesto
    };
  }

  misura.remove();
}

// ==========================================
// PREPARAZIONE RIGHE
// ==========================================

function preparaRighe() {

  const dimensioni = [
    GRANDE,
    MEDIA,
    PICCOLA,
    MEDIA,
    GRANDE,
    MEDIA,
    PICCOLA,
    MEDIA,
    GRANDE
  ];

  const interlinea = H / N_RIGHE;

  for (let i = 0; i < N_RIGHE; i++) {

    const corpoBase =
      (interlinea * 0.75 * REF_TESTO /
        altezzaFont) * dimensioni[i];

    const parole = [];

    for (let j = 0; j < PAROLE.length; j++) {

      parole.push({

        testo: PAROLE[j],

        scala: 1,
        obiettivo: 1,

        fase: i * 1.37 + j * 1.83,

        corpoBase: corpoBase,

        x: 0,
        y: interlinea * (i + 0.5),

        larghezza: 0
      });
    }

    righe.push({

      indice: i,

      y: interlinea * (i + 0.5),

      direzione: i % 2 === 0 ? 1 : -1,

      velocita:
        VELOCITA * (0.85 + i * 0.05),

      offset: i * 110,

      parole: parole,

      larghezzaTotale: 1
    });
  }
}

// ==========================================
// AGGIORNAMENTO ANIMAZIONE
// ==========================================

function aggiornaMovimento(tempo, dt) {

  const morbidezza =
    1 - exp(-REATTIVITA * dt);

  // Attivazione graduale del mouse
  const mouseDentro =
    mouseAttivo &&
    mouseX >= 0 &&
    mouseX < W &&
    mouseY >= 0 &&
    mouseY < H;

  const obiettivoMouse = mouseDentro ? 1 : 0;

  influenzaMouse +=
    (obiettivoMouse - influenzaMouse)
    * (1 - exp(-6 * dt));

  // Posizioni attuali
  for (const riga of righe) {
    calcolaPosizioni(riga);
  }

  // Calcolo simultaneo degli obiettivi
  for (let i = 0; i < righe.length; i++) {

    const riga = righe[i];

    for (let j = 0; j < riga.parole.length; j++) {

      const parola = riga.parole[j];

      // Prima onda autonoma
      const respiro = sin(
        tempo * VELOCITA_RESPIRO +
        parola.fase
      );

      // Seconda onda autonoma
      const onda = sin(
        tempo * VELOCITA_ONDA +
        parola.fase * 1.73
      );

      // Le parole cambiano dimensione
      // anche senza alcuna interazione
      let obiettivo =
        1 +
        respiro * INTENSITA_RESPIRO +
        onda * INTENSITA_ONDA;

      // Interazione enfatizzata
      if (influenzaMouse > 0.001) {

        const distanza =
          distanzaMouseParola(riga, parola);

        const influenza = exp(
          -pow(distanza / RAGGIO_MOUSE, 2)
        );

        // Ingrandimento molto più evidente
        obiettivo +=
          influenza *
          FORZA_MOUSE *
          influenzaMouse;
      }

      // Influenza delle righe adiacenti
      let compensazione = 0;

      for (const k of [-1, 1]) {

        const indiceVicino = i + k;

        if (
          indiceVicino < 0 ||
          indiceVicino >= righe.length
        ) {
          continue;
        }

        const vicino =
          righe[indiceVicino].parole[j];

        // Se la parola vicina cresce,
        // questa tende a rimpicciolirsi
        compensazione -=
          (vicino.scala - 1) *
          FORZA_VICINI;
      }

      obiettivo += compensazione;

      // Limiti delle dimensioni
      parola.obiettivo = constrain(
        obiettivo,
        0.55,
        2.10
      );
    }
  }

  // Applica gli ingrandimenti
  for (const riga of righe) {

    for (const parola of riga.parole) {

      parola.scala +=
        (parola.obiettivo - parola.scala)
        * morbidezza;
    }

    // Movimento orizzontale continuo
    riga.offset +=
      riga.velocita *
      riga.direzione *
      dt;
  }

  // Aggiorna le posizioni
  for (const riga of righe) {
    calcolaPosizioni(riga);
  }
}

// ==========================================
// POSIZIONAMENTO PAROLE
// ==========================================

function calcolaPosizioni(riga) {

  let larghezzaTotale = 0;

  for (const parola of riga.parole) {

    const dati =
      immaginiParole[parola.testo];

    const scala =
      (parola.corpoBase / REF_TESTO)
      * parola.scala;

    parola.larghezza =
      dati.larghezzaTesto * scala;

    larghezzaTotale +=
      parola.larghezza + SPAZIO_PAROLE;
  }

  riga.larghezzaTotale =
    max(1, larghezzaTotale);

  let posizione =
    riga.offset % riga.larghezzaTotale;

  if (posizione < 0) {
    posizione += riga.larghezzaTotale;
  }

  let x = posizione;

  for (const parola of riga.parole) {

    parola.x =
      x + parola.larghezza / 2;

    parola.y = riga.y;

    x +=
      parola.larghezza + SPAZIO_PAROLE;
  }
}

// ==========================================
// DISTANZA DEL MOUSE
// ==========================================

function distanzaMouseParola(riga, parola) {

  const periodo = riga.larghezzaTotale;

  const differenza =
    mouseX - parola.x;

  const copia =
    round(differenza / periodo);

  const centroX =
    parola.x + copia * periodo;

  return dist(
    mouseX,
    mouseY,
    centroX,
    parola.y
  );
}

// ==========================================
// DISEGNO DELLA COMPOSIZIONE
// ==========================================

function disegnaComposizione() {

  imageMode(CENTER);

  for (const riga of righe) {

    const periodo = riga.larghezzaTotale;

    if (periodo <= 0) continue;

    const copie =
      ceil(W / periodo) + 2;

    for (const parola of riga.parole) {

      const dati =
        immaginiParole[parola.testo];

      const scala =
        (parola.corpoBase / REF_TESTO)
        * parola.scala;

      const larghezza =
        dati.larghezza * scala;

      const altezza =
        dati.altezza * scala;

      for (let k = -copie; k <= copie; k++) {

        const x =
          parola.x + k * periodo;

        if (
          x + larghezza / 2 < 0 ||
          x - larghezza / 2 > W
        ) {
          continue;
        }

        image(
          dati.immagine,
          x,
          parola.y,
          larghezza,
          altezza
        );
      }
    }
  }

  imageMode(CORNER);
}

// ==========================================
// INTERAZIONE MOUSE
// ==========================================

function mouseMoved() {
  mouseAttivo = true;
}

function mouseDragged() {
  mouseAttivo = true;
}

function mouseOut() {
  mouseAttivo = false;
}
