// जनगणना एवं जातिगत सर्वेक्षण प्रपत्र - मानक कोड सूची (Census Codes - Bilingual Hindi & English)

export const RELATIONSHIP_CODES = [
  { code: 1, label: "01 - मुखिया (Head)" },
  { code: 2, label: "02 - पति/पत्नी (Spouse)" },
  { code: 3, label: "03 - बेटा/बेटी (Son/Daughter)" },
  { code: 4, label: "04 - बहू (Daughter-in-law)" },
  { code: 6, label: "06 - पोता/पोती (Grandson/Granddaughter)" },
  { code: 7, label: "07 - नाती/नातिन (Maternal Grandchild)" },
  { code: 12, label: "12 - माता/पिता (Parents)" },
  { code: 13, label: "13 - भाई/बहन (Brother/Sister)" },
  { code: 30, label: "30 - अन्य रिश्तेदार (Other Relative)" },
  { code: 31, label: "31 - घरेलू नौकर (Domestic Help)" },
  { code: 32, label: "32 - अन्य/आगंतुक (Other/Visitor)" }
];

export const GENDER_CODES = [
  { code: 1, label: "1 - पुरुष (Male)", short: "पु. (M)" },
  { code: 2, label: "2 - महिला (Female)", short: "महि. (F)" },
  { code: 3, label: "3 - ट्रांसजेंडर (Transgender)", short: "ट्रांस (T)" }
];

export const MARITAL_STATUS_CODES = [
  { code: 1, label: "1 - कभी विवाह नहीं / अविवाहित (Never Married)" },
  { code: 2, label: "2 - वर्तमान में विवाहित (Currently Married)" },
  { code: 3, label: "3 - विधवा / विधुर (Widowed)" },
  { code: 4, label: "4 - सम्बन्ध विच्छेदित (Separated)" },
  { code: 5, label: "5 - तलाकशुदा (Divorced)" }
];

export const RELIGION_CODES = [
  { code: 1, label: "1 - हिन्दू (Hindu)" },
  { code: 2, label: "2 - मुस्लिम (Muslim)" },
  { code: 3, label: "3 - ईसाई (Christian)" },
  { code: 4, label: "4 - सिख (Sikh)" },
  { code: 5, label: "5 - बौद्ध (Buddhist)" },
  { code: 6, label: "6 - जैन (Jain)" },
  { code: 7, label: "7 - अन्य (Other)" }
];

export const SOCIAL_CATEGORY_CODES = [
  { code: 1, label: "1 - अनुसूचित जाति (SC - Scheduled Caste)" },
  { code: 2, label: "2 - अनुसूचित जनजाति (ST - Scheduled Tribe)" },
  { code: 3, label: "3 - दोनों में नहीं (General / OBC / Other)" }
];

export const DISABILITY_CODES = [
  { code: 1, label: "1 - देखने में (दृष्टिबाधित / Visual)" },
  { code: 2, label: "2 - सुनने में (श्रवणबाधित / Hearing)" },
  { code: 3, label: "3 - बोलने में (वाकबाधित / Speech)" },
  { code: 4, label: "4 - चलने-फिरने में (चलनबाधित / Locomotor)" },
  { code: 5, label: "5 - बौद्धिक अक्षमता (Intellectual Disability)" },
  { code: 6, label: "6 - मानसिक रोग (Mental Illness)" },
  { code: 7, label: "7 - एसिड अटैक पीड़ित (Acid Attack Victim)" },
  { code: 8, label: "8 - दीर्घकालिक तंत्रिका रोग (Chronic Neurological)" },
  { code: 9, label: "9 - रक्त विकार (Blood Disorder)" },
  { code: 10, label: "10 - बहु-दिव्यांगता (Multiple Disabilities)" },
  { code: 11, label: "11 - अन्य दिव्यांगता (Any Other)" }
];

export const EDUCATION_STATUS_CODES = [
  { code: 1, label: "1 - विद्यालय में पढ़ते हैं (School)" },
  { code: 2, label: "2 - कॉलेज में पढ़ते हैं (College)" },
  { code: 3, label: "3 - व्यावसायिक संस्थान (Vocational)" },
  { code: 4, label: "4 - पेशेवर संस्थान (Professional)" },
  { code: 5, label: "5 - दिव्यांग विशेष संस्थान (Special Institution)" },
  { code: 6, label: "6 - साक्षरता केन्द्र (Literacy Center)" },
  { code: 7, label: "7 - अन्य संस्था (Other Institution)" },
  { code: 8, label: "8 - नहीं: पहले पढ़े हैं (Attended before)" },
  { code: 9, label: "9 - कभी नहीं पढ़े (Never attended)" }
];

export const EDUCATION_LEVEL_CODES = [
  { code: 0, label: "00 - पूर्व-प्राथमिक (Pre-primary)" },
  { code: 1, label: "01 - कक्षा 1 (Class 1)" },
  { code: 2, label: "02 - कक्षा 2 (Class 2)" },
  { code: 3, label: "03 - कक्षा 3 (Class 3)" },
  { code: 4, label: "04 - कक्षा 4 (Class 4)" },
  { code: 5, label: "05 - कक्षा 5 (Class 5 - Primary)" },
  { code: 6, label: "06 - कक्षा 6 (Class 6)" },
  { code: 7, label: "07 - कक्षा 7 (Class 7)" },
  { code: 8, label: "08 - कक्षा 8 (Class 8 - Middle)" },
  { code: 9, label: "09 - कक्षा 9 (Class 9)" },
  { code: 10, label: "10 - कक्षा 10 / मैट्रिक (Class 10 - Matric)" },
  { code: 11, label: "11 - कक्षा 11 (Class 11)" },
  { code: 12, label: "12 - कक्षा 12 / इंटर (Class 12 - Higher Secondary)" },
  { code: 13, label: "13 - आई.टी.आई. (ITI)" },
  { code: 14, label: "14 - डिप्लोमा / प्रमाणपत्र (Diploma / Certificate)" },
  { code: 15, label: "15 - स्नातक (Graduate)" },
  { code: 16, label: "16 - पीजी डिप्लोमा (PG Diploma)" },
  { code: 17, label: "17 - परास्नातक / मास्टर्स (Post Graduate)" },
  { code: 18, label: "18 - एम.फिल (M.Phil)" },
  { code: 19, label: "19 - डॉक्टरेट (Ph.D)" }
];

