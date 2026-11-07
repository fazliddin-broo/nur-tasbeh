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

// Core authentic Sunnah zikrs and Quranic duas with full, unclipped Latin and Arabic
export const INITIAL_ZIKRS = [
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: "Astaghfirulloh va atubu ilayh",
    meaning: "Allohdan mag'firat so'rayman va Unga tavba qilaman",
    category: 'istigfor',
    target: 100
  },
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: "Subhanalloh",
    meaning: "Alloh barcha ayb-nuqsonlardan pok va munazzahdir",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: "Alhamdulillah",
    meaning: "Hamd va shukr faqat olamlarning Robbi bo'lgan Allohgadir",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: "Allohu Akbar",
    meaning: "Alloh har bir narsadan ulug' va buyukdir",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'la-ilaha-illallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ',
    transliteration: "La ilaha illalloh",
    meaning: "Allohdan o'zga ibodatga loyiq haqiqiy iloh yo'qdir",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'kalimai-toyyiba',
    arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ',
    transliteration: "La ilaha illallohu Muhammadur Rasululloh",
    meaning: "Allohdan o'zga iloh yo'qdir, Muhammad alayhissalom Uning elchisidir",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'kalimai-shahodat',
    arabic: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: "Ashhadu alla ilaha illallohu va ashhadu anna Muhammadan 'abduhu va rasuluh",
    meaning: "Guvohlik beramanki, Allohdan o'zga iloh yo'q va guvohlik beramanki, Muhammad Uning bandasi va elchisidir",
    category: 'fazilat',
    target: 33
  },
  {
    id: 'subhanallahi-wa-bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: "Subhanallohi va bihamdihi, Subhanallohil 'Aziym",
    meaning: "Allohni hamd ila poklayman, Buyuk Alloh barcha nuqsonlardan pokdir",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'tort-sevimli-kalima',
    arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
    transliteration: "Subhanallohi valhamdulillahi va la ilaha illallohu vallohu Akbar",
    meaning: "Alloh pokdir, Allohga hamd bo'lsin, Allohdan o'zga iloh yo'q va Alloh ulug'dir",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'la-hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    transliteration: "La havla va la quvvata illa billahil 'Aliyyil 'Aziym",
    meaning: "Gunohdan saqlanish va toat-ibodat qilishga kuch-quvvat faqatgina Yuksak va Buyuk Allohdandir",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'hasbunallah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ، نِعْمَ الْمَوْلَىٰ وَنِعْمَ النَّصِيرُ',
    transliteration: "Hasbunallohu va ni'mal vakiyl, ni'mal mavla va ni'man-nasiyr",
    meaning: "Bizga Allohning O'zi kifoyadir, U qanday ham go'zal vasiy, qanday ham go'zal Egadir va qanday ham go'zal yordamchidir!",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'salavat-ibrahim',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: "Allohumma solli 'ala Muhammadin va 'ala ali Muhammad, kama sollayta 'ala Ibrohima va 'ala ali Ibrohim, innaka Hamidum-Majiyd",
    meaning: "Yo Alloh! Ibrohim alayhissalomga va u zotning oilasiga rahmat qilganingdek, Muhammad alayhissalomga va u zotning oilasiga ham salovot va rahmat yog'dirgin. Albatta Sen maqtovga loyiq va buyuk Zotsan",
    category: 'salovat',
    target: 100
  },
  {
    id: 'salavat-barik',
    arabic: 'اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: "Allohumma barik 'ala Muhammadin va 'ala ali Muhammad, kama barakta 'ala Ibrohima va 'ala ali Ibrohim, innaka Hamidum-Majiyd",
    meaning: "Yo Alloh! Ibrohim alayhissalomga va u zotning oilasiga baraka berganingdek, Muhammad alayhissalomga va u zotning oilasiga ham baraka ato etgin. Albatta Sen maqtovga loyiq va buyuk Zotsan",
    category: 'salovat',
    target: 100
  },
  {
    id: 'salavat-qisqa',
    arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
    transliteration: "Sollallohu 'alayhi va sallam",
    meaning: "Alloh taolo u zotga salovot va salom yog'dirsin",
    category: 'salovat',
    target: 100
  },
  {
    id: 'salavat-shafiy',
    arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ',
    transliteration: "Allohumma solli va sallim va barik 'ala Nabiyyina Muhammad",
    meaning: "Yo Alloh! Payg'ambarimiz Muhammad alayhissalomga salovot, salom va barakangni yog'dirgin",
    category: 'salovat',
    target: 100
  },
  {
    id: 'robbana-atina',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Robbana atina fid-dunya hasanatan va fil axiroti hasanatan va qina 'azaban-nar",
    meaning: "Ey Robbimiz! Bizga bu dunyoda ham yaxshilik bergin, oxiratda ham yaxshilik bergin va bizni do'zax azobidan asragin",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'sayyidul-istighfar',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ',
    transliteration: "Allohumma Anta Robbiy, la ilaha illa Anta, xolaqtaniy va ana 'abduka, va ana 'ala 'ahdika va va'dika mastato'tu",
    meaning: "Yo Alloh, Sen mening Robbimsan, Sendan o'zga iloh yo'q. Meni Sen yaratding va men Sening qulingman. Qurbim yetguncha Senga bergan ahdim va va'damdaman",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'la-ilaha-illa-anta-subhanaka',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: "La ilaha illa Anta subhanaka inniy kuntu minaz-zolimiyn",
    meaning: "Sendan o'zga iloh yo'qdir. Sen barcha nuqsondan poksan! Albatta men o'zimga zulm qiluvchilardan bo'ldim",
    category: 'istigfor',
    target: 100
  },
  {
    id: 'tavhid-ulug-zikr',
    arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallohu vahdahu la shariyka lah, lahul mulku va lahul hamdu va Huva 'ala kulli shay'in Qodiyr",
    meaning: "Yolg'iz Allohdan o'zga iloh yo'q, Uning hech bir sherigi yo'qdir. Mulk ham, barcha hamd ham Unikidir va U barcha narsaga qodirdir",
    category: 'fazilat',
    target: 100
  },
  {
    id: 'bismillahillazi',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Bismillahillazi la yadurru ma'asmihi shay'un fil-ardi va la fis-sama'i va Huvas-Samiy'ul-'Aliym",
    meaning: "Allohning ismi bilan boshlaymanki, Uning ismi ila yerda ham, osmonda ham hech bir narsa zarar yetkaza olmas. U Zot eshituvchi va biluvchidir",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'auzu-bikalimatillah',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'uzu bikalimatillahit-tammati min sharri ma xolaq",
    meaning: "Allohning mukammal va benuqson kalimalari ila U yaratgan narsalarning yomonligidan panoh so'rayman",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'roziytu-billah',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    transliteration: "Roziytu billahi Robban, va bil-Islami diynan, va bi Muhammadin sollallohu 'alayhi va sallama nabiyya",
    meaning: "Allohni Robbim deb, Islomni dinim deb va Muhammad sollallohu alayhi vasallamni payg'ambarim deb rozi bo'ldim",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'ya-muqollibal-qulub',
    arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَىٰ دِينِكَ',
    transliteration: "Ya Muqollibal-qulub, sabbit qolbiy 'ala diynik",
    meaning: "Ey qalblarni burib qo'yuvchi Zot! Mening qalbimni O'zingning diningda sobitqadam qilgin",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'ota-ona-duosi',
    arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: "Robbirhamhuma kama robbayaniy sog'iyro",
    meaning: "Ey Robbim! Ular meni go'dakligimda mehr bilan tarbiya qilganlaridek, O'zing ularga rahmat va mag'firat ayla",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'ilm-duosi',
    arabic: 'رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا',
    transliteration: "Robbi zidniy 'ilman varzuqniy fahma",
    meaning: "Ey Robbim! Mening ilmimni va tushunchamni ziyoda qilgin",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'qalb-taskini',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    transliteration: "Robbishroh liy sodriy va yassir liy amriy",
    meaning: "Ey Robbim! Mening qalbimni keng qilgin va mening ishimni osonlashtirgin",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'namoz-duosi',
    arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    transliteration: "Robbij'alniy muqiymas-solati va min zurriyyati, Robbana va taqobbal du'a",
    meaning: "Ey Robbim! Meni va zurriyotlarimni namozni to'kis ado etuvchilardan qilgin. Ey Robbimiz, duomni qabul ayla",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'qarzdan-panoh',
    arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    transliteration: "Allohummak-finiy bihalalika 'an haromik, va ag'niniy bifadlika 'amman sivak",
    meaning: "Yo Alloh! Meni halol ne'matlaring ila haromdan saqla va O'z fazling ila O'zingdan o'zgalarga muhtoj qilma",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'gam-tashvish-panoh',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْجُبْنِ وَالْبُخْلِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: "Allohumma inniy a'uzu bika minal hammi val hazan, val 'ajzi val kasal, val jubni val buxl, va dola'id-dayni va g'olabatir-rijal",
    meaning: "Yo Alloh! G'am-qayg'udan, ojizlikdan, dangasalikdan, qo'rqoqlikdan, baxillikdan, qarzning og'irligidan va odamlarning ustun kelishidan Sendan panoh so'rayman",
    category: 'tonggi-kechki',
    target: 3
  },
  {
    id: 'subhanallohi-adada-xolqih',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ',
    transliteration: "Subhanallohi va bihamdihi 'adada xolqih, va rizo nafsih, va zinata 'arshih, va midada kalimatih",
    meaning: "Maxluqotlarining sonicha, O'zining roziligicha, Arshining og'irligicha va kalimalarining siyohicha Allohga hamd aytib, Uni poklayman",
    category: 'fazilat',
    target: 3
  },
  {
    id: 'ayub-shifo-duosi',
    arabic: 'رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
    transliteration: "Robbiy inniy massaniyad-durru va Anta Arhamur-rohimiyn",
    meaning: "Ey Robbim! Meni dard, qiyinchilik ushladi. Holbuki Sen rahmlilarning eng rahmlisisan",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'afv-va-magfirat',
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allohumma innaka 'Afuvvun tuhibbul 'afva fa'fu 'anniy",
    meaning: "Yo Alloh! Albatta Sen kechirguvchisan, kechirishni yaxshi ko'rasan, bas, mening gunohlarimni kechirgin",
    category: 'istigfor',
    target: 100
  },
  {
    id: 'jahannamdan-najot',
    arabic: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ',
    transliteration: "Allohumma ajirniy minan-nar",
    meaning: "Yo Alloh! Meni do'zax olovidan asragin va najot bergin",
    category: 'kundalik',
    target: 7
  },
  {
    id: 'tavakkul-duosi',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: "Hasbiyallohu la ilaha illa Huva 'alayhi tavakkaltu va Huva Robbul 'Arshil 'Aziym",
    meaning: "Menga Allohning O'zi kifoyadir, Undan o'zga iloh yo'q. Unga tavakkul qildim va U buyuk Arshning Robbisi bo'lgan Zotdir",
    category: 'tonggi-kechki',
    target: 7
  },
  {
    id: 'musa-alayhissalom-duosi',
    arabic: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    transliteration: "Robbi inniy lima anzalta ilayya min xoyrin faqiyr",
    meaning: "Ey Robbim! Albatta men O'zing menga tushiradigan har qanday yaxshilikka muhtojman",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'zakariyo-alayhissalom-duosi',
    arabic: 'رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنْتَ خَيْرُ الْوَارِثِينَ',
    transliteration: "Robbi la tazarniy fardan va Anta Xoyrul-varisiyn",
    meaning: "Ey Robbim! Meni yakka-yolg'iz qoldirma, O'zing merosxo'rlarning eng yaxshisisan",
    category: 'kundalik',
    target: 33
  },
  {
    id: 'odam-alayhissalom-tavbasi',
    arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    transliteration: "Robbana zolamna anfusana va illam tag'fir lana va tarhamna lanakunanna minal xosiriyn",
    meaning: "Ey Robbimiz! Biz o'zimizga zulm qildik. Agar bizni mag'firat qilmasang va rahm etmasang, albatta ziyon ko'rguvchilardan bo'lamiz",
    category: 'istigfor',
    target: 33
  },
  {
    id: 'hidoyat-duosi',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
    transliteration: "Robbana la tuzig' qulubana ba'da iz hadaytana va hab lana mil-ladunka rahmah, innaka Antal-Vahhab",
    meaning: "Ey Robbimiz! Bizni hidoyat qilganingdan so'ng qalbimizni haq yo'ldan og'dirmagin va bizga O'z dargohingdan rahmat ato etgin. Albatta Sen barchasini beruvchi Zotsan",
    category: 'kundalik',
    target: 33
  }
];

export { ALLAH_99_NAMES };
