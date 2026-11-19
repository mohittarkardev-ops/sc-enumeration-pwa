import { inflate, inflateRaw } from 'pako';

/**
 * =====================================================================
 * Aadhaar QR Code Parser — UIDAI Official Format Specification
 * =====================================================================
 * Supports:
 *  1. Modern Secure Aadhaar QR Codes (V2, V3, V4, V5 & future versions)
 *     (BigInteger decimal string -> gzip decompressed -> 0xFF separated)
 *  2. Legacy XML QR Codes (<PrintLetterBarcodeData ... />)
 *  3. JSON QR Codes (DigiLocker / mAadhaar)
 *
 * Rules:
 *  - Q.11 (Father) and Q.7 (Spouse) are NOT auto-filled from Care-Of.
 *  - Secure QR codes do not contain 12-digit UID; last 4 digits are extracted
 *    and provided as `last4` / `maskedAadhaar` for confirmation.
 *  - Full 12-digit Aadhaar field is kept empty for manual entry unless unmasked.
 * =====================================================================
 */

export const parseAadhaarQRCode = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    return { success: false, error: 'अमान्य QR डेटा प्राप्त हुआ' };
  }

  const trimmed = rawData.trim();

  // 1. Legacy XML format
  if (trimmed.includes('<PrintLetterBarcodeData') || trimmed.startsWith('<?xml')) {
    return parseAadhaarXml(trimmed);
  }

  // 2. JSON format (DigiLocker / mAadhaar)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const json = JSON.parse(trimmed);
      return parseAadhaarJson(json);
    } catch (_) { /* continue */ }
  }

  // 3. Modern Secure Aadhaar QR Code (BigInteger decimal string)
  if (/^\d{100,}$/.test(trimmed)) {
    return parseSecureAadhaarQR(trimmed);
  }

  return {
    success: false,
    error: 'आधार QR कोड प्रारूप पहचाना नहीं जा सका। कृपया आधार कार्ड के स्पष्ट QR कोड पर फोकस करें।'
  };
};

/**
 * Convert BigInteger decimal string to Uint8Array
 */
