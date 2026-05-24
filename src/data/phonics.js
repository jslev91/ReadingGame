// Letters and Sounds / ELS — Phase 2 and Phase 3 grapheme data.
// Per-user progress status is stored separately via the storage service.
//
// ttsText: a real word passed to speak(). TTS cannot reliably produce isolated
// phoneme sounds — repeated characters are read as letter names. Using a full word
// is the most reliable interim approach until recorded audio is added.
// For consonants: use the first example word (grapheme is at the start).
// For vowels: use the "as in" keyword from phonemeDescription (starts with the vowel).
// For digraphs at word-end (ck, ng, ss…): use any example word featuring the sound.

const phonics = [
  // ─── Phase 2 ───────────────────────────────────────────────────────────────
  // Set 1
  { grapheme: 's',  ttsText: 'sat',   phonemeDescription: 's as in sat',   exampleWords: ['sat', 'sun', 'sit'],   phase: 2, order: 1  },
  { grapheme: 'a',  ttsText: 'ant',   phonemeDescription: 'a as in ant',   exampleWords: ['cat', 'mat', 'tap'],   phase: 2, order: 2  },
  { grapheme: 't',  ttsText: 'tap',   phonemeDescription: 't as in tap',   exampleWords: ['tap', 'top', 'tin'],   phase: 2, order: 3  },
  { grapheme: 'p',  ttsText: 'pat',   phonemeDescription: 'p as in pin',   exampleWords: ['pat', 'pin', 'pot'],   phase: 2, order: 4  },
  // Set 2
  { grapheme: 'i',  ttsText: 'it',    phonemeDescription: 'i as in it',    exampleWords: ['sit', 'pin', 'big'],   phase: 2, order: 5  },
  { grapheme: 'n',  ttsText: 'net',   phonemeDescription: 'n as in net',   exampleWords: ['net', 'nap', 'nod'],   phase: 2, order: 6  },
  { grapheme: 'm',  ttsText: 'map',   phonemeDescription: 'm as in map',   exampleWords: ['map', 'mat', 'mug'],   phase: 2, order: 7  },
  { grapheme: 'd',  ttsText: 'dog',   phonemeDescription: 'd as in dog',   exampleWords: ['dog', 'dig', 'den'],   phase: 2, order: 8  },
  // Set 3
  { grapheme: 'g',  ttsText: 'got',   phonemeDescription: 'g as in get',   exampleWords: ['got', 'gap', 'gum'],   phase: 2, order: 9  },
  { grapheme: 'o',  ttsText: 'on',    phonemeDescription: 'o as in on',    exampleWords: ['dog', 'hot', 'top'],   phase: 2, order: 10 },
  { grapheme: 'c',  ttsText: 'cat',   phonemeDescription: 'c as in cat',   exampleWords: ['cat', 'cop', 'can'],   phase: 2, order: 11 },
  { grapheme: 'k',  ttsText: 'kit',   phonemeDescription: 'k as in kit',   exampleWords: ['kit', 'kin', 'kid'],   phase: 2, order: 12 },
  // Set 4
  { grapheme: 'ck', ttsText: 'duck',  phonemeDescription: 'ck as in duck', exampleWords: ['duck', 'sock', 'lock'], phase: 2, order: 13 },
  { grapheme: 'e',  ttsText: 'egg',   phonemeDescription: 'e as in egg',   exampleWords: ['bed', 'hen', 'net'],   phase: 2, order: 14 },
  { grapheme: 'u',  ttsText: 'up',    phonemeDescription: 'u as in up',    exampleWords: ['sun', 'cup', 'bus'],   phase: 2, order: 15 },
  { grapheme: 'r',  ttsText: 'run',   phonemeDescription: 'r as in run',   exampleWords: ['run', 'rat', 'rob'],   phase: 2, order: 16 },
  // Set 5
  { grapheme: 'h',  ttsText: 'hat',   phonemeDescription: 'h as in hat',   exampleWords: ['hat', 'hen', 'hot'],    phase: 2, order: 17 },
  { grapheme: 'b',  ttsText: 'bag',   phonemeDescription: 'b as in bag',   exampleWords: ['bag', 'bat', 'big'],    phase: 2, order: 18 },
  { grapheme: 'f',  ttsText: 'fan',   phonemeDescription: 'f as in fan',   exampleWords: ['fan', 'fit', 'fog'],    phase: 2, order: 19 },
  { grapheme: 'ff', ttsText: 'off',   phonemeDescription: 'ff as in off',  exampleWords: ['off', 'huff', 'puff'],  phase: 2, order: 20 },
  { grapheme: 'l',  ttsText: 'leg',   phonemeDescription: 'l as in leg',   exampleWords: ['leg', 'lid', 'log'],    phase: 2, order: 21 },
  { grapheme: 'll', ttsText: 'bell',  phonemeDescription: 'll as in bell', exampleWords: ['bell', 'fill', 'ball'], phase: 2, order: 22 },
  { grapheme: 'ss', ttsText: 'hiss',  phonemeDescription: 'ss as in hiss', exampleWords: ['hiss', 'kiss', 'miss'], phase: 2, order: 23 },

  // ─── Phase 3 ───────────────────────────────────────────────────────────────
  // Set 6
  { grapheme: 'j',  ttsText: 'jet',   phonemeDescription: 'j as in jet',   exampleWords: ['jet', 'jab', 'job'],    phase: 3, order: 1 },
  { grapheme: 'v',  ttsText: 'van',   phonemeDescription: 'v as in van',   exampleWords: ['van', 'vet', 'vim'],    phase: 3, order: 2 },
  { grapheme: 'w',  ttsText: 'wet',   phonemeDescription: 'w as in wet',   exampleWords: ['wet', 'win', 'wig'],    phase: 3, order: 3 },
  { grapheme: 'x',  ttsText: 'fox',   phonemeDescription: 'x as in fox',   exampleWords: ['fox', 'box', 'wax'],    phase: 3, order: 4 },
  // Set 7
  { grapheme: 'y',  ttsText: 'yes',   phonemeDescription: 'y as in yes',   exampleWords: ['yes', 'yap', 'yet'],    phase: 3, order: 5 },
  { grapheme: 'z',  ttsText: 'zip',   phonemeDescription: 'z as in zip',   exampleWords: ['zip', 'zap', 'zit'],    phase: 3, order: 6 },
  { grapheme: 'zz', ttsText: 'buzz',  phonemeDescription: 'zz as in buzz', exampleWords: ['buzz', 'fizz', 'jazz'], phase: 3, order: 7 },
  { grapheme: 'qu', ttsText: 'quit',  phonemeDescription: 'qu as in quit', exampleWords: ['quit', 'quiz', 'quip'], phase: 3, order: 8 },
  // Consonant digraphs
  { grapheme: 'ch', ttsText: 'chip',  phonemeDescription: 'ch as in chip', exampleWords: ['chip', 'chin', 'chop'], phase: 3, order: 9  },
  { grapheme: 'sh', ttsText: 'ship',  phonemeDescription: 'sh as in ship', exampleWords: ['ship', 'shop', 'shed'], phase: 3, order: 10 },
  { grapheme: 'th', ttsText: 'thin',  phonemeDescription: 'th as in thin', exampleWords: ['thin', 'this', 'then'], phase: 3, order: 11 },
  { grapheme: 'ng', ttsText: 'ring',  phonemeDescription: 'ng as in ring', exampleWords: ['ring', 'sing', 'king'], phase: 3, order: 12 },
  // Vowel digraphs and trigraphs
  { grapheme: 'ai',  ttsText: 'rain',  phonemeDescription: 'ai as in rain',  exampleWords: ['rain', 'tail', 'sail'],   phase: 3, order: 13 },
  { grapheme: 'ee',  ttsText: 'feet',  phonemeDescription: 'ee as in feet',  exampleWords: ['feet', 'see', 'tree'],    phase: 3, order: 14 },
  { grapheme: 'igh', ttsText: 'night', phonemeDescription: 'igh as in night', exampleWords: ['night', 'light', 'high'], phase: 3, order: 15 },
  { grapheme: 'oa',  ttsText: 'boat',  phonemeDescription: 'oa as in boat',  exampleWords: ['boat', 'coat', 'road'],   phase: 3, order: 16 },
  { grapheme: 'oo',  ttsText: 'moon',  phonemeDescription: 'oo as in moon',  exampleWords: ['moon', 'food', 'soon'],   phase: 3, order: 17 },
  { grapheme: 'oo',  ttsText: 'book',  phonemeDescription: 'oo as in book',  exampleWords: ['book', 'cook', 'look'],   phase: 3, order: 18 },
  { grapheme: 'ar',  ttsText: 'car',   phonemeDescription: 'ar as in car',   exampleWords: ['car', 'bar', 'star'],     phase: 3, order: 19 },
  { grapheme: 'or',  ttsText: 'for',   phonemeDescription: 'or as in for',   exampleWords: ['for', 'horn', 'fork'],    phase: 3, order: 20 },
  { grapheme: 'ur',  ttsText: 'fur',   phonemeDescription: 'ur as in fur',   exampleWords: ['fur', 'turn', 'burn'],    phase: 3, order: 21 },
  { grapheme: 'ow',  ttsText: 'cow',   phonemeDescription: 'ow as in cow',   exampleWords: ['cow', 'how', 'now'],      phase: 3, order: 22 },
  { grapheme: 'oi',  ttsText: 'coin',  phonemeDescription: 'oi as in coin',  exampleWords: ['coin', 'foil', 'boil'],   phase: 3, order: 23 },
  { grapheme: 'ear', ttsText: 'ear',   phonemeDescription: 'ear as in ear',  exampleWords: ['ear', 'dear', 'fear'],    phase: 3, order: 24 },
  { grapheme: 'air', ttsText: 'fair',  phonemeDescription: 'air as in fair', exampleWords: ['fair', 'hair', 'pair'],   phase: 3, order: 25 },
  { grapheme: 'ure', ttsText: 'pure',  phonemeDescription: 'ure as in pure', exampleWords: ['pure', 'sure', 'cure'],   phase: 3, order: 26 },
  { grapheme: 'er',  ttsText: 'her',   phonemeDescription: 'er as in her',   exampleWords: ['her', 'fern', 'term'],    phase: 3, order: 27 },
]

export default phonics
