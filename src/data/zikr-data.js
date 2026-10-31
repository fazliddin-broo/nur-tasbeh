// Authentic Islamic Zikrs and Duas Database
import { ALLAH_99_NAMES } from './names-of-allah.js';

export const ZIKR_CATEGORIES = [
  { id: 'all', name: "Barchasi" },
  { id: 'kundalik', name: "Kundalik Zikrlar" },
  { id: 'istigfor', name: "Istig'for & Tavba" },
  { id: 'salovat', name: "Salovatlar" },
  { id: 'fazilat', name: "Xazina Kalimalar" },
  { id: 'tonggi-kechki', name: "Tonggi & Kechki" }
];

// Special Sequential 99 Names Mode
export const ASMA_UL_HUSNA_SEQUENTIAL = {
  id: 'allah-99-names',
  arabic: 'أَسْمَاءُ اللَّهِ الْحُسْنَىٰ',
  transliteration: "Allohning 99 Go'zal Ismi",
  meaning: "Har bir tasbeh donasi bosilganda 99 ism tartib bilan birma-bir o'zgaradi. Yodlash va qalbiy zikr uchun.",
  category: 'asma',
  target: 99,
  isAsmaUlHusna: true
};

// Core authentic sunnah zikrs with clean, easy-to-read Latin transliteration
// and concise 1-line Arabic snippets with ellipsis (...) so it never blocks the screen
export const INITIAL_ZIKRS = [
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirulloh',
    meaning: 'Allohdan magʻfirat va gunohlarimni kechirishini soʻrayman',
    category: 'istigfor',
    target: 100
  },
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhanalloh',
    meaning: 'Alloh barcha ayb-nuqsonlardan pok va munazzahdir',
    category: 'kundalik',
    target: 33
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'Hamd va shukr faqat olamlarning Robbi boʻlgan Allohgadir',
    category: 'kundalik',
    target: 33
  },
  {
    id: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allohu Akbar',
    meaning: 'Alloh har bir narsadan ulugʻ va buyukdir',
    category: 'kundalik',
    target: 33
  },
  {
    id: 'la-ilaha-illallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illalloh',
    meaning: 'Allohdan oʻzga ibodatga loyiq haqiqiy iloh yoʻqdir',
    category: 'fazilat',
    target: 100
  },
  {
    id: 'subhanallahi-wa-bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ...',
    transliteration: "Subhanallohi va bihamdihi, Subhanallohil 'Aziym",
    meaning: 'Allohni hamd aytib poklayman, Buyuk Alloh barcha nuqsondan pokdir',
    category: 'fazilat',
    target: 100
  },
  {
    id: 'salavat-ibrahim',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ...',
    transliteration: "Allohumma solli 'ala Muhammadin va 'ala ali Muhammad",
    meaning: 'Yo Alloh! Muhammad alayhissalomga va ularning oilasiga oʻzing salovot va rahmat yogʻdirgin',
    category: 'salovat',
    target: 100
  },
  {
    id: 'sayyidul-istighfar',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ...',
    transliteration: "Sayyidul Istig'for: Allohumma anta Robbiy la ilaha illa Ant",
    meaning: "Yo Alloh, Sen mening Robbimsan, Sendan o'zga iloh yo'q. Meni yaratding va men Sening qulingman...",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'la-hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ...',
    transliteration: "La havla va la quvvata illa billahil 'Aliyyil 'Aziym",
    meaning: 'Gunohtan saqlanish va toatga kuch-quvvat faqatgina Buyuk va Oliy Allohdandir',
    category: 'fazilat',
    target: 100
  },
  {
    id: 'hasbunallah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: "Hasbunallohu va ni'mal vakiyl",
    meaning: 'Bizga Allohning Oʻzi kifoyadir va U qanday ham goʻzal vasiy (himoyachi)!',
    category: 'fazilat',
    target: 100
  },
  {
    id: 'la-ilaha-illa-anta-subhanaka',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ...',
    transliteration: "La ilaha illa Anta subhanaka inniy kuntu minaz-zolimiyn",
    meaning: 'Sendan oʻzga iloh yoʻqdir. Sen barcha nuqsondan poksan! Men oʻzimga zulm qiluvchilardan boʻldim',
    category: 'istigfor',
    target: 100
  },
  {
    id: 'bismillahillazi',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ...',
    transliteration: "Bismillahillazi la yadurru ma'asmihi shay'un...",
    meaning: "Allohning ismi bilan boshlaymanki, Uning ismi ila yeru osmonda hech narsa zarar yetkaza olmas",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'robbana-atina',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً...',
    transliteration: "Robbana atina fid-dunya hasanatan va fil axiroti hasanatan...",
    meaning: 'Ey Robbimiz! Bizga dunyoda ham, oxiratda ham yaxshilik bergin va doʻzax azobidan asragin',
    category: 'kundalik',
    target: 33
  }
];

export { ALLAH_99_NAMES };
