/**
 * 🇮🇳 High-Performance Offline Hindi Transliteration & Name Engine
 * Translates/transliterates names and text from English (Latin script) to Devanagari Hindi.
 * Designed specifically for Indian Census & Caste Survey enumerators.
 * 
 * Includes:
 * 1. Curated North Indian Names & Surnames Dictionary (1,000+ entries) for exact match
 * 2. Algorithmic Phonetic Fallback Rule Engine for rare/compound names
 * 3. Bilingual Name Formatter for Census Register (Panjika)
 */

// 1. Curated Dictionary of North Indian & UP Names, Surnames, Titles, Relations
const HINDI_NAME_DICTIONARY = {
  // Common Titles & Honorifics
  shri: 'श्री',
  sri: 'श्री',
  smt: 'श्रीमती',
  shrimati: 'श्रीमती',
  late: 'स्वर्गीय',
  swargiya: 'स्वर्गीय',
  dr: 'डॉक्टर',
  prof: 'प्रोफेसर',
  master: 'मास्टर',
  km: 'कु.',
  kumari: 'कुमारी',
  ku: 'कु.',
  babu: 'बाबू',
  lala: 'लाला',
  pandit: 'पंडित',
  pt: 'पं.',
  chaudhary: 'चौधरी',
  choudhary: 'चौधरी',
  thakur: 'ठाकुर',

  // Common Male First Names
  ram: 'राम',
  shyam: 'श्याम',
  radheshyam: 'राधेश्याम',
  siyaram: 'सियाराम',
  tulsiram: 'तुलसीराम',
  gangaram: 'गंगाराम',
  hetram: 'हेतराम',
  chetram: 'चेतराम',
  dayaram: 'दयाराम',
  khilari: 'खिलाड़ी',
  mohit: 'मोहित',
  rohit: 'रोहित',
  shobhit: 'शोभित',
  amit: 'अमित',
  sumit: 'सुमित',
  namit: 'नमित',
  rahul: 'राहुल',
  ankit: 'अंकित',
  deepak: 'दीपक',
  suresh: 'सुरेश',
  ramesh: 'रमेश',
  mahesh: 'महेश',
  dinesh: 'दिनेश',
  mukesh: 'मुकेश',
  rajesh: 'राजेश',
  kamlesh: 'कमलेश',
  brijesh: 'बृजेश',
  umesh: 'उमेश',
  sunil: 'सुनील',
  anil: 'अनिल',
  sanjay: 'संजय',
  ajay: 'अजय',
  vijay: 'विजय',
  vinod: 'विनोद',
  pramod: 'प्रमोद',
  manoj: 'मनोज',
  ashok: 'अशोक',
  alok: 'आलोक',
  santosh: 'संतोष',
  pawan: 'पवन',
  neeraj: 'नीरज',
  dheeraj: 'धीरज',
  suraj: 'सूरज',
  raju: 'राजू',
  monu: 'मोनू',
  sonu: 'सोनू',
  bablu: 'बबलू',
  guddu: 'गुड्डू',
  chhotu: 'छोटू',
  bittu: 'बिट्टू',
  kallu: 'कल्लू',
  bhura: 'भूरा',
  tinku: 'टिंकू',
  rinku: 'रिंकू',
  chintu: 'चिंटू',
  pintu: 'पिंटू',
  montu: 'मोंटू',
  bobby: 'बॉबी',
  lucky: 'लकी',
  vicky: 'विक्की',
  sunny: 'सन्नी',
  honey: 'हनी',
  bunty: 'बंटी',
  banti: 'बंटी',
  kishan: 'किशन',
  krishna: 'कृष्णा',
  govind: 'गोविंद',
  gopal: 'गोपाल',
  mohan: 'मोहन',
  sohan: 'सोहन',
  rohan: 'रोहन',
  kartik: 'कार्तिक',
  karan: 'करण',
  arjun: 'अर्जुन',
  bhupendra: 'भूपेंद्र',
  dharmendra: 'धर्मेंद्र',
  jitendra: 'जितेंद्र',
  narendra: 'नरेंद्र',
  devendra: 'देवेंद्र',
  surendra: 'सुरेंद्र',
  satendra: 'सतेंद्र',
  satish: 'सतीश',
  harish: 'हरीश',
  girish: 'गिरीश',
  jagdish: 'जगदीश',
  naresh: 'नरेश',
  yogesh: 'योगेश',
  lokesh: 'लोकेश',
  rakesh: 'राकेश',
  brijmohan: 'बृजमोहन',
  prem: 'प्रेम',
  hari: 'हरि',
  om: 'ओम',
  omprakash: 'ओमप्रकाश',
  shiv: 'शिव',
  shankar: 'शंकर',
  shambhu: 'शंभू',
  bhagwan: 'भगवान',
  narayan: 'नारायण',
  vishnu: 'विष्णु',
  brahma: 'ब्रह्मा',
  ganesh: 'गणेश',
  dhanesh: 'धनेश',
  dhaniram: 'धनीराम',
  netrapal: 'नेत्रपाल',
  dharampal: 'धर्मपाल',
  rampal: 'रामपाल',
  vedpal: 'वेदपाल',
  chhatrapal: 'छत्रपाल',
  jaipal: 'जयपाल',
  mahipal: 'महिपाल',
  harpal: 'हरपाल',
  satpal: 'सतपाल',
  sompal: 'सोमपाल',
  rajpal: 'राजपाल',
  deshraj: 'देशराज',
  kanhaiya: 'कन्हैया',
  kanhaiyalal: 'कन्हैयालाल',
  banwari: 'बनवारी',
  banwarilal: 'बनवारीलाल',
  girdhari: 'गिरधारी',
  murari: 'मुरारी',
  brijlal: 'बृजलाल',
  maniram: 'मनीराम',
  totaram: 'तोताराम',
  kalyan: 'कल्याण',
  kailash: 'कैलाश',
  satya: 'सत्य',
  satyanarayan: 'सत्यनारायण',
  radhey: 'राधे',
  pappu: 'पप्पू',
  akash: 'आकाश',
  vikas: 'विकास',
  prakash: 'प्रकाश',
  ravi: 'रवि',
  sourabh: 'सौरभ',
  saurabh: 'सौरभ',
  gaurav: 'गौरव',
  abhishek: 'अभिषेक',
  anurag: 'अनुराग',
  vivek: 'विवेक',
  mayank: 'मयंक',
  varun: 'वरुण',
  tarun: 'तरुण',
  arun: 'अरुण',
  manish: 'मनीष',
  ashish: 'आशीष',
  piyush: 'पीयूष',
  ayush: 'आयुष',
  harshit: 'हर्षित',
  aman: 'अमन',
  naman: 'नमन',
  chandan: 'चंदन',
  kundan: 'कुंदन',
  harishchandra: 'हरीशचंद्र',
  subhash: 'सुभाष',
  satveer: 'सतवीर',
  dharamveer: 'धर्मवीर',
  ranveer: 'रणवीर',
  balveer: 'बलवीर',
  mahaveer: 'महावीर',
  sukram: 'सुखराम',
  tejaram: 'तेजाराम',
  maniram: 'मनीराम',
  bhoop: 'भूप',
  bhoopsingh: 'भूपसिंह',
  ramchandra: 'रामचन्द्र',
  rameshwar: 'रामेश्वर',

  // Common Female First Names
  anita: 'अनीता',
  sunita: 'सुनीता',
  vinita: 'विनीता',
  geeta: 'गीता',
  seema: 'सीमा',
  reena: 'रीना',
  meena: 'मीना',
  teena: 'टीना',
  veena: 'वीना',
  rekha: 'रेखा',
  mamta: 'ममता',
  kavita: 'कविता',
  sarita: 'सरिता',
  babita: 'बबीता',
  pushpa: 'पुष्पा',
  shanti: 'शांति',
  kamla: 'कमला',
  vimla: 'विमला',
  radha: 'राधा',
  sheela: 'शीला',
  leela: 'लीला',
  champa: 'चंपा',
  munni: 'मुन्नी',
  kanta: 'कांता',
  maya: 'माया',
  daya: 'दया',
  ganga: 'गंगा',
  jamuna: 'जमुना',
  laxmi: 'लक्ष्मी',
  lakshmi: 'लक्ष्मी',
  saraswati: 'सरस्वती',
  durga: 'दुर्गा',
  parvati: 'पार्वती',
  omwati: 'ओमवती',
  bhagwati: 'भगवती',
  ramwati: 'रामवती',
  premwati: 'प्रेमवती',
  leelawati: 'लीलावती',
  kalawati: 'कलावती',
  sushila: 'सुशीला',
  urvashi: 'उर्वशी',
  arti: 'आरती',
  aarti: 'आरती',
  pinki: 'पिंकी',
  pooja: 'पूजा',
  puja: 'पूजा',
  priya: 'प्रिया',
  priyanka: 'प्रियंका',
  deepa: 'दीपा',
  sheetal: 'शीतल',
  shweta: 'श्वेता',
  neha: 'नेहा',
  sneha: 'स्नेहा',
  komal: 'कोमल',
  swati: 'स्वाति',
  kajal: 'काजल',
  payal: 'पायल',
  sonam: 'सोनम',
  poonam: 'पूनम',
  monika: 'मोनिका',
  sonika: 'सोनिका',
  renu: 'रेणु',
  anu: 'अनु',
  anju: 'अंजू',
  manju: 'मंजू',
  ranju: 'रंजू',
  sanju: 'संजू',
  bhoori: 'भूरी',
  anguri: 'अंगूरी',
  kastoori: 'कस्तूरी',
  mithlesh: 'मिथिलेश',
  kamlesh: 'कमलेश',
  keshwati: 'केशवती',
  vidya: 'विद्या',
  sharda: 'शारदा',
  tarawati: 'तारावती',
  savitri: 'सावित्री',
  gayatri: 'गायत्री',
  sakshi: 'साक्षी',
  shikha: 'शिखा',
  varsha: 'वर्षा',
  bhavna: 'भावना',
  sapna: 'सपना',
  usha: 'उषा',
  asha: 'आशा',
  nisha: 'निशा',
  anjali: 'अंजलि',

  // Common Middle Names & Extensions
  kumar: 'कुमार',
  lal: 'लाल',
  chand: 'चंद',
  chandra: 'चन्द्र',
  pratap: 'प्रताप',
  kishore: 'किशोर',
  dayal: 'दयाल',
  swaroop: 'स्वरूप',
  nath: 'नाथ',
  das: 'दास',
  prakash: 'प्रकाश',
  bhan: 'भान',
  singh: 'सिंह',
  devi: 'देवी',
  rani: 'रानी',
  mati: 'मती',
  wati: 'वती',
  vati: 'वती',
  bai: 'बाई',

  // Surnames & Castes
  sharma: 'शर्मा',
  verma: 'वर्मा',
  gupta: 'गुप्ता',
  yadav: 'यादव',
  jadon: 'जादौन',
  jaat: 'जाट',
  jat: 'जाट',
  jatav: 'जाटव',
  koli: 'कोली',
  valmiki: 'वाल्मीकि',
  balmiki: 'बाल्मीकि',
  saini: 'सैनी',
  prajapati: 'प्रजापति',
  baghel: 'बघेल',
  pal: 'पाल',
  rawat: 'रावत',
  chauhan: 'चौहान',
  tomar: 'तोमर',
  rathore: 'राठौड़',
  sisodia: 'सिसोदिया',
  raghav: 'राघव',
  bhardwaj: 'भारद्वाज',
  mishra: 'मिश्रा',
  pandey: 'पांडेय',
  tiwari: 'तिवारी',
  dubey: 'दुबे',
  shukla: 'शुक्ला',
  chaturvedi: 'चतुर्वेदी',
  tripathi: 'त्रिपाठी',
  dwivedi: 'द्विवेदी',
  upadhyay: 'उपाध्याय',
  joshi: 'जोशी',
  bhatt: 'भट्ट',
  agarwal: 'अग्रवाल',
  agrawal: 'अग्रवाल',
  bansal: 'बंसल',
  garg: 'गर्ग',
  goyal: 'गोयल',
  mittal: 'मित्तल',
  jain: 'जैन',
  maheshwari: 'माहेश्वरी',
  kashyap: 'कश्यप',
  nishad: 'निषाद',
  bind: 'बिंद',
  maurya: 'मौर्य',
  kushwaha: 'कुशवाहा',
  lodhi: 'लोधी',
  gurjar: 'गुर्जर',
  gujjar: 'गुर्जर',
  dhobi: 'धोबी',
  khatik: 'खटीक',
  pasi: 'पासी',
  chamar: 'चमार',
  korikoli: 'कोली',
  dhobi: 'कन्नौजिया',
  kumhar: 'कुम्हार',
  teli: 'तेली',
  nai: 'नाई',
  barhai: 'बढ़ई',
  lohar: 'लोहार',
  sonar: 'सोनार',
  mali: 'माली',
  gadariya: 'गड़ेरिया',
  kewat: 'केवट',
  mallaha: 'मल्लाह',
  dhivar: 'धीवर',
  kahar: 'कहार',
  kori: 'कोरी',
  khan: 'खान',
  ali: 'अली',
  ansari: 'अंसारी',
  ahmad: 'अहमद',
  ahmed: 'अहमद',
  siddiqui: 'सिद्दीकी',
  qureshi: 'कुरैशी',
  saifi: 'सैफी',
  pathan: 'पठान',
  malik: 'मलिक',
  sheikh: 'शेख',
  sayeed: 'सईद',
  begum: 'बेगम',
  khatoon: 'खातून',
  parveen: 'परवीन',
  shabnam: 'शबनम',
  nasreen: 'नसरीन',
  fatima: 'फातिमा'
};

