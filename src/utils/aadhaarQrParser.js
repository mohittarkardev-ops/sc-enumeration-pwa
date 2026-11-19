import { inflate, inflateRaw } from 'pako';
import { parseAndValidateDob } from './validation';

/**
 * Parses raw text/data scanned from any Aadhaar QR Code (Old XML, Modern Secure V2, or JSON)
 * Extracts:
 * - name (व्यक्ति का नाम - Q.1)
 * - gender (लिंग - Q.3: 1-पुरुष, 2-महिला, 3-अन्य)
 * - dob (जन्म तिथि - Q.4a: DD/MM/YYYY)
 * - age (आयु - Q.4b)
 * - aadhaarNumber (12-digit UID if unmasked, otherwise null for manual typing)
 * - address (स्थायी पता - Q.30)
 * 
 * NOTE: As per user instructions:
 * - Q.11 (Father) and Q.7 (Spouse) are NOT auto-filled from Care-Of.
 * - If Aadhaar number is masked (e.g. XXXX XXXX 1234), it is left empty for manual 12-digit entry.
 */
export const parseAadhaarQRCode = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    return { success: false, error: 'अमान्य QR डेटा प्राप्त हुआ' };
  }

  const trimmed = rawData.trim();

  // 1. Try parsing Old XML format (<PrintLetterBarcodeData ... />)
  if (trimmed.includes('<PrintLetterBarcodeData') || trimmed.startsWith('<?xml')) {
    return parseAadhaarXml(trimmed);
  }

  // 2. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const json = JSON.parse(trimmed);
      return parseAadhaarJson(json);
    } catch (e) {
      // Continue to next parsers
    }
  }

  // 3. Try parsing Modern Secure Aadhaar QR Code (BigInteger compressed byte stream)
  if (/^\d{100,}$/.test(trimmed)) {
    try {
      return parseSecureAadhaarQR(trimmed);
    } catch (err) {
      console.warn('Secure QR decode attempt failed, falling back:', err);
    }
  }

  // 4. Try raw binary decompressed fallback if scanned as binary
  try {
    return parseSecureAadhaarQRFromBytes(trimmed);
  } catch (err) {
    // Fallback
  }

  return {
    success: false,
    error: 'आधार QR कोड का प्रारूप पहचाना नहीं जा सका। कृपया आधार कार्ड के स्पष्ट QR कोड पर कैमरा फोकस करें।'
  };
};

/**
 * Parses Old Aadhaar XML format
 */
const parseAadhaarXml = (xmlString) => {
  try {
    // Extract XML attributes using robust regex
    const getAttr = (attr) => {
      const match = xmlString.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
      return match ? match[1].trim() : '';
    };

    const name = getAttr('name');
    const genderRaw = getAttr('gender').toUpperCase();
    const dobRaw = getAttr('dob');
    const yobRaw = getAttr('yob');
    const uidRaw = getAttr('uid');

    // Address parts
    const house = getAttr('house');
    const street = getAttr('street');
    const lm = getAttr('lm');
    const loc = getAttr('loc');
    const vtc = getAttr('vtc');
    const po = getAttr('po');
    const dist = getAttr('dist');
    const subdist = getAttr('subdist');
    const state = getAttr('state');
    const pc = getAttr('pc');

    const addressParts = [house, street, lm, loc, vtc, po, dist, subdist, state, pc].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    // Normalize DOB (DD/MM/YYYY)
    let formattedDob = '';
    let calculatedAge = null;

    if (dobRaw) {
      formattedDob = normalizeDob(dobRaw);
      const dobVal = parseAndValidateDob(formattedDob);
      if (dobVal.isValid && dobVal.calculatedAge !== null) {
        calculatedAge = dobVal.calculatedAge;
      }
    } else if (yobRaw) {
      const currentYear = 2026;
      const yobNum = parseInt(yobRaw, 10);
      if (!isNaN(yobNum) && yobNum > 1900 && yobNum <= currentYear) {
        calculatedAge = currentYear - yobNum;
        formattedDob = `01/01/${yobNum}`;
      }
    }

    // Gender: 1-Male, 2-Female, 3-Other
    let genderCode = 1;
    if (genderRaw === 'F' || genderRaw === 'FEMALE') genderCode = 2;
    else if (genderRaw === 'T' || genderRaw === 'TRANSGENDER' || genderRaw === 'O') genderCode = 3;

    // Full 12-digit Aadhaar check
    let fullAadhaar = '';
    const cleanUid = uidRaw.replace(/\D/g, '');
    if (cleanUid.length === 12 && !uidRaw.toUpperCase().includes('X')) {
      fullAadhaar = cleanUid;
    }

    return {
      success: true,
      data: {
        name: name,
        gender: genderCode,
        dob: formattedDob,
        age: calculatedAge,
        aadhaarNumber: fullAadhaar, // only if 12 digits, else empty for manual entry
        address: fullAddress,
        format: 'XML'
      }
    };
  } catch (err) {
    return { success: false, error: 'XML आधार QR पार्स करने में त्रुटि: ' + err.message };
  }
};

/**
 * Parses Modern UIDAI Secure Aadhaar QR Code (2018 onwards)
 */
const parseSecureAadhaarQR = (bigIntString) => {
  try {
    // 1. Convert BigInteger decimal string to bytes
    const bigInt = BigInt(bigIntString);
    let hex = bigInt.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;

    const len = hex.length / 2;
    const byteArray = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    // 2. Decompress bytes with pako inflate
    let decompressed;
    try {
      decompressed = inflate(byteArray);
    } catch (e1) {
      try {
        decompressed = inflateRaw(byteArray);
      } catch (e2) {
        throw new Error('संपीड़ित डेटा डीकंप्रेस नहीं हो सका: ' + e2.message);
      }
    }

    return extractFieldsFromDecompressedBytes(decompressed);
  } catch (err) {
    return { success: false, error: 'सिक्योर आधार QR डीकोड विफलता: ' + err.message };
  }
};

