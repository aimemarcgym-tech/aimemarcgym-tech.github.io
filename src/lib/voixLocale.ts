// Reconnaissance vocale sur l'appareil, sans service en ligne pour la voix : on enregistre la phrase au micro, puis le modèle Whisper
// (transformers.js) la transcrit dans le navigateur. Au premier usage, le modèle (~80 Mo) est téléchargé puis gardé en mémoire du navigateur.
// Marche dans tous les navigateurs récents (Chrome, Edge, Vivaldi, Firefox…), contrairement à la reconnaissance vocale intégrée de Chrome.

const BIBLIOTHEQUE = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/+esm";
// « base » : ~3 s par phrase. « small » est un peu plus juste mais ~13 s par phrase et 250 Mo : testé, jugé trop lent. Les erreurs de « base » sont rattrapées par la correspondance par le son (page Table).
const MODELE = "Xenova/whisper-base";

type Transcripteur = (audio: Float32Array, options?: Record<string, unknown>) => Promise<{ text: string }>;

let chargement: Promise<Transcripteur> | null = null;

// Charge (une fois) la bibliothèque et le modèle ; `progression` reçoit un pourcentage de téléchargement.
export function preparerModele(progression?: (pourcent: number) => void): Promise<Transcripteur> {
  chargement ??= (async () => {
    const module = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ BIBLIOTHEQUE)) as {
      pipeline: (tache: string, modele: string, options?: Record<string, unknown>) => Promise<Transcripteur>;
    };
    const fichiers = new Map<string, number>();
    return module.pipeline("automatic-speech-recognition", MODELE, {
      progress_callback: (p: { status: string; file?: string; progress?: number }) => {
        if (p.status === "progress" && p.file && typeof p.progress === "number") {
          fichiers.set(p.file, p.progress);
          const valeurs = [...fichiers.values()];
          progression?.(Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length));
        }
      },
    });
  })().catch((e) => {
    chargement = null;
    throw e;
  });
  return chargement;
}

function reechantillonner(donnees: Float32Array, de: number, vers: number): Float32Array {
  if (de === vers) return donnees;
  const ratio = de / vers;
  const sortie = new Float32Array(Math.floor(donnees.length / ratio));
  for (let i = 0; i < sortie.length; i++) {
    const position = i * ratio;
    const a = Math.floor(position);
    const b = Math.min(a + 1, donnees.length - 1);
    sortie[i] = donnees[a] + (donnees[b] - donnees[a]) * (position - a);
  }
  return sortie;
}

// Enregistre jusqu'au silence qui suit la phrase (1,3 s), au clic d'arrêt (signal) ou au bout de 20 s.
// Renvoie le son en 16 kHz mono, ou null si personne n'a parlé.
export async function enregistrerVoix(signal: AbortSignal, surNiveau?: (niveau: number) => void): Promise<Float32Array | null> {
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const contexte = new AudioContext();
  const source = contexte.createMediaStreamSource(flux);
  const processeur = contexte.createScriptProcessor(4096, 1, 1);
  const muet = contexte.createGain();
  muet.gain.value = 0;
  const morceaux: Float32Array[] = [];
  const debut = performance.now();
  let parle = false;
  let dernierSon = 0;
  let plancher = 0;
  let blocs = 0;

  return new Promise((resolve) => {
    let termine = false;
    const finir = () => {
      if (termine) return;
      termine = true;
      processeur.disconnect();
      source.disconnect();
      flux.getTracks().forEach((t) => t.stop());
      const frequence = contexte.sampleRate;
      void contexte.close();
      if (!parle) return resolve(null);
      const total = morceaux.reduce((n, m) => n + m.length, 0);
      const tout = new Float32Array(total);
      let decalage = 0;
      for (const m of morceaux) {
        tout.set(m, decalage);
        decalage += m.length;
      }
      resolve(reechantillonner(tout, frequence, 16000));
    };
    signal.addEventListener("abort", finir);
    processeur.onaudioprocess = (e) => {
      const donnees = e.inputBuffer.getChannelData(0);
      morceaux.push(new Float32Array(donnees));
      let somme = 0;
      for (let i = 0; i < donnees.length; i++) somme += donnees[i] * donnees[i];
      const niveau = Math.sqrt(somme / donnees.length);
      surNiveau?.(niveau);
      // Bruit de fond estimé sur la première demi-seconde (plafonné au cas où l'on parle tout de suite).
      if (blocs < 6) plancher = Math.min(0.05, (plancher * blocs + niveau) / (blocs + 1));
      blocs++;
      const maintenant = performance.now();
      if (niveau > Math.max(0.02, plancher * 3)) {
        parle = true;
        dernierSon = maintenant;
      }
      if (parle && maintenant - dernierSon > 1300) finir();
      else if (!parle && maintenant - debut > 9000) finir();
      else if (maintenant - debut > 20000) finir();
    };
    source.connect(processeur);
    processeur.connect(muet);
    muet.connect(contexte.destination);
  });
}

export async function transcrire(audio: Float32Array): Promise<string> {
  const transcripteur = await preparerModele();
  const { text } = await transcripteur(audio, { language: "french", task: "transcribe" });
  return text.trim();
}
