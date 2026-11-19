/**
 * Smart Family Tree & Relational Cross-Referencing Engine
 * Handles automatic, intelligent resolution of:
 * - Q.7 Spouse Serial Number
 * - Q.11 Father Serial Number & Living Status
 * - Q.12 Mother Serial Number & Living Status
 * 
 * Works purely based on relationship codes, gender, marital status and age,
 * NEVER assuming arbitrary serial numbers (e.g. handles widower with son as Member #2 cleanly).
 */

export const resolveFamilyRelationships = (members = []) => {
  if (!Array.isArray(members) || members.length === 0) return [];

  // Helper lookups
  const head = members.find((m) => Number(m.q2_relationship) === 1);
  const headSerialNo = head ? head.serial_no : 1;
  const isHeadMale = head ? Number(head.q3_gender) === 1 : true;
  const isHeadFemale = head ? Number(head.q3_gender) === 2 : false;

  // Find Head's spouse if present in household
  const headSpouse = members.find((m) => Number(m.q2_relationship) === 2);
  const headParents = members.filter((m) => Number(m.q2_relationship) === 12);
  const headFather = headParents.find((m) => Number(m.q3_gender) === 1);
  const headMother = headParents.find((m) => Number(m.q3_gender) === 2);

  // Sons and Daughters of Head (relationship code 3)
  const sons = members.filter((m) => Number(m.q2_relationship) === 3 && Number(m.q3_gender) === 1);
  const marriedSons = sons.filter((m) => Number(m.q5_marital_status) === 2);
  const daughtersInLaw = members.filter((m) => Number(m.q2_relationship) === 4);

  return members.map((m) => {
    const sNo = m.serial_no;
    const rel = Number(m.q2_relationship);
    const gender = Number(m.q3_gender);
    const marital = Number(m.q5_marital_status) || 1;
    const isMarried = marital === 2;

    let inferredSpouse = m.q7_spouse_serial_no || '';
    let inferredFatherInHh = m.q11_father_in_hh;
    let inferredFatherSNo = m.q11_father_serial_no;
    let inferredMotherInHh = m.q12_mother_in_hh;
    let inferredMotherSNo = m.q12_mother_serial_no;

    // ==========================================
    // 1. SMART SPOUSE RESOLUTION (Q.7)
    // ==========================================
    if (marital === 1) {
      // Unmarried: Spouse is Not Applicable
      inferredSpouse = '';
    } else if (rel === 1) {
      // Member is HEAD: Spouse MUST have relationship code 2
      if (headSpouse) {
        inferredSpouse = String(headSpouse.serial_no);
      } else {
        // No spouse in household (Widower / Separated / Spouse away)
        inferredSpouse = m.q7_spouse_serial_no || '00';
      }
    } else if (rel === 2) {
      // Member is SPOUSE OF HEAD: Spouse is Head (Member #1)
      inferredSpouse = String(headSerialNo);
    } else if (rel === 3 && isMarried && gender === 1 && daughtersInLaw.length === 1) {
      // Married son and only one daughter-in-law in household
      inferredSpouse = String(daughtersInLaw[0].serial_no);
    } else if (rel === 4 && daughtersInLaw.length === 1 && marriedSons.length === 1) {
      // Daughter-in-law and only one married son
      inferredSpouse = String(marriedSons[0].serial_no);
    }

    // ==========================================
    // 2. SMART FATHER RESOLUTION (Q.11)
    // ==========================================
    if (inferredFatherInHh === undefined || inferredFatherInHh === null) {
      if (rel === 3) {
        // Child of Head (बेटा / बेटी):
        if (isHeadMale) {
          inferredFatherInHh = true;
          inferredFatherSNo = headSerialNo;
        } else if (isHeadFemale && headSpouse && Number(headSpouse.q3_gender) === 1) {
          inferredFatherInHh = true;
          inferredFatherSNo = headSpouse.serial_no;
        } else {
          inferredFatherInHh = false;
          inferredFatherSNo = '';
        }
      } else if (rel === 6) {
        // Grandchild (पोता / पोती): Father is son of Head
        if (marriedSons.length === 1) {
          inferredFatherInHh = true;
          inferredFatherSNo = marriedSons[0].serial_no;
        } else if (sons.length === 1) {
          inferredFatherInHh = true;
          inferredFatherSNo = sons[0].serial_no;
        }
      } else if (rel === 1) {
        // Head: Father has relationship code 12 & gender 1
        if (headFather) {
          inferredFatherInHh = true;
          inferredFatherSNo = headFather.serial_no;
        } else {
          inferredFatherInHh = false;
          inferredFatherSNo = '';
        }
      }
    }

    // ==========================================
    // 3. SMART MOTHER RESOLUTION (Q.12)
    // ==========================================
    if (inferredMotherInHh === undefined || inferredMotherInHh === null) {
      if (rel === 3) {
        // Child of Head (बेटा / बेटी):
        if (isHeadFemale) {
          inferredMotherInHh = true;
          inferredMotherSNo = headSerialNo;
        } else if (isHeadMale && headSpouse && Number(headSpouse.q3_gender) === 2) {
          inferredMotherInHh = true;
          inferredMotherSNo = headSpouse.serial_no;
        } else {
          inferredMotherInHh = false;
          inferredMotherSNo = '';
        }
      } else if (rel === 6) {
        // Grandchild (पोता / पोती): Mother is daughter-in-law (बहू)
        if (daughtersInLaw.length === 1) {
          inferredMotherInHh = true;
          inferredMotherSNo = daughtersInLaw[0].serial_no;
        }
      } else if (rel === 1) {
        // Head: Mother has relationship code 12 & gender 2
        if (headMother) {
          inferredMotherInHh = true;
          inferredMotherSNo = headMother.serial_no;
        } else {
          inferredMotherInHh = false;
          inferredMotherSNo = '';
        }
      }
    }

    return {
      ...m,
      q7_spouse_serial_no: inferredSpouse,
      q11_father_in_hh: inferredFatherInHh !== undefined ? inferredFatherInHh : !!m.q11_father_in_hh,
      q11_father_serial_no: inferredFatherSNo ? Number(inferredFatherSNo) : (m.q11_father_serial_no || null),
      q12_mother_in_hh: inferredMotherInHh !== undefined ? inferredMotherInHh : !!m.q12_mother_in_hh,
      q12_mother_serial_no: inferredMotherSNo ? Number(inferredMotherSNo) : (m.q12_mother_serial_no || null)
    };
  });
};

/**
 * Returns available members list for dropdowns with clean human-readable labels
 * Example: "1 - रमेश (मुखिया, 45 वर्ष, पुरुष)"
 */
export const getMemberDropdownOptions = (members = [], excludeSerialNo = null) => {
  return members
    .filter((m) => m.serial_no !== excludeSerialNo)
    .map((m) => {
      const relName = m.q2_relationship === 1 ? 'मुखिया' : m.q2_relationship === 2 ? 'पति/पत्नी' : m.q2_relationship === 3 ? 'बेटा/बेटी' : 'सदस्य';
      const genderName = m.q3_gender === 1 ? 'पु.' : m.q3_gender === 2 ? 'महि.' : '';
      return {
        serial_no: m.serial_no,
        name: m.q1_name || `सदस्य #${m.serial_no}`,
        label: `${m.serial_no} - ${m.q1_name || 'अनाम'} (${relName}${genderName ? ', ' + genderName : ''}${m.q4b_age ? ', ' + m.q4b_age + ' वर्ष' : ''})`
      };
    });
};
