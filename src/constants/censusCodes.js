// जनगणना एवं जातिगत सर्वेक्षण प्रपत्र - मानक कोड सूची (Census Codes)

export const RELATIONSHIP_CODES = [
  { code: 1, label: "01 - मुखिया" },
  { code: 2, label: "02 - पति/पत्नी" },
  { code: 3, label: "03 - बेटा/बेटी" },
  { code: 4, label: "04 - बहू" },
  { code: 6, label: "06 - पोता/पोती" },
  { code: 7, label: "07 - नाती/नातिन" },
  { code: 12, label: "12 - माता/पिता" },
  { code: 13, label: "13 - भाई/बहन" },
  { code: 30, label: "30 - अन्य रिश्तेदार" },
  { code: 31, label: "31 - घरेलू नौकर" },
  { code: 32, label: "32 - अन्य/आगंतुक" }
];

export const GENDER_CODES = [
  { code: 1, label: "1 - पुरुष", short: "पु." },
  { code: 2, label: "2 - महिला", short: "महि." },
  { code: 3, label: "3 - ट्रांसजेंडर", short: "ट्रांस" }
];

export const MARITAL_STATUS_CODES = [
  { code: 1, label: "1 - कभी विवाह नहीं (अविवाहित)" },
  { code: 2, label: "2 - वर्तमान में विवाहित" },
  { code: 3, label: "3 - विधवा / विधुर" },
  { code: 4, label: "4 - सम्बन्ध विच्छेदित" },
  { code: 5, label: "5 - तलाकशुदा" }
];

export const RELIGION_CODES = [
  { code: 1, label: "1 - हिन्दू" },
  { code: 2, label: "2 - मुस्लिम" },
  { code: 3, label: "3 - ईसाई" },
  { code: 4, label: "4 - सिख" },
  { code: 5, label: "5 - बौद्ध" },
  { code: 6, label: "6 - जैन" },
  { code: 7, label: "7 - अन्य" }
];

export const SOCIAL_CATEGORY_CODES = [
  { code: 1, label: "1 - अनुसूचित जाति (SC)" },
  { code: 2, label: "2 - अनुसूचित जनजाति (ST)" },
  { code: 3, label: "3 - दोनों में नहीं (अन्य / सामान्य / पिछड़ी)" }
];

export const DISABILITY_CODES = [
  { code: 1, label: "1 - देखने में (दृष्टिबाधित)" },
  { code: 2, label: "2 - सुनने में (श्रवणबाधित)" },
  { code: 3, label: "3 - बोलने में (वाकबाधित)" },
  { code: 4, label: "4 - चलने-फिरने में (चलनबाधित)" },
  { code: 5, label: "5 - बौद्धिक अक्षमता (Intellectual)" },
  { code: 6, label: "6 - मानसिक रोग (Mental Illness)" },
  { code: 7, label: "7 - एसिड अटैक पीड़ित" },
  { code: 8, label: "8 - दीर्घकालिक तंत्रिका रोग" },
  { code: 9, label: "9 - रक्त विकार (Blood Disorder)" },
  { code: 10, label: "10 - बहु-दिव्यांगता (Multiple Disabilities)" },
  { code: 11, label: "11 - अन्य दिव्यांगता (Any Other)" }
];

export const EDUCATION_STATUS_CODES = [
  { code: 1, label: "1 - विद्यालय में पढ़ते हैं" },
  { code: 2, label: "2 - कॉलेज में पढ़ते हैं" },
  { code: 3, label: "3 - व्यावसायिक संस्थान" },
  { code: 4, label: "4 - पेशेवर संस्थान" },
  { code: 5, label: "5 - दिव्यांग विशेष संस्थान" },
  { code: 6, label: "6 - साक्षरता केन्द्र" },
  { code: 7, label: "7 - अन्य संस्था" },
  { code: 8, label: "8 - नहीं: पहले पढ़े हैं" },
  { code: 9, label: "9 - कभी नहीं पढ़े" }
];

export const EDUCATION_LEVEL_CODES = [
  { code: 0, label: "00 - पूर्व-प्राथमिक" },
  { code: 1, label: "01 - कक्षा 1" },
  { code: 2, label: "02 - कक्षा 2" },
  { code: 3, label: "03 - कक्षा 3" },
  { code: 4, label: "04 - कक्षा 4" },
  { code: 5, label: "05 - कक्षा 5" },
  { code: 6, label: "06 - कक्षा 6" },
  { code: 7, label: "07 - कक्षा 7" },
  { code: 8, label: "08 - कक्षा 8" },
  { code: 9, label: "09 - कक्षा 9" },
  { code: 10, label: "10 - कक्षा 10" },
  { code: 11, label: "11 - कक्षा 11" },
  { code: 12, label: "12 - कक्षा 12 (इंटर)" },
  { code: 13, label: "13 - आई.टी.आई. (ITI)" },
  { code: 14, label: "14 - डिप्लोमा / प्रमाणपत्र" },
  { code: 15, label: "15 - स्नातक (Graduate)" },
  { code: 16, label: "16 - पीजी डिप्लोमा" },
  { code: 17, label: "17 - परास्नातक / मास्टर्स (Post Graduate)" },
  { code: 18, label: "18 - एम.फिल (M.Phil)" },
  { code: 19, label: "19 - डॉक्टरेट (Ph.D)" }
];