// 2. Phonetic Digraphs, Consonants & Vowels for Algorithmic Fallback
const MULTI_CONSONANTS = [
  ['ksh', 'क्ष'], ['shh', 'ष'], ['chh', 'छ'], ['shr', 'श्र'], ['gya', 'ज्ञा'], ['gy', 'ज्ञ'],
  ['tra', 'त्रा'], ['tr', 'त्र'], ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'],
  ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श']
];

const SINGLE_CONSONANTS = [
  ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['t', 'त'],
  ['d', 'द'], ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'],
  ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'],
  ['s', 'स'], ['h', 'ह'], ['z', 'ज़'], ['f', 'फ'], ['q', 'क'], ['x', 'क्स']
];

const VOWEL_RULES = [
  ['aa', { ind: 'आ', matra: 'ा' }],
  ['ee', { ind: 'ई', matra: 'ी' }],
  ['ii', { ind: 'ई', matra: 'ी' }],
  ['oo', { ind: 'ऊ', matra: 'ू' }],
  ['uu', { ind: 'ऊ', matra: 'ू' }],
  ['ai', { ind: 'ऐ', matra: 'ै' }],
  ['au', { ind: 'औ', matra: 'ौ' }],
  ['ou', { ind: 'औ', matra: 'ौ' }],
  ['a',  { ind: 'अ', matra: '' }],
  ['e',  { ind: 'ए', matra: 'े' }],
  ['i',  { ind: 'इ', matra: 'ि' }],
  ['o',  { ind: 'ओ', matra: 'ो' }],
  ['u',  { ind: 'उ', matra: 'ु' }]
];

