/**
 * Census & Demographic Survey - Data Validation and Input Sanitization Module
 * Standards aligned with Office of the Registrar General & Census Commissioner, India
 */

// --- 1. SANITIZATION HELPERS ---

/**
 * Strips HTML tags, script injections, and excessive whitespace
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[<>"'`]/g, '') // strip potential injection chars
    .replace(/\s+/g, ' ')   // normalize spaces
    .trim();
};

/**
 * Allows only Devanagari (Hindi) letters, English alphabets, spaces, and dots
 * Disallows numbers, emojis, and special punctuation in names
 */
export const sanitizeName = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[^A-Za-z\u0900-\u097F\s.]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart();
};

/**
 * Strict numeric sanitizer (digits only)
 */
export const sanitizeNumeric = (input) => {
  if (input === null || input === undefined) return '';
  return input.toString().replace(/\D/g, '');
};

/**
 * Alphanumeric sanitizer for house/building/voter IDs (letters, digits, slash, hyphen)
 */
export const sanitizeAlphanumeric = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[^A-Za-z0-9\/\-\s]/g, '')
    .trim()
    .toUpperCase();
};

// --- 2. DATE OF BIRTH & AGE HELPERS ---

/**
 * Auto-formats numeric date typing into DD/MM/YYYY format
 * As the user types digits on the numeric keyboard: '15081995' -> '15/08/1995'
 */
export const formatDobInput = (val) => {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

/**
 * Parses and validates DD/MM/YYYY numeric date format
 * Returns { isValid, empty, calculatedAge, isoDate, formattedDob, message }
 */
export const parseAndValidateDob = (dobString) => {
  if (!dobString || dobString.trim() === '') {
    return { isValid: true, empty: true, calculatedAge: null };
  }

  const clean = dobString.trim();
  const parts = clean.split(/[\/\-\.]/);
  
  if (parts.length !== 3 || parts[2].length < 4) {
    return { isValid: false, message: 'जन्म तिथि DD/MM/YYYY प्रारूप में पूरी लिखें (उदा. 15/08/1995)' };
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { isValid: false, message: 'अमान्य जन्म तिथि' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, message: 'महीना 01 से 12 के मध्य होना चाहिए' };
  }

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return { isValid: false, message: `वर्ष 1900 से ${currentYear} के मध्य होना चाहिए` };
  }

  // Days in month validation (accounting for leap years)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { isValid: false, message: `${month}वें महीने में दिन 01 से ${daysInMonth} तक ही हो सकते हैं` };
  }

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  if (birthDate > today) {
    return { isValid: false, message: 'जन्म तिथि आज की तारीख से आगे (भविष्य) की नहीं हो सकती' };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0 || age > 125) {
    return { isValid: false, message: 'आयु 0 से 125 वर्ष के मध्य होनी चाहिए' };
  }

  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const formattedDob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  return {
    isValid: true,
    empty: false,
    calculatedAge: age,
    isoDate,
    formattedDob
  };
};

// --- 3. IDENTIFIERS VALIDATIONS ---

/**
 * Validates Indian Mobile Number (10 digits starting with 6, 7, 8, or 9)
 */