export const EDUCATION_SUBJECT_CODES = [
  { code: 1, label: "1 - कला / सामाजिक विज्ञान (Arts / Humanities)" },
  { code: 2, label: "2 - विज्ञान (Science)" },
  { code: 3, label: "3 - वाणिज्य (Commerce)" },
  { code: 4, label: "4 - इंजी. / प्रौद्योगिकी (Engineering / Tech)" },
  { code: 5, label: "5 - आईटी / कम्प्यूटर (IT / Computer)" },
  { code: 6, label: "6 - भाषा (Language)" },
  { code: 7, label: "7 - चिकित्सा (Medical)" },
  { code: 8, label: "8 - शिक्षा (Education - B.Ed/D.El.Ed)" },
  { code: 9, label: "9 - प्रबंधन (Management / MBA)" },
  { code: 10, label: "10 - विधि (Law)" },
  { code: 11, label: "11 - कृषि (Agriculture)" },
  { code: 12, label: "12 - अन्य (Other)" }
];

export const WORK_LAST_YEAR_CODES = [
  { code: 1, label: "1 - दीर्घकालिक कर्मी (Main Worker - 6+ Months)" },
  { code: 2, label: "2 - अल्पकालिक कर्मी (Marginal Worker - 3 to 6 Months)" },
  { code: 3, label: "3 - अर्ध-अल्पकालिक कर्मी (Marginal Worker - <3 Months)" },
  { code: 4, label: "4 - गैर-कर्मी (Non-Worker)" }
];

export const ECONOMIC_ACTIVITY_CODES = [
  { code: 1, label: "1 - कृषक / काश्तकार (Cultivator)" },
  { code: 2, label: "2 - कृषि श्रमिक / खेतीहर मजदूर (Agricultural Labourer)" },
  { code: 3, label: "3 - एचएचआई / पारिवारिक उद्योग (Household Industry)" },
  { code: 4, label: "4 - अन्य कर्मी / पशुपालन आदि (Other - Plantation/Livestock)" },
  { code: 5, label: "5 - विनिर्माण गतिविधियां (Manufacturing)" },
  { code: 6, label: "6 - निर्माण गतिविधियां (Construction)" },
  { code: 7, label: "7 - सेवा गतिविधियां (Services)" },
  { code: 8, label: "8 - अन्य गतिविधियां (Other Activities)" }
];

export const WORKER_CLASS_CODES = [
  { code: 1, label: "1 - नियोक्ता (Employer)" },
  { code: 2, label: "2 - कर्मचारी (Employee)" },
  { code: 3, label: "3 - एकल कर्मी (Single Worker)" },
  { code: 4, label: "4 - पारिवारिक कर्मी (Family Worker)" }
];

export const NON_ECONOMIC_ACTIVITY_CODES = [
  { code: 1, label: "1 - विद्यार्थी (Student)" },
  { code: 2, label: "2 - गृह कार्य (Household Duties)" },
  { code: 3, label: "3 - आश्रित (Dependent)" },
  { code: 4, label: "4 - पेंशनभोगी (Pensioner)" },
  { code: 5, label: "5 - किराया प्राप्तकर्ता (Rentier)" },
  { code: 6, label: "6 - अन्य (Other)" }
];

export const COMMUTE_MODE_CODES = [
  { code: 0, label: "0 - कोई यात्रा नहीं (No Travel - Work from Home)" },
  { code: 1, label: "1 - पैदल (On foot)" },
  { code: 2, label: "2 - साइकिल (Bicycle)" },
  { code: 3, label: "3 - मोपेड / स्कूटर / बाइक (Two Wheeler)" },
  { code: 4, label: "4 - कार / जीप / वैन (Four Wheeler)" },
  { code: 5, label: "5 - टेम्पो / ऑटो / ई-रिक्शा (Auto / E-Rickshaw)" },
  { code: 6, label: "6 - बस (Bus)" },
  { code: 7, label: "7 - ट्रेन / मेट्रो (Train / Metro)" },
  { code: 8, label: "8 - जल परिवहन (Water Transport)" },
  { code: 9, label: "9 - अन्य (Other)" }
];

export const MIGRATION_REASON_CODES = [
  { code: 1, label: "1 - कार्य / रोजगार (Work / Employment)" },
  { code: 2, label: "2 - व्यापार (Business)" },
  { code: 3, label: "3 - शिक्षा (Education)" },
  { code: 4, label: "4 - विवाह (Marriage)" },
  { code: 5, label: "5 - जन्म उपरांत स्थानांतरण (Moved after birth)" },
  { code: 6, label: "6 - परिवार सहित स्थानांतरण (Moved with Household)" },
  { code: 7, label: "7 - प्राकृतिक आपदा (Natural Calamity)" },
  { code: 8, label: "8 - अन्य (Other)" }
];

export const HOUSEHOLD_TYPE_CODES = [
  { code: 1, label: "1 - सामान्य परिवार (Normal Household)" },
  { code: 2, label: "2 - संस्थागत परिवार (Institutional Household)" },
  { code: 3, label: "3 - बेघर परिवार (Houseless Household)" }
];