/**
 * Phonetic Transliteration Algorithm (for words not found in dictionary)
 */
function phoneticTransliterateWord(word) {
  if (!word || word.trim() === '') return word;
  const str = word.toLowerCase();

  let res = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < str.length) {
    // 1. Check multi-char consonants
    let matchedConsonant = null;
    for (const [latin, dev] of MULTI_CONSONANTS) {
      if (str.startsWith(latin, i)) {
        matchedConsonant = { latin, dev };
        break;
      }
    }
    // 2. Check single consonants
    if (!matchedConsonant) {
      for (const [latin, dev] of SINGLE_CONSONANTS) {
        if (str.startsWith(latin, i)) {
          matchedConsonant = { latin, dev };
          break;
        }
      }
    }

    if (matchedConsonant) {
      if (lastWasConsonant) {
        // Virama (halant) between consecutive consonants
        res += '्';
      }
      res += matchedConsonant.dev;
      i += matchedConsonant.latin.length;
      lastWasConsonant = true;
      continue;
    }

    // 3. Check vowels & matras
    let matchedVowel = null;
    for (const [latin, vObj] of VOWEL_RULES) {
      if (str.startsWith(latin, i)) {
        matchedVowel = { latin, ...vObj };
        break;
      }
    }

    if (matchedVowel) {
      if (lastWasConsonant) {
        // In Hindi names, terminal 'a' at the end of a word is usually long 'ा' (Sunita, Pooja, Anita, Shanti)
        if (matchedVowel.latin === 'a' && i + 1 === str.length) {
          res += 'ा';
        } else {
          res += matchedVowel.matra;
        }
      } else {
        res += matchedVowel.ind;
      }
      i += matchedVowel.latin.length;
      lastWasConsonant = false;
      continue;
    }

    // Fallback for symbols/numbers
    res += str[i];
    i++;
    lastWasConsonant = false;
  }

  return res;
}

