// Letters and Sounds / ELS — Phase 2 and Phase 3 grapheme data.
// Per-user progress status is stored separately via the storage service.
//
// audioKey: filename stem for /public/audio/*.wav recorded files.
// ttsText:  fallback text passed to Web Speech API when the audio file is missing.
// Always call speak(entry.audioKey, entry.ttsText) — never speak the grapheme directly.

const phonics = [
  // ─── Phase 2 ───────────────────────────────────────────────────────────────
  // Set 1
  { grapheme: 's',  audioKey: 's',        ttsText: 'sat',   phonemeDescription: 's as in sat',   exampleWords: ['sat', 'sun', 'sit'],   phase: 2, order: 1  },
  { grapheme: 'a',  audioKey: 'a',        ttsText: 'ant',   phonemeDescription: 'a as in ant',   exampleWords: ['cat', 'mat', 'tap'],   phase: 2, order: 2  },
  { grapheme: 't',  audioKey: 't',        ttsText: 'tap',   phonemeDescription: 't as in tap',   exampleWords: ['tap', 'top', 'tin'],   phase: 2, order: 3  },
  { grapheme: 'p',  audioKey: 'p',        ttsText: 'pat',   phonemeDescription: 'p as in pin',   exampleWords: ['pat', 'pin', 'pot'],   phase: 2, order: 4  },
  // Set 2
  { grapheme: 'i',  audioKey: 'i',        ttsText: 'it',    phonemeDescription: 'i as in it',    exampleWords: ['sit', 'pin', 'big'],   phase: 2, order: 5  },
  { grapheme: 'n',  audioKey: 'n',        ttsText: 'net',   phonemeDescription: 'n as in net',   exampleWords: ['net', 'nap', 'nod'],   phase: 2, order: 6  },
  { grapheme: 'm',  audioKey: 'm',        ttsText: 'map',   phonemeDescription: 'm as in map',   exampleWords: ['map', 'mat', 'mug'],   phase: 2, order: 7  },
  { grapheme: 'd',  audioKey: 'd',        ttsText: 'dog',   phonemeDescription: 'd as in dog',   exampleWords: ['dog', 'dig', 'den'],   phase: 2, order: 8  },
  // Set 3
  { grapheme: 'g',  audioKey: 'g',        ttsText: 'got',   phonemeDescription: 'g as in get',   exampleWords: ['got', 'gap', 'gum'],   phase: 2, order: 9  },
  { grapheme: 'o',  audioKey: 'o',        ttsText: 'on',    phonemeDescription: 'o as in on',    exampleWords: ['dog', 'hot', 'top'],   phase: 2, order: 10 },
  { grapheme: 'c',  audioKey: 'c',        ttsText: 'cat',   phonemeDescription: 'c as in cat',   exampleWords: ['cat', 'cop', 'can'],   phase: 2, order: 11 },
  { grapheme: 'k',  audioKey: 'k',        ttsText: 'kit',   phonemeDescription: 'k as in kit',   exampleWords: ['kit', 'kin', 'kid'],   phase: 2, order: 12 },
  // Set 4
  { grapheme: 'ck', audioKey: 'ck',       ttsText: 'duck',  phonemeDescription: 'ck as in duck', exampleWords: ['duck', 'sock', 'lock'], phase: 2, order: 13 },
  { grapheme: 'e',  audioKey: 'e',        ttsText: 'egg',   phonemeDescription: 'e as in egg',   exampleWords: ['bed', 'hen', 'net'],   phase: 2, order: 14 },
  { grapheme: 'u',  audioKey: 'u',        ttsText: 'up',    phonemeDescription: 'u as in up',    exampleWords: ['sun', 'cup', 'bus'],   phase: 2, order: 15 },
  { grapheme: 'r',  audioKey: 'r',        ttsText: 'run',   phonemeDescription: 'r as in run',   exampleWords: ['run', 'rat', 'rob'],   phase: 2, order: 16 },
  // Set 5
  { grapheme: 'h',  audioKey: 'h',        ttsText: 'hat',   phonemeDescription: 'h as in hat',   exampleWords: ['hat', 'hen', 'hot'],    phase: 2, order: 17 },
  { grapheme: 'b',  audioKey: 'b',        ttsText: 'bag',   phonemeDescription: 'b as in bag',   exampleWords: ['bag', 'bat', 'big'],    phase: 2, order: 18 },
  { grapheme: 'f',  audioKey: 'f',        ttsText: 'fan',   phonemeDescription: 'f as in fan',   exampleWords: ['fan', 'fit', 'fog'],    phase: 2, order: 19 },
  { grapheme: 'ff', audioKey: 'ff',       ttsText: 'off',   phonemeDescription: 'ff as in off',  exampleWords: ['off', 'huff', 'puff'],  phase: 2, order: 20 },
  { grapheme: 'l',  audioKey: 'l',        ttsText: 'leg',   phonemeDescription: 'l as in leg',   exampleWords: ['leg', 'lid', 'log'],    phase: 2, order: 21 },
  { grapheme: 'll', audioKey: 'll',       ttsText: 'bell',  phonemeDescription: 'll as in bell', exampleWords: ['bell', 'fill', 'ball'], phase: 2, order: 22 },
  { grapheme: 'ss', audioKey: 'ss',       ttsText: 'hiss',  phonemeDescription: 'ss as in hiss', exampleWords: ['hiss', 'kiss', 'miss'], phase: 2, order: 23 },

  // ─── Phase 3 ───────────────────────────────────────────────────────────────
  // Set 6
  { grapheme: 'j',  audioKey: 'j',        ttsText: 'jet',   phonemeDescription: 'j as in jet',   exampleWords: ['jet', 'jab', 'job'],    phase: 3, order: 1 },
  { grapheme: 'v',  audioKey: 'v',        ttsText: 'van',   phonemeDescription: 'v as in van',   exampleWords: ['van', 'vet', 'vim'],    phase: 3, order: 2 },
  { grapheme: 'w',  audioKey: 'w',        ttsText: 'wet',   phonemeDescription: 'w as in wet',   exampleWords: ['wet', 'win', 'wig'],    phase: 3, order: 3 },
  { grapheme: 'x',  audioKey: 'x',        ttsText: 'fox',   phonemeDescription: 'x as in fox',   exampleWords: ['fox', 'box', 'wax'],    phase: 3, order: 4 },
  // Set 7
  { grapheme: 'y',  audioKey: 'y',        ttsText: 'yes',   phonemeDescription: 'y as in yes',   exampleWords: ['yes', 'yap', 'yet'],    phase: 3, order: 5 },
  { grapheme: 'z',  audioKey: 'z',        ttsText: 'zip',   phonemeDescription: 'z as in zip',   exampleWords: ['zip', 'zap', 'zit'],    phase: 3, order: 6 },
  { grapheme: 'zz', audioKey: 'zz',       ttsText: 'buzz',  phonemeDescription: 'zz as in buzz', exampleWords: ['buzz', 'fizz', 'jazz'], phase: 3, order: 7 },
  { grapheme: 'qu', audioKey: 'qu',       ttsText: 'quit',  phonemeDescription: 'qu as in quit', exampleWords: ['quit', 'quiz', 'quip'], phase: 3, order: 8 },
  // Consonant digraphs
  { grapheme: 'ch', audioKey: 'ch',       ttsText: 'chip',  phonemeDescription: 'ch as in chip', exampleWords: ['chip', 'chin', 'chop'], phase: 3, order: 9  },
  { grapheme: 'sh', audioKey: 'sh',       ttsText: 'ship',  phonemeDescription: 'sh as in ship', exampleWords: ['ship', 'shop', 'shed'], phase: 3, order: 10 },
  { grapheme: 'th', audioKey: 'th',       ttsText: 'thin',  phonemeDescription: 'th as in thin', exampleWords: ['thin', 'this', 'then'], phase: 3, order: 11 },
  { grapheme: 'ng', audioKey: 'ng',       ttsText: 'ring',  phonemeDescription: 'ng as in ring', exampleWords: ['ring', 'sing', 'king'], phase: 3, order: 12 },
  // Vowel digraphs and trigraphs
  { grapheme: 'ai',  audioKey: 'ai',      ttsText: 'rain',  phonemeDescription: 'ai as in rain',  exampleWords: ['rain', 'tail', 'sail'],   phase: 3, order: 13 },
  { grapheme: 'ee',  audioKey: 'ee',      ttsText: 'feet',  phonemeDescription: 'ee as in feet',  exampleWords: ['feet', 'see', 'tree'],    phase: 3, order: 14 },
  { grapheme: 'igh', audioKey: 'igh',     ttsText: 'night', phonemeDescription: 'igh as in night', exampleWords: ['night', 'light', 'high'], phase: 3, order: 15 },
  { grapheme: 'oa',  audioKey: 'oa',      ttsText: 'boat',  phonemeDescription: 'oa as in boat',  exampleWords: ['boat', 'coat', 'road'],   phase: 3, order: 16 },
  { grapheme: 'oo',  audioKey: 'oo_long', ttsText: 'moon',  phonemeDescription: 'oo as in moon',  exampleWords: ['moon', 'food', 'soon'],   phase: 3, order: 17 },
  { grapheme: 'oo',  audioKey: 'oo_short',ttsText: 'book',  phonemeDescription: 'oo as in book',  exampleWords: ['book', 'cook', 'look'],   phase: 3, order: 18 },
  { grapheme: 'ar',  audioKey: 'ar',      ttsText: 'car',   phonemeDescription: 'ar as in car',   exampleWords: ['car', 'bar', 'star'],     phase: 3, order: 19 },
  { grapheme: 'or',  audioKey: 'or',      ttsText: 'for',   phonemeDescription: 'or as in for',   exampleWords: ['for', 'horn', 'fork'],    phase: 3, order: 20 },
  { grapheme: 'ur',  audioKey: 'ur',      ttsText: 'fur',   phonemeDescription: 'ur as in fur',   exampleWords: ['fur', 'turn', 'burn'],    phase: 3, order: 21 },
  { grapheme: 'ow',  audioKey: 'ow',      ttsText: 'cow',   phonemeDescription: 'ow as in cow',   exampleWords: ['cow', 'how', 'now'],      phase: 3, order: 22 },
  { grapheme: 'oi',  audioKey: 'oi',      ttsText: 'coin',  phonemeDescription: 'oi as in coin',  exampleWords: ['coin', 'foil', 'boil'],   phase: 3, order: 23 },
  { grapheme: 'ear', audioKey: 'ear',     ttsText: 'ear',   phonemeDescription: 'ear as in ear',  exampleWords: ['ear', 'dear', 'fear'],    phase: 3, order: 24 },
  { grapheme: 'air', audioKey: 'air',     ttsText: 'fair',  phonemeDescription: 'air as in fair', exampleWords: ['fair', 'hair', 'pair'],   phase: 3, order: 25 },
  { grapheme: 'ure', audioKey: 'ure',     ttsText: 'pure',  phonemeDescription: 'ure as in pure', exampleWords: ['pure', 'sure', 'cure'],   phase: 3, order: 26 },
  { grapheme: 'er',  audioKey: 'er',      ttsText: 'her',   phonemeDescription: 'er as in her',   exampleWords: ['her', 'fern', 'term'],    phase: 3, order: 27 },
]

export default phonics
