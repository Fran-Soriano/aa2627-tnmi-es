
// E2. Poesia concreta generativa
//
// MAKE GOOD THINGS HAPPEN
//
// Font: Sigana Condensed
// Canvas: 800 x 600
//
// Parole rosso fucsia.
// Intersezioni fra righe diverse: arancione.
// Animazione autonoma, interazione mouse,
// rimpicciolimento lento e pause ritmiche.

// ==========================================
// PARAMETRI
// ==========================================

const W = 800;
const H = 600;

const CARTA = "#EFE8DA";
const ROSSO = "#FF0046";
const ARANCIONE = "#FF8C00";

const FILE_ROSSO = "Sigana Condensed.otf";

const PAROLE = [
  "MAKE",
  "GOOD",
  "THINGS",
  "HAPPEN"
];

const N_RIGHE = 9;

// Tre dimensioni
const GRANDE = 1.45;
const MEDIA = 1.00;
const PICCOLA = 0.58;

// Movimento orizzontale
const VELOCITA = 38;

// Animazione autonoma
const VELOCITA_RESPIRO = 1.25;
const INTENSITA_RESPIRO = 0.30;

const VELOCITA_ONDA = 0.72;
const INTENSITA_ONDA = 0.12;

// Interazione mouse
const RAGGIO_MOUSE = 185;
const FORZA_MOUSE = 0.95;

// Influenza righe vicine
const FORZA_VICINI = 0.32;

// Crescita e riduzione
const REATTIVITA_CRESCITA = 10;
const REATTIVITA_RIDUZIONE = 3.2;

// Pause ritmiche
const DURATA_CICLO = 11;
const INIZIO_PAUSA = 6;
const FINE_PAUSA = 9;
const VELOCITA_MINIMA = 0.18;

const SPAZIO_PAROLE = 18;
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

let tempoAnimazione = 0;

// Livello grafico temporaneo
let livelloRiga;

// Array riutilizzati per rilevare
// le sovrapposizioni pixel per pixel
let occupazione;
let intersezioni;

// Immagine finale aggiornata nei pixel
let immagineFinale;

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

  livelloRiga = createGraphics(W, H);
  livelloRiga.pixelDensity(1);

  occupazione = new Uint8Array(W * H);
  intersezioni = new Uint8Array(W * H);

  immagineFinale = createImage(W, H);
  immagineFinale.loadPixels();
}

// ==========================================
// DRAW
// ==========================================

function draw() {

  const dt = min(deltaTime / 1000, 0.05);

  const fattoreVelocita =
    calcolaRallentamento();

  tempoAnimazione += dt * fattoreVelocita;

  aggiornaMovimento(
    tempoAnimazione,
    dt,
    fattoreVelocita
  );

  disegnaComposizione();
}

// ==========================================
// RALLENTAMENTO PERIODICO
// ==========================================