function bigIntToBytes(decStr) {
  let hex = BigInt(decStr).toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const len = hex.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Parses Modern UIDAI Secure QR Code
 */
const parseSecureAadhaarQR = (bigIntString) => {
  try {
    const bytes = bigIntToBytes(bigIntString);

    // Decompress gzip payload
    let decompressed;
    try {
      decompressed = inflate(bytes);
    } catch (_) {
      try {
        decompressed = inflateRaw(bytes);
      } catch (err2) {
        return { success: false, error: 'QR डेटा डीकंप्रेस नहीं हो सका: ' + err2.message };
      }
    }

    // UIDAI Secure QR fields are separated by 0xFF (255)
    // We stop before photo bytes (JPEG2000 has 0xFF markers)
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const parts = [];
    let start = 0;

    for (let i = 0; i < decompressed.length; i++) {
      if (decompressed[i] === 0xFF) {
        const text = decoder.decode(decompressed.slice(start, i)).trim();
        parts.push(text);
        start = i + 1;
        // Text header is always within first 25 parts
        if (parts.length >= 25) break;
      }
    }

    if (parts.length < 5) {
      return { success: false, error: 'QR डेटा में आवश्यक फ़ील्ड्स नहीं मिले' };
    }

    // ── ANCHOR 1: Locate DOB ──
    // In UIDAI specification, DOB is always present near the start (indices 3 or 4)
    let dobIdx = -1;
    for (let i = 0; i < Math.min(parts.length, 8); i++) {
      const p = parts[i];
      if (/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(p) || /^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(p)) {
        dobIdx = i;
        break;
      }
      if (/^\d{4}$/.test(p)) {
        const num = parseInt(p, 10);
        if (num >= 1900 && num <= 2030) {
          dobIdx = i;
          break;
        }
      }
    }

    if (dobIdx === -1) {
      return { success: false, error: 'QR में जन्मतिथि (DOB) नहीं मिली' };
    }

    // ── ANCHOR 2: Name & Reference ID ──
    // Immediately preceding DOB is the resident's Name
    const rawName = parts[dobIdx - 1] || '';
    // Immediately preceding Name is Reference ID (contains last 4 digits of Aadhaar)
    const refId = dobIdx >= 2 ? parts[dobIdx - 2] : '';

    // ── ANCHOR 3: Gender ──
    // Immediately following DOB is Gender ('M', 'F', 'T')
    const genderRaw = (parts[dobIdx + 1] || '').toUpperCase().trim();

    // ── ANCHOR 4: Care-Of ──
    // Immediately following Gender is Care-Of ('D/O ...', 'S/O ...', 'W/O ...')
    const careOf = parts[dobIdx + 2] || '';

    // Format DOB and calculate age
    const dobRaw = parts[dobIdx];
    const { dob, age } = parseDobAge(dobRaw);

    // Parse Gender: 1-Male, 2-Female, 3-Other
    let genderCode = 1;
    if (genderRaw === 'F' || genderRaw.startsWith('FEM')) {
      genderCode = 2;
    } else if (genderRaw === 'T' || genderRaw.startsWith('TRAN') || genderRaw === 'O') {
      genderCode = 3;
    }

    // Last 4 digits of Aadhaar from Reference ID (first 4 characters of refId)
    const last4 = refId ? refId.replace(/\D/g, '').slice(0, 4) : '';
    const maskedAadhaar = last4 ? `XXXX XXXX ${last4}` : '';

    // ── ANCHOR 5: Address Parsing & Deduplication ──
    // Address fields start after Care-Of up to photo/mobile boundary
    const addrSlice = parts.slice(dobIdx + 3, Math.min(parts.length, 18));
    let pincode = '';
    const cleanTokens = [];
    const seen = new Set();

    for (const token of addrSlice) {
      if (!token || /^[\.,\-_/]+$/.test(token)) continue;
      // 6-digit Indian PIN code
      if (/^[1-9]\d{5}$/.test(token)) {
        pincode = token;
        continue;
      }
      // Skip masked mobile numbers (e.g. XXXXXX4162) or emails
      if (/^X{4,}\d{2,4}$/i.test(token) || token.includes('@')) {
        continue;
      }
      const lower = token.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      cleanTokens.push(token);
    }

    let finalAddress = cleanTokens.join(', ');
    if (pincode) {
      finalAddress += (finalAddress ? ' - ' : '') + pincode;
    }

    return {
      success: true,
      data: {
        name: rawName,
        gender: genderCode,
        dob,
        age,
        aadhaarNumber: '', // Left empty for manual entry of 12 digits
        last4,
        maskedAadhaar,
        address: finalAddress,
        careOf,
        format: 'Secure Aadhaar QR'
      }
    };
  } catch (err) {
    return { success: false, error: 'सिक्योर आधार QR डीकोड विफलता: ' + err.message };
  }
};

/**
 * Parses Legacy XML Aadhaar QR Code (<PrintLetterBarcodeData ... />)
 */
const parseAadhaarXml = (xmlString) => {
  try {
    const attr = (name) => {
      const m = xmlString.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
      return m ? m[1].trim() : '';
    };

    const name = attr('name');
    const genderR = attr('gender').toUpperCase();
    const dobRaw = attr('dob');
    const yobRaw = attr('yob');
    const uidRaw = attr('uid');
    const careOf = attr('co');

    const addressParts = [
      attr('house'), attr('street'), attr('lm'), attr('loc'),
      attr('vtc'), attr('po'), attr('subdist'), attr('dist'),
      attr('state')
    ].filter(Boolean);

    const pc = attr('pc');
    let address = addressParts.join(', ');
    if (pc) address += (address ? ' - ' : '') + pc;

    const { dob, age } = parseDobAge(dobRaw || (yobRaw ? `01/01/${yobRaw}` : ''));

    let genderCode = 1;
    if (genderR === 'F' || genderR.startsWith('FEM')) genderCode = 2;
    else if (genderR === 'T' || genderR.startsWith('TRAN') || genderR === 'O') genderCode = 3;

    // Full 12-digit Aadhaar if unmasked
    const cleanUid = uidRaw.replace(/\D/g, '');
    const aadhaarNumber = (cleanUid.length === 12 && !uidRaw.toUpperCase().includes('X'))
      ? cleanUid : '';
    const last4 = cleanUid.length >= 4 ? cleanUid.slice(-4) : '';

    return {
      success: true,
      data: {
        name,
        gender: genderCode,
        dob,
        age,
        aadhaarNumber,
        last4,
        maskedAadhaar: last4 ? `XXXX XXXX ${last4}` : '',
        address,
        careOf,
        format: 'XML'
      }
    };
  } catch (err) {
    return { success: false, error: 'XML आधार QR पार्स करने में त्रुटि: ' + err.message };
  }
};

/**
 * Parses JSON formatted Aadhaar (DigiLocker / mAadhaar)
 */
const parseAadhaarJson = (json) => {
  const name = json.name || json.Name || '';
  const genderR = (json.gender || json.Gender || '').toUpperCase();
  const dobRaw = json.dob || json.DOB || json.dateOfBirth || '';
  const { dob, age } = parseDobAge(dobRaw);

  let genderCode = 1;
  if (genderR === 'F' || genderR.startsWith('FEM')) genderCode = 2;
  else if (genderR === 'T' || genderR.startsWith('TRAN') || genderR === 'O') genderCode = 3;

  const uidRaw = String(json.uid || json.aadhaar || '');
  const cleanUid = uidRaw.replace(/\D/g, '');
  const aadhaarNumber = (cleanUid.length === 12 && !uidRaw.toUpperCase().includes('X'))
    ? cleanUid : '';
  const last4 = cleanUid.length >= 4 ? cleanUid.slice(-4) : '';

  const addressTokens = [
    json.house, json.street, json.landmark || json.lm,
    json.locality || json.loc, json.vtc, json.postOffice || json.po,
    json.district || json.dist, json.state
  ].filter(Boolean);

  let address = json.address || json.Address || addressTokens.join(', ');
  const pc = json.pincode || json.pc;
  if (pc && !address.includes(pc)) {
    address += (address ? ' - ' : '') + pc;
  }

  return {
    success: true,
    data: {
      name,
      gender: genderCode,
      dob,
      age,
      aadhaarNumber,
      last4,
      maskedAadhaar: last4 ? `XXXX XXXX ${last4}` : '',
      address,
      careOf: json.careOf || json.co || '',
      format: 'JSON'
    }
  };
};

/**
 * Normalizes DOB to DD/MM/YYYY and calculates age accurately
 */
function parseDobAge(raw) {
  if (!raw) return { dob: '', age: null };

  const clean = raw.trim().replace(/\./g, '/').replace(/-/g, '/');

  let dob = '';
  let year = null;
  let month = null;
  let day = null;

  // DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    day = parseInt(dmy[1], 10);
    month = parseInt(dmy[2], 10);
    year = parseInt(dmy[3], 10);
    dob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  // YYYY/MM/DD
  const ymd = clean.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!dob && ymd) {
    year = parseInt(ymd[1], 10);
    month = parseInt(ymd[2], 10);
    day = parseInt(ymd[3], 10);
    dob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  // YYYY only
  if (!dob && /^\d{4}$/.test(clean)) {
    year = parseInt(clean, 10);
    dob = `01/01/${year}`;
    day = 1;
    month = 1;
  }

  if (!dob) return { dob: clean, age: null };

  let age = null;
  if (year && month && day) {
    const today = new Date();
    age = today.getFullYear() - year;
    if (
      today.getMonth() < month - 1 ||
      (today.getMonth() === month - 1 && today.getDate() < day)
    ) {
      age--;
    }
    if (age < 0 || age > 130) age = null;
  }

  return { dob, age };
}