/**
 * Fallback for binary / raw bytes secure QR
 */
const parseSecureAadhaarQRFromBytes = (str) => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  const decompressed = inflate(bytes);
  return extractFieldsFromDecompressedBytes(decompressed);
};

/**
 * Extracts UTF-8 strings from decompressed UIDAI byte stream
 */
const extractFieldsFromDecompressedBytes = (decompressedBytes) => {
  // Delimiter in UIDAI Secure QR is 255 (0xFF)
  const fields = [];
  let currentFieldBytes = [];

  for (let i = 0; i < decompressedBytes.length; i++) {
    const b = decompressedBytes[i];
    if (b === 255 || b === 0) {
      if (currentFieldBytes.length > 0) {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(currentFieldBytes));
        fields.push(text);
        currentFieldBytes = [];
      } else {
        fields.push('');
      }
      // Usually there are 15-18 text fields before photo bytes
      if (fields.length >= 17) break;
    } else {
      currentFieldBytes.push(b);
    }
  }

  if (fields.length < 4) {
    throw new Error('पर्याप्त टेक्स्ट फील्ड्स नहीं मिले');
  }

  // UIDAI Secure QR V2 Fields:
  // fields[0]: Email/Mobile indicator
  // fields[1]: Reference ID
  // fields[2]: Name
  // fields[3]: DOB (DD-MM-YYYY)
  // fields[4]: Gender (M/F/T)
  // fields[5]: Care Of
  // fields[6]: District
  // fields[7]: Landmark
  // fields[8]: House
  // fields[9]: Location
  // fields[10]: Pincode
  // fields[11]: Post Office
  // fields[12]: State
  // fields[13]: Street
  // fields[14]: Sub District
  // fields[15]: VTC (Village/Town)

  const name = fields[2] || fields[1] || '';
  const dobRaw = fields[3] || '';
  const genderRaw = (fields[4] || '').toUpperCase();

  const formattedDob = normalizeDob(dobRaw);
  let calculatedAge = null;
  if (formattedDob) {
    const dobVal = parseAndValidateDob(formattedDob);
    if (dobVal.isValid && dobVal.calculatedAge !== null) {
      calculatedAge = dobVal.calculatedAge;
    }
  }

  let genderCode = 1;
  if (genderRaw === 'F' || genderRaw.startsWith('FEM')) genderCode = 2;
  else if (genderRaw === 'T' || genderRaw === 'O' || genderRaw.startsWith('TRAN')) genderCode = 3;

  // Build clean address
  const house = fields[8] || '';
  const street = fields[13] || '';
  const lm = fields[7] || '';
  const loc = fields[9] || '';
  const vtc = fields[15] || '';
  const po = fields[11] || '';
  const dist = fields[6] || '';
  const state = fields[12] || '';
  const pc = fields[10] || '';

  const address = [house, street, lm, loc, vtc, po, dist, state, pc].filter(Boolean).join(', ');

  // Note: Modern Secure QR does NOT contain full 12 digits (only masked/reference ID),
  // so per user requirement we leave aadhaarNumber empty for manual 12-digit entry.
  return {
    success: true,
    data: {
      name: name.trim(),
      gender: genderCode,
      dob: formattedDob,
      age: calculatedAge,
      aadhaarNumber: '', // Leave empty for manual typing of full 12 digits
      address: address.trim(),
      format: 'Secure V2 QR'
    }
  };
};

/**
 * Parses JSON formatted Aadhaar (DigiLocker / mAadhaar)
 */
const parseAadhaarJson = (json) => {
  const name = json.name || json.Name || '';
  const genderRaw = (json.gender || json.Gender || '').toUpperCase();
  const dobRaw = json.dob || json.DOB || json.dateOfBirth || '';
  const formattedDob = normalizeDob(dobRaw);
  let calculatedAge = null;
  if (formattedDob) {
    const dobVal = parseAndValidateDob(formattedDob);
    if (dobVal.isValid && dobVal.calculatedAge !== null) {
      calculatedAge = dobVal.calculatedAge;
    }
  }

  let genderCode = 1;
  if (genderRaw === 'F' || genderRaw === 'FEMALE') genderCode = 2;
  else if (genderRaw === 'T' || genderRaw === 'TRANSGENDER') genderCode = 3;

  const uidRaw = json.uid || json.aadhaar || '';
  let fullAadhaar = '';
  const cleanUid = String(uidRaw).replace(/\D/g, '');
  if (cleanUid.length === 12 && !String(uidRaw).toUpperCase().includes('X')) {
    fullAadhaar = cleanUid;
  }

  const address = json.address || json.Address || [json.house, json.street, json.vtc, json.dist, json.state, json.pincode].filter(Boolean).join(', ');

  return {
    success: true,
    data: {
      name,
      gender: genderCode,
      dob: formattedDob,
      age: calculatedAge,
      aadhaarNumber: fullAadhaar,
      address,
      format: 'JSON'
    }
  };
};

/**
 * Helper to normalize various DOB formats to DD/MM/YYYY
 */
const normalizeDob = (str) => {
  if (!str) return '';
  const clean = str.trim().replace(/\./g, '/').replace(/-/g, '/');
  // If YYYY/MM/DD
  const ymd = clean.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) {
    return `${ymd[3].padStart(2, '0')}/${ymd[2].padStart(2, '0')}/${ymd[1]}`;
  }
  // If DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
  }
  return clean;
};