export const validateMobileNumber = (mobile) => {
  if (!mobile || mobile.trim() === '') return { isValid: true }; // optional
  const clean = mobile.replace(/\D/g, '');
  if (clean.length !== 10) {
    return { isValid: false, message: 'मोबाइल नंबर ठीक 10 अंकों का होना चाहिए' };
  }
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return { isValid: false, message: 'मान्य भारतीय मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates 12-digit Aadhaar Number (UIDAI standard: 12 digits, cannot start with 0 or 1)
 */
export const validateAadhaarNumber = (aadhaar) => {
  if (!aadhaar || aadhaar.trim() === '' || aadhaar.trim() === 'नहीं' || aadhaar.trim() === 'उपलब्ध नहीं') {
    return { isValid: true }; // optional/not available
  }
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length !== 12) {
    return { isValid: false, message: 'आधार नंबर पूरे 12 अंकों का होना चाहिए (या "नहीं" लिखें)' };
  }
  if (/^[01]/.test(clean)) {
    return { isValid: false, message: 'आधार नंबर 0 या 1 से शुरू नहीं हो सकता' };
  }
  // Check for dummy repetitions like 111111111111, 999999999999
  if (/^(\d)\1{11}$/.test(clean)) {
    return { isValid: false, message: 'अमान्य आधार नंबर (सभी अंक समान नहीं हो सकते)' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Election Commission Voter ID (EPIC)
 */
export const validateVoterId = (epic) => {
  if (!epic || epic.trim() === '' || epic.trim() === 'नहीं' || epic.trim() === 'उपलब्ध नहीं') return { isValid: true };
  const clean = sanitizeAlphanumeric(epic);
  if (clean.length < 5 || clean.length > 20) {
    return { isValid: false, message: 'मतदाता पहचान पत्र (EPIC) 5 से 20 वर्णों का होना चाहिए' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Indian Passport Number (1 letter + 7 digits = 8 characters)
 */
export const validatePassportNumber = (passport) => {
  if (!passport || passport.trim() === '' || passport.trim() === 'नहीं' || passport.trim() === 'उपलब्ध नहीं') {
    return { isValid: true };
  }
  const clean = sanitizeAlphanumeric(passport).toUpperCase();
  if (clean.length !== 8) {
    return {
      isValid: false,
      message: 'भारतीय पासपोर्ट पूरे 8 वर्णों (1 अक्षर व 7 अंक, उदा. M1234567) का होना चाहिए'
    };
  }
  if (!/^[A-Z][0-9]{7}$/.test(clean)) {
    return {
      isValid: false,
      message: 'पासपोर्ट प्रारूप अमान्य है: प्रथम वर्ण अक्षर तथा शेष 7 अंक होने चाहिए (उदा. Z1234567)'
    };
  }
  return { isValid: true, cleanValue: clean };
};

// --- 4. COMPREHENSIVE MEMBER VALIDATION ---

export const validateMemberRecord = (member, existingMembers = [], currentIndex = null) => {
  const errors = {};

  // Q.1 Name check
  const cleanName = sanitizeName(member.q1_name || '');
  if (!cleanName || cleanName.length < 2) {
    errors.q1_name = 'व्यक्ति का नाम कम से कम 2 अक्षरों का होना आवश्यक है';
  } else if (/^(NA|N\/A|TEST|DEMO|UNKNOWN|XYZ|NONE)$/i.test(cleanName)) {
    errors.q1_name = 'कृपया व्यक्ति का वास्तविक नाम दर्ज करें';
  }

  // Q.2 Relationship & Head-of-household consistency
  const relCode = Number(member.q2_relationship);
  const isMember1 = (currentIndex === 0 || (!currentIndex && member.serial_no === 1));

  if (isMember1 && relCode !== 1) {
    errors.q2_relationship = 'परिवार का प्रथम सदस्य (क्र. 1) अनिवार्यतः "मुखिया (01)" होना चाहिए';
  } else if (!isMember1 && relCode === 1) {
    errors.q2_relationship = 'एक परिवार में केवल एक ही "मुखिया (01)" हो सकता है';
  }

  // Q.3 Gender
  const gender = Number(member.q3_gender);
  if (![1, 2, 3].includes(gender)) {
    errors.q3_gender = 'कृपया मान्य लिंग चुनें';
  }

  // Q.4 Age & DOB validation
  const age = Number(member.q4b_age);
  if (member.q4b_age === '' || isNaN(age)) {
    errors.q4b_age = 'आयु दर्ज करना अनिवार्य है';
  } else if (age < 0 || age > 125) {
    errors.q4b_age = 'आयु 0 से 125 वर्ष के मध्य होनी चाहिए';
  }

  // If DOB provided, check validity
  if (member.q4a_dob && member.q4a_dob.trim() !== '') {
    const dobCheck = parseAndValidateDob(member.q4a_dob);
    if (!dobCheck.isValid) {
      errors.q4a_dob = dobCheck.message;
    }
  }

  // Q.5 & Q.6 Marital Status & Age at Marriage
  const maritalStatus = Number(member.q5_marital_status);
  if (maritalStatus >= 2) {
    // Ever-married
    const ageAtMarriage = Number(member.q6_age_at_marriage);
    if (!member.q6_age_at_marriage || isNaN(ageAtMarriage)) {
      errors.q6_age_at_marriage = 'विवाहित सदस्य हेतु विवाह के समय आयु दर्ज करना आवश्यक है';
    } else if (ageAtMarriage > age) {
      errors.q6_age_at_marriage = `विवाह के समय आयु (${ageAtMarriage}) वर्तमान आयु (${age}) से अधिक नहीं हो सकती`;
    } else if (ageAtMarriage < 5) {
      errors.q6_age_at_marriage = 'विवाह के समय आयु 5 वर्ष से कम नहीं हो सकती';
    }

    // Q.7 Spouse Serial Number Cross-check
    if (member.q7_spouse_serial_no && member.q7_spouse_serial_no !== '00') {
      const spouseSNo = Number(member.q7_spouse_serial_no);
      if (spouseSNo === member.serial_no) {
        errors.q7_spouse_serial_no = 'पति/पत्नी का क्र.सं. स्वयं का क्र.सं. नहीं हो सकता';
      }
    }
  }

  // Parent Serial Number Cross-checks (Q.11 & Q.12)
  if (member.q11_father_in_hh) {
    if (!member.q11_father_serial_no) {
      errors.q11_father_serial_no = 'कृपया परिवार में पिता का चयन करें या "परिवार से बाहर" चुनें';
    } else {
      const fatherSNo = Number(member.q11_father_serial_no);
      if (fatherSNo === member.serial_no) {
        errors.q11_father_serial_no = 'पिता का क्र.सं. स्वयं का क्र.सं. नहीं हो सकता';
      } else if (Array.isArray(existingMembers) && existingMembers.length > 0) {
        const father = existingMembers.find((f) => f.serial_no === fatherSNo);
        if (father) {
          if (Number(father.q3_gender) !== 1) {
            errors.q11_father_serial_no = 'पिता का लिंग केवल पुरुष (1) होना चाहिए';
          } else if (father.q4b_age && member.q4b_age && Number(father.q4b_age) < Number(member.q4b_age) + 15) {
            errors.q11_father_serial_no = `पिता की आयु (${father.q4b_age}) संतान (${member.q4b_age}) से कम से कम 15 वर्ष अधिक होनी चाहिए`;
          } else if ((Number(member.q2_relationship) === 1 || Number(member.q2_relationship) === 13) && Number(father.q2_relationship) !== 12) {
            errors.q11_father_serial_no = 'मुखिया या भाई/बहन के पिता केवल "माता/पिता (12)" कोड वाले बुजुर्ग सदस्य हो सकते हैं (छोटा/बड़ा भाई या अन्य नहीं)';
          } else if (Number(member.q2_relationship) === 3 && Number(father.q2_relationship) === 3) {
            errors.q11_father_serial_no = 'संतान का पिता दूसरा भाई/बहन नहीं हो सकता';
          }
        }
      }
    }
  }

  if (member.q12_mother_in_hh) {
    if (!member.q12_mother_serial_no) {
      errors.q12_mother_serial_no = 'कृपया परिवार में माता का चयन करें या "परिवार से बाहर" चुनें';
    } else {
      const motherSNo = Number(member.q12_mother_serial_no);
      if (motherSNo === member.serial_no) {
        errors.q12_mother_serial_no = 'माता का क्र.सं. स्वयं का क्र.सं. नहीं हो सकता';
      } else if (Array.isArray(existingMembers) && existingMembers.length > 0) {
        const mother = existingMembers.find((mot) => mot.serial_no === motherSNo);
        if (mother) {
          if (Number(mother.q3_gender) !== 2) {
            errors.q12_mother_serial_no = 'माता का लिंग केवल महिला (2) होना चाहिए';
          } else if (mother.q4b_age && member.q4b_age && Number(mother.q4b_age) < Number(member.q4b_age) + 15) {
            errors.q12_mother_serial_no = `माता की आयु (${mother.q4b_age}) संतान (${member.q4b_age}) से कम से कम 15 वर्ष अधिक होनी चाहिए`;
          } else if ((Number(member.q2_relationship) === 1 || Number(member.q2_relationship) === 13) && Number(mother.q2_relationship) !== 12) {
            errors.q12_mother_serial_no = 'मुखिया या भाई/बहन की माता केवल "माता/पिता (12)" कोड वाली बुजुर्ग सदस्य हो सकती हैं';
          } else if (Number(member.q2_relationship) === 3 && Number(mother.q2_relationship) === 3) {
            errors.q12_mother_serial_no = 'संतान की माता दूसरी बहन/भाई नहीं हो सकती';
          }
        }
      }
    }
  }

  // Fertility validation for Females (Q.31 - Q.33)
  if (gender === 2 && maritalStatus >= 2) {
    const bornFemale = Number(member.q31_children_ever_born_female) || 0;
    const bornMale = Number(member.q31_children_ever_born_male) || 0;
    const totalBorn = bornFemale + bornMale;

    const survFemale = Number(member.q32_children_surviving_female) || 0;
    const survMale = Number(member.q32_children_surviving_male) || 0;
    const totalSurv = survFemale + survMale;

    const lastYearFemale = Number(member.q33_children_born_last_year_female) || 0;
    const lastYearMale = Number(member.q33_children_born_last_year_male) || 0;
    const totalLastYear = lastYearFemale + lastYearMale;

    if (totalSurv > totalBorn) {
      errors.q32_children_surviving = `जीवित संतानों की संख्या (${totalSurv}) कभी कुल जन्मी संतानों (${totalBorn}) से अधिक नहीं हो सकती`;
    }

    if (totalLastYear > totalBorn) {
      errors.q33_children_born_last_year = `पिछले 1 वर्ष में जन्मी संतानें कुल संतानों से अधिक नहीं हो सकतीं`;
    }

    if (age < 12 && totalBorn > 0) {
      errors.q31_children_ever_born = `आयु 12 वर्ष से कम होने पर संतान संख्या दर्ज नहीं हो सकती`;
    }
  }

  // Identifiers validations
  if (member.q36_mobile_number) {
    const mobCheck = validateMobileNumber(member.q36_mobile_number);
    if (!mobCheck.isValid) errors.q36_mobile_number = mobCheck.message;
  }

  if (member.q37_aadhaar_number) {
    const aadhaarCheck = validateAadhaarNumber(member.q37_aadhaar_number);
    if (!aadhaarCheck.isValid) errors.q37_aadhaar_number = aadhaarCheck.message;
  }

  if (age >= 18 && member.q38_voter_id_epic) {
    const epicCheck = validateVoterId(member.q38_voter_id_epic);
    if (!epicCheck.isValid) errors.q38_voter_id_epic = epicCheck.message;
  }

  if (member.q39_passport_number) {
    const passCheck = validatePassportNumber(member.q39_passport_number);
    if (!passCheck.isValid) errors.q39_passport_number = passCheck.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
