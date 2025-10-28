// chord-validator.ts
type Fret = number | 'x';
type Voicing = { frets: Fret[]; barres?: { fret: number; from: number; to: number }[] };

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
const PC = (n: number) => ((n % 12) + 12) % 12;
const noteToPc = (name: string) => NOTES.indexOf(name.replace('Db','C#').replace('Eb','D#').replace('Gb','F#').replace('Ab','G#').replace('Bb','A#') as any);

const GUITAR_TUNING = ['E4','B3','G3','D3','A2','E2']; // [e,B,G,D,A,E] top->bottom
const UKULELE_TUNING = ['A4','E4','C4','G4'];          // [A,E,C,G] top->bottom

const midiOf = (note: string): number => {
  const m = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) {
    // Handle notes without octave like 'C', 'C#'
    const m2 = note.match(/^([A-G][#b]?)$/);
    if (!m2) throw new Error(`Bad note ${note}`);
    const [_, n] = m2;
    const pcs = {C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11} as Record<string,number>;
    // Assume octave 4 for notes without one, which is a common default
    return (4+1)*12 + pcs[n.replace('b', '#')];
  }
  const [_, n, o] = m;
  const pcs = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11} as Record<string,number>;
  return (parseInt(o)+1)*12 + pcs[n]; // MIDI standard: C-1 = 0
};

const tuningToPcs = (tuning: string[]) => tuning.map(n => PC(midiOf(n)));

const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0,4,7], 'maj7':[0,4,7,11], 'm':[0,3,7], 'm7':[0,3,7,10],
  '7':[0,4,7,10], 'm7b5':[0,3,6,10], 'dim':[0,3,6],
};

const parseRoot = (symbol: string) => {
  // examples: C, C#, Bb, F#m7b5, Dmaj7
  const m = symbol.match(/^(A#|Bb|C#|Db|D#|Eb|F#|Gb|G#|Ab|[A-G])(.*)$/);
  if (!m) throw new Error(`Bad chord symbol ${symbol}`);
  const [, root, qual] = m;
  const pc = noteToPc(root);
  // normalize quality tags to our keys
  const q = (qual === '' ? '' :
             qual.startsWith('maj7') ? 'maj7' :
             qual.startsWith('m7b5') ? 'm7b5' :
             qual.startsWith('m7') ? 'm7' :
             qual === 'm' ? 'm' :
             qual === '7' ? '7' :
             qual === 'dim' ? 'dim' :
             (()=>{ throw new Error(`Unsupported quality: ${qual} in ${symbol}`) })());
  return { rootPc: pc, quality: q };
};

const expectedSet = (rootPc: number, quality: string) =>
  new Set(CHORD_INTERVALS[quality].map(iv => PC(rootPc + iv)));

function voicingToPcs(voicing: Voicing, openPcs: number[]) {
  if (voicing.frets.length !== openPcs.length)
    throw new Error(`String count mismatch: frets=${voicing.frets.length}, tuning=${openPcs.length}`);
  const pcs: number[] = [];
  for (let i=0;i<openPcs.length;i++) {
    const f = voicing.frets[i];
    if (f === 'x') continue;
    if (typeof f !== 'number' || f < 0) throw new Error(`Bad fret ${f} at string ${i}`);
    pcs.push(PC(openPcs[i] + f));
  }
  return pcs;
}

type Catalog = Record<string, Voicing[]>;

export function validateCatalog(label: 'guitar'|'ukulele', chords: Catalog): {symbol:string; index:number; problems:string[]}[] {
  const openPcs = label === 'guitar' ? tuningToPcs(GUITAR_TUNING) : tuningToPcs(UKULELE_TUNING);
  const issues: {symbol:string; index:number; problems:string[]}[] = [];
  for (const [symbol, voicings] of Object.entries(chords)) {
    try {
        const {rootPc, quality} = parseRoot(symbol);
        const want = expectedSet(rootPc, quality);
        voicings.forEach((v, idx) => {
          try {
            const pcs = voicingToPcs(v, openPcs);
            const unique = new Set(pcs);
            const missing = [...want].filter(w => !unique.has(w));
            const extraneous = [...unique].filter(p => !want.has(p));
            const prob: string[] = [];
            if (missing.length) prob.push(`missing: ${missing.map(x=>NOTES[x]).join(',')}`);
            if (extraneous.length) prob.push(`non-chord tones: ${extraneous.map(x=>NOTES[x]).join(',')}`);
            if (!pcs.length) prob.push('all strings muted');
            if (prob.length) issues.push({symbol, index: idx, problems: prob});
          } catch(e) {
            issues.push({symbol, index: idx, problems: [(e as Error).message]});
          }
        });
    } catch(e) {
        issues.push({symbol, index: -1, problems: [(e as Error).message]});
    }
  }
  return issues;
}