function calcolaRallentamento() {

  const fase =
    (millis() / 1000) % DURATA_CICLO;

  if (fase < INIZIO_PAUSA - 1) {
    return 1;
  }

  if (fase < INIZIO_PAUSA) {

    const t =
      fase - (INIZIO_PAUSA - 1);

    const morbido =
      t * t * (3 - 2 * t);

    return lerp(
      1,
      VELOCITA_MINIMA,
      morbido
    );
  }

  if (fase < FINE_PAUSA) {
    return VELOCITA_MINIMA;
  }

  const t =
    (fase - FINE_PAUSA) /
    (DURATA_CICLO - FINE_PAUSA);

  const morbido =
    t * t * (3 - 2 * t);

  return lerp(
    VELOCITA_MINIMA,
    1,
    morbido
  );
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

  const dati =
    prova.drawingContext.getImageData(
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

  altezzaFont = max(
    1,
    maxY - minY + 1
  );

  centroFont =
    (minY + maxY) / 2 - 240;

  prova.remove();
}

// ==========================================
// PREPARAZIONE IMMAGINI PAROLE
// ==========================================

function preparaImmagini() {

  const misura =
    createGraphics(1200, 300);

  misura.pixelDensity(1);
  misura.textFont(fontRosso);
  misura.textSize(REF_TESTO);
  misura.textAlign(LEFT, BASELINE);

  for (const parola of PAROLE) {

    const larghezzaTesto =
      misura.textWidth(parola);

    const margine = 8;

    const larghezza =
      ceil(larghezzaTesto) +
      margine * 2;

    const altezza = 150;

    const livello =
      createGraphics(
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
      larghezza,
      altezza,
      larghezzaTesto
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
      (
        interlinea *
        0.75 *
        REF_TESTO /
        altezzaFont
      ) * dimensioni[i];

    const parole = [];

    for (let j = 0; j < PAROLE.length; j++) {

      parole.push({

        testo: PAROLE[j],

        scala: 1,
        obiettivo: 1,

        fase:
          i * 1.37 + j * 1.83,

        corpoBase,

        x: 0,
        y: interlinea * (i + 0.5),

        larghezza: 0
      });
    }

    righe.push({

      indice: i,

      y: interlinea * (i + 0.5),

      direzione:
        i % 2 === 0 ? 1 : -1,

      velocita:
        VELOCITA *
        (0.85 + i * 0.05),

      offset: i * 110,

      parole,

      larghezzaTotale: 1
    });
  }
}

// ==========================================
// AGGIORNAMENTO MOVIMENTO
// ==========================================

function aggiornaMovimento(
  tempo,
  dt,
  velocita
) {

  const mouseDentro =
    mouseAttivo &&
    mouseX >= 0 &&
    mouseX < W &&
    mouseY >= 0 &&
    mouseY < H;

  const obiettivoMouse =
    mouseDentro ? 1 : 0;

  influenzaMouse +=
    (obiettivoMouse - influenzaMouse) *
    (1 - exp(-6 * dt));

  for (const riga of righe) {
    calcolaPosizioni(riga);
  }

  // Obiettivi delle dimensioni
  for (let i = 0; i < righe.length; i++) {

    const riga = righe[i];

    for (
      let j = 0;
      j < riga.parole.length;
      j++
    ) {

      const parola = riga.parole[j];

      const respiro = sin(
        tempo * VELOCITA_RESPIRO +
        parola.fase
      );

      const onda = sin(
        tempo * VELOCITA_ONDA +
        parola.fase * 1.73
      );

      let obiettivo =
        1 +
        respiro * INTENSITA_RESPIRO +
        onda * INTENSITA_ONDA;

      // Mouse: ingrandimento enfatizzato
      if (influenzaMouse > 0.001) {

        const distanza =
          distanzaMouseParola(
            riga,
            parola
          );

        const influenza = exp(
          -pow(
            distanza / RAGGIO_MOUSE,
            2
          )
        );

        obiettivo +=
          influenza *
          FORZA_MOUSE *
          influenzaMouse;
      }

      // Influenza righe vicine
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

        compensazione -=
          (vicino.scala - 1) *
          FORZA_VICINI;
      }

      obiettivo += compensazione;

      parola.obiettivo = constrain(
        obiettivo,
        0.55,
        2.10
      );
    }
  }

  // Crescita rapida, riduzione lenta
  for (const riga of righe) {

    for (const parola of riga.parole) {

      const staCrescendo =
        parola.obiettivo >
        parola.scala;

      const reattivita =
        staCrescendo
          ? REATTIVITA_CRESCITA
          : REATTIVITA_RIDUZIONE;

      const morbidezza =
        1 - exp(
          -reattivita *
          dt *
          (0.55 + 0.45 * velocita)
        );

      parola.scala +=
        (
          parola.obiettivo -
          parola.scala
        ) * morbidezza;
    }

    riga.offset +=
      riga.velocita *
      riga.direzione *
      dt *
      velocita;
  }

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
      (
        parola.corpoBase /
        REF_TESTO
      ) * parola.scala;

    parola.larghezza =
      dati.larghezzaTesto * scala;

    larghezzaTotale +=
      parola.larghezza +
      SPAZIO_PAROLE;
  }

  riga.larghezzaTotale =
    max(1, larghezzaTotale);

  let posizione =
    riga.offset %
    riga.larghezzaTotale;

  if (posizione < 0) {
    posizione += riga.larghezzaTotale;
  }

  let x = posizione;

  for (const parola of riga.parole) {

    parola.x =
      x + parola.larghezza / 2;

    parola.y = riga.y;

    x +=
      parola.larghezza +
      SPAZIO_PAROLE;
  }
}