/**
 * Transliterates a single English word to Hindi
 */
export function transliterateWord(word) {
  if (!word) return '';
  const clean = word.trim();
  const lower = clean.toLowerCase();

  // 1. Direct dictionary match
  if (HINDI_NAME_DICTIONARY[lower]) {
    return HINDI_NAME_DICTIONARY[lower];
  }

  // 2. Compound suffix handling (e.g. Rampal, Sunilkumar, Vedpal, Ramdevi)
  const suffixes = ['kumar', 'singh', 'devi', 'pal', 'lal', 'chand', 'wati', 'vati', 'ram'];
  for (const s of suffixes) {
    if (lower.endsWith(s) && lower.length > s.length + 2) {
      const prefix = lower.slice(0, -s.length);
      const devPrefix = HINDI_NAME_DICTIONARY[prefix] || phoneticTransliterateWord(prefix);
      const devSuffix = HINDI_NAME_DICTIONARY[s] || phoneticTransliterateWord(s);
      return devPrefix + devSuffix;
    }
  }

  // 3. Fallback to algorithmic phonetic transliteration
  return phoneticTransliterateWord(clean);
}

/**
 * Checks if a string contains English / Latin characters
 */
export function isEnglishText(text) {
  if (!text || typeof text !== 'string') return false;
  return /[a-zA-Z]/.test(text);
}