export const EDUCATION_SUBJECT_CODES = [
  { code: 1, label: "1 - कला / सामाजिक विज्ञान" },
  { code: 2, label: "2 - विज्ञान (Science)" },
  { code: 3, label: "3 - वाणिज्य (Commerce)" },
  { code: 4, label: "4 - इंजी. / प्रौद्योगिकी" },
  { code: 5, label: "5 - आईटी / कम्प्यूटर" },
  { code: 6, label: "6 - भाषा (Language)" },
  { code: 7, label: "7 - चिकित्सा (Medical)" },
  { code: 8, label: "8 - शिक्षा (B.Ed/D.El.Ed)" },
  { code: 9, label: "9 - प्रबंधन (Management)" },
  { code: 10, label: "10 - विधि (Law)" },
  { code: 11, label: "11 - कृषि (Agriculture)" },
  { code: 12, label: "12 - अन्य" }
];

export const WORK_LAST_YEAR_CODES = [
  { code: 1, label: "1 - दीर्घकालिक कर्मी (6 माह+)" },
  { code: 2, label: "2 - अल्पकालिक कर्मी (3 से 6 माह)" },
  { code: 3, label: "3 - अर्ध-अल्पकालिक (3 माह से कम)" },
  { code: 4, label: "4 - गैर-कर्मी (काम नहीं किया)" }
];

export const ECONOMIC_ACTIVITY_CODES = [
  { code: 1, label: "1 - कृषक (किसान)" },
  { code: 2, label: "2 - कृषि मजदूर" },
  { code: 3, label: "3 - घरेलू उद्योग" },
  { code: 4, label: "4 - बागान / पशुधन / वानिकी / मत्स्य" },
  { code: 5, label: "5 - विनिर्माण (Manufacturing)" },
  { code: 6, label: "6 - निर्माण (Construction)" },
  { code: 7, label: "7 - सेवाएँ (Services)" },
  { code: 8, label: "8 - अन्य" }
];

export const WORKER_CLASS_CODES = [
  { code: 1, label: "1 - नियोक्ता (Employer)" },
  { code: 2, label: "2 - कर्मचारी (Employee)" },
  { code: 3, label: "3 - एकल कर्मी (Self-employed)" },
  { code: 4, label: "4 - पारिवारिक कर्मी (Family worker)" }
];

export const NON_ECONOMIC_ACTIVITY_CODES = [
  { code: 1, label: "1 - छात्र / छात्रा" },
  { code: 2, label: "2 - गृह कार्य (घरेलू काम)" },
  { code: 3, label: "3 - आश्रित (Dependent)" },
  { code: 4, label: "4 - पेंशन भोगी" },
  { code: 5, label: "5 - किरायाजीवी" },
  { code: 6, label: "6 - अन्य" }
];

export const COMMUTE_MODE_CODES = [
  { code: 0, label: "0 - कोई यात्रा नहीं (घर पर काम)" },
  { code: 1, label: "1 - पैदल" },
  { code: 2, label: "2 - साइकिल" },
  { code: 3, label: "3 - मोपेड / स्कूटर / बाइक" },
  { code: 4, label: "4 - कार / जीप / वैन" },
  { code: 5, label: "5 - टेम्पो / ऑटो / ई-रिक्शा" },
  { code: 6, label: "6 - बस" },
  { code: 7, label: "7 - ट्रेन / मेट्रो" },
  { code: 8, label: "8 - जल परिवहन" },
  { code: 9, label: "9 - अन्य" }
];

export const MIGRATION_REASON_CODES = [
  { code: 1, label: "1 - कार्य / रोजगार" },
  { code: 2, label: "2 - व्यापार" },
  { code: 3, label: "3 - शिक्षा" },
  { code: 4, label: "4 - विवाह" },
  { code: 5, label: "5 - जन्म के बाद स्थानांतरण" },
  { code: 6, label: "6 - परिवार सहित स्थानांतरण" },
  { code: 7, label: "7 - प्राकृतिक आपदा" },
  { code: 8, label: "8 - अन्य" }
];

export const HOUSEHOLD_TYPE_CODES = [
  { code: 1, label: "1 - सामान्य परिवार" },
  { code: 2, label: "2 - संस्थागत परिवार" },
  { code: 3, label: "3 - बेघर परिवार" }
];