// ==========================================
// DISTANZA MOUSE
// ==========================================

function distanzaMouseParola(
  riga,
  parola
) {

  const periodo =
    riga.larghezzaTotale;

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
// DISEGNO DELLA SINGOLA RIGA
// ==========================================

function disegnaRiga(riga) {

  livelloRiga.clear();
  livelloRiga.imageMode(CENTER);

  const periodo =
    riga.larghezzaTotale;

  if (periodo <= 0) return;

  const copie =
    ceil(W / periodo) + 2;

  for (const parola of riga.parole) {

    const dati =
      immaginiParole[parola.testo];

    const scala =
      (
        parola.corpoBase /
        REF_TESTO
      ) * parola.scala;

    const larghezza =
      dati.larghezza * scala;

    const altezza =
      dati.altezza * scala;

    for (
      let k = -copie;
      k <= copie;
      k++
    ) {

      const x =
        parola.x + k * periodo;

      if (
        x + larghezza / 2 < 0 ||
        x - larghezza / 2 > W
      ) {
        continue;
      }

      livelloRiga.image(
        dati.immagine,
        x,
        parola.y,
        larghezza,
        altezza
      );
    }
  }
}

// ==========================================
// DISEGNO CON INTERSEZIONI ARANCIONI
// ==========================================

function disegnaComposizione() {

  // Azzera le maschere
  occupazione.fill(0);
  intersezioni.fill(0);

  // Analizza una riga per volta.
  // In questo modo contiamo soltanto
  // le sovrapposizioni fra righe diverse.

  for (const riga of righe) {

    disegnaRiga(riga);

    livelloRiga.loadPixels();

    const pixels = livelloRiga.pixels;

    for (let i = 0; i < W * H; i++) {

      const alpha =
        pixels[i * 4 + 3];

      // Soglia per riconoscere
      // la presenza di una lettera
      if (alpha > 25) {

        if (occupazione[i] > 0) {

          // Questo pixel appartiene
          // ad almeno due righe
          intersezioni[i] = 1;
        }

        occupazione[i] = 1;
      }
    }
  }

  // Colori della composizione finale
  const sfondoR = 239;
  const sfondoG = 232;
  const sfondoB = 218;

  const rossoR = 255;
  const rossoG = 0;
  const rossoB = 70;

  const arancioR = 255;
  const arancioG = 140;
  const arancioB = 0;

  immagineFinale.loadPixels();

  const pixelsFinali =
    immagineFinale.pixels;

  for (let i = 0; i < W * H; i++) {

    const indice = i * 4;

    if (intersezioni[i]) {

      // Intersezione: arancione
      pixelsFinali[indice] = arancioR;
      pixelsFinali[indice + 1] = arancioG;
      pixelsFinali[indice + 2] = arancioB;

    } else if (occupazione[i]) {

      // Testo normale: rosso
      pixelsFinali[indice] = rossoR;
      pixelsFinali[indice + 1] = rossoG;
      pixelsFinali[indice + 2] = rossoB;

    } else {

      // Sfondo bianco sporco
      pixelsFinali[indice] = sfondoR;
      pixelsFinali[indice + 1] = sfondoG;
      pixelsFinali[indice + 2] = sfondoB;
    }

    pixelsFinali[indice + 3] = 255;
  }

  immagineFinale.updatePixels();

  image(
    immagineFinale,
    0,
    0
  );
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