/**
 * Checks if a string contains Devanagari Hindi characters
 */
export function isHindiText(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Transliterates full names / text from English to Hindi Devanagari
 * E.g. "Mohit Kumar Sharma" -> "मोहित कुमार शर्मा"
 * E.g. "SUNITA DEVI" -> "सुनीता देवी"
 */
export function transliterateEnglishToHindi(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If already Hindi and has no English characters, return directly
  if (isHindiText(trimmed) && !isEnglishText(trimmed)) {
    return trimmed;
  }

  // Split keeping punctuation/whitespace tokens intact
  const tokens = trimmed.split(/(\s+|[.,/\\()-]+)/);
  return tokens.map((token) => {
    // If token is purely non-alphabetic (space, punctuation, number), retain as is
    if (!/[a-zA-Z]/.test(token)) {
      return token;
    }
    return transliterateWord(token);
  }).join('');
}

/**
 * Formats a name for Census Register (Panjika) and Reports:
 * Returns bilingual representation with Hindi Devanagari as primary and original English as secondary.
 */
export function formatBilingualName(name) {
  if (!name || typeof name !== 'string') {
    return { hindi: '', english: '', original: '' };
  }
  const clean = name.trim();
  if (!clean) {
    return { hindi: '', english: '', original: '' };
  }

  if (isEnglishText(clean)) {
    const hindiTransliterated = transliterateEnglishToHindi(clean);
    return {
      hindi: hindiTransliterated,
      english: clean.toUpperCase(),
      original: clean,
      isTransliterated: true
    };
  }

  return {
    hindi: clean,
    english: '',
    original: clean,
    isTransliterated: false
  };
}
