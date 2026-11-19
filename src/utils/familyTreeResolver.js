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
        if (isHeadMale && (!head.q4b_age || Number(head.q4b_age) >= Number(m.q4b_age || 0) + 12)) {
          inferredFatherInHh = true;
          inferredFatherSNo = headSerialNo;
        } else if (isHeadFemale && headSpouse && Number(headSpouse.q3_gender) === 1) {
          inferredFatherInHh = true;
          inferredFatherSNo = headSpouse.serial_no;
        } else {
          inferredFatherInHh = false;
          inferredFatherSNo = null;
        }
      } else if (rel === 6) {
        // Grandchild (पोता / पोती): Father is son of Head
        if (marriedSons.length === 1) {
          inferredFatherInHh = true;
          inferredFatherSNo = marriedSons[0].serial_no;
        } else if (sons.length === 1) {
          inferredFatherInHh = true;
          inferredFatherSNo = sons[0].serial_no;
        } else {
          inferredFatherInHh = false;
          inferredFatherSNo = null;
        }
      } else if (rel === 1 || rel === 13) {
        // Head or Head's Sibling (भाई/बहन): Father MUST be code 12 (माता/पिता) & at least 15 yrs older!
        if (headFather && (!m.q4b_age || Number(headFather.q4b_age) >= Number(m.q4b_age) + 15)) {
          inferredFatherInHh = true;
          inferredFatherSNo = headFather.serial_no;
        } else {
          inferredFatherInHh = false;
          inferredFatherSNo = null;
        }
      } else {
        inferredFatherInHh = false;
        inferredFatherSNo = null;
      }
    }

    // Invalidation Guard: Ensure father is logically and biologically valid
    if (inferredFatherSNo) {
      const selectedFather = members.find((f) => f.serial_no === Number(inferredFatherSNo));
      const childAge = Number(m.q4b_age || 0);
      const fatherAge = selectedFather ? Number(selectedFather.q4b_age || 0) : 0;

      if (!selectedFather ||
          Number(selectedFather.q3_gender) !== 1 ||
          (childAge > 0 && fatherAge > 0 && fatherAge < childAge + 15) ||
          ((rel === 1 || rel === 13) && Number(selectedFather.q2_relationship) !== 12) ||
          (rel === 3 && Number(selectedFather.q2_relationship) === 3) ||
          Number(selectedFather.q2_relationship) === 13) {
        inferredFatherInHh = false;
        inferredFatherSNo = null;
      }
    }

    // ==========================================
    // 3. SMART MOTHER RESOLUTION (Q.12)
    // ==========================================
    if (inferredMotherInHh === undefined || inferredMotherInHh === null) {
      if (rel === 3) {
        // Child of Head (बेटा / बेटी):
        if (isHeadFemale && (!head.q4b_age || Number(head.q4b_age) >= Number(m.q4b_age || 0) + 12)) {
          inferredMotherInHh = true;
          inferredMotherSNo = headSerialNo;
        } else if (isHeadMale && headSpouse && Number(headSpouse.q3_gender) === 2) {
          inferredMotherInHh = true;
          inferredMotherSNo = headSpouse.serial_no;
        } else {
          inferredMotherInHh = false;
          inferredMotherSNo = null;
        }
      } else if (rel === 6) {
        // Grandchild (पोता / पोती): Mother is daughter-in-law (बहू)
        if (daughtersInLaw.length === 1) {
          inferredMotherInHh = true;
          inferredMotherSNo = daughtersInLaw[0].serial_no;
        } else {
          inferredMotherInHh = false;
          inferredMotherSNo = null;
        }
      } else if (rel === 1 || rel === 13) {
        // Head or Head's Sibling (भाई/बहन): Mother MUST be code 12 (माता/पिता) & at least 15 yrs older!
        if (headMother && (!m.q4b_age || Number(headMother.q4b_age) >= Number(m.q4b_age) + 15)) {
          inferredMotherInHh = true;
          inferredMotherSNo = headMother.serial_no;
        } else {
          inferredMotherInHh = false;
          inferredMotherSNo = null;
        }
      } else {
        inferredMotherInHh = false;
        inferredMotherSNo = null;
      }
    }

    // Invalidation Guard: Ensure mother is logically and biologically valid
    if (inferredMotherSNo) {
      const selectedMother = members.find((mot) => mot.serial_no === Number(inferredMotherSNo));
      const childAge = Number(m.q4b_age || 0);
      const motherAge = selectedMother ? Number(selectedMother.q4b_age || 0) : 0;

      if (!selectedMother ||
          Number(selectedMother.q3_gender) !== 2 ||
          (childAge > 0 && motherAge > 0 && motherAge < childAge + 15) ||
          ((rel === 1 || rel === 13) && Number(selectedMother.q2_relationship) !== 12) ||
          (rel === 3 && Number(selectedMother.q2_relationship) === 3) ||
          Number(selectedMother.q2_relationship) === 13) {
        inferredMotherInHh = false;
        inferredMotherSNo = null;
      }
    }

    const finalFatherInHh = inferredFatherInHh !== undefined ? !!inferredFatherInHh : !!m.q11_father_in_hh;
    const finalFatherSNo = finalFatherInHh && inferredFatherSNo ? Number(inferredFatherSNo) : null;
    const finalMotherInHh = inferredMotherInHh !== undefined ? !!inferredMotherInHh : !!m.q12_mother_in_hh;
    const finalMotherSNo = finalMotherInHh && inferredMotherSNo ? Number(inferredMotherSNo) : null;

    return {
      ...m,
      q7_spouse_serial_no: inferredSpouse,
      q11_father_in_hh: finalFatherInHh,
      q11_father_serial_no: finalFatherSNo,
      q12_mother_in_hh: finalMotherInHh,
      q12_mother_serial_no: finalMotherSNo
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

/**
 * Logically and biologically filters valid potential fathers for a member.
 * Eliminates younger brothers, children, younger relatives, etc.
 */
export const getPotentialFathers = (member, allMembers = []) => {
  if (!member || !Array.isArray(allMembers)) return [];

  const currentSNo = member.serial_no;
  const currentRel = Number(member.q2_relationship || 1);
  const currentAge = Number(member.q4b_age || 0);

  return allMembers.filter((candidate) => {
    // 1. Cannot be self
    if (candidate.serial_no === currentSNo) return false;

    // 2. Must be male
    if (Number(candidate.q3_gender) !== 1) return false;

    // 3. Age barrier: Father MUST be an adult (>= 15) and at least 15 years older than the child!
    const candidateAge = Number(candidate.q4b_age || 0);
    if (candidateAge < 15) return false;
    if (currentAge > 0 && candidateAge < currentAge + 15) return false;
    // Even if currentAge is unknown, father must be older than candidate
    if (currentAge > 0 && candidateAge <= currentAge) return false;

    const candRel = Number(candidate.q2_relationship || 0);
    const candMarital = Number(candidate.q5_marital_status || 1);

    // Unmarried younger brothers (13) or sons (3) can NEVER be father of Head or adult members
    if ([3, 4, 6, 7, 13].includes(candRel)) {
      if (currentRel === 1 || currentRel === 13) return false;
    }

    // 4. Head of household (मुखिया - 01): Father can ONLY be someone with code 12 (माता/पिता)
    if (currentRel === 1) {
      return candRel === 12 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 30);
    }

    // 5. Brother/Sister of Head (भाई/बहन - 13): Father is Head's father (Code 12)
    if (currentRel === 13) {
      return candRel === 12 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 30);
    }

    // 6. Spouse of Head (पति/पत्नी - 02): Head or Head's children/siblings cannot be father
    if (currentRel === 2) {
      return candRel === 30 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 35);
    }

    // 7. Child of Head (बेटा/बेटी - 03): Father is male Head (01) or Head's husband (02)
    if (currentRel === 3) {
      return (candRel === 1 && Number(candidate.q3_gender) === 1) ||
             (candRel === 2 && Number(candidate.q3_gender) === 1);
    }

    // 8. Grandchild of Head (पोता/पोती - 06): Father is son of Head (03)
    if (currentRel === 6) {
      return candRel === 3 && Number(candidate.q3_gender) === 1 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 20);
    }

    // 9. Daughter-in-law (बहू - 04): Biological father cannot be in-laws
    if (currentRel === 4) {
      return candRel === 30;
    }

    // Exclude children, grandchildren, and siblings
    if ([3, 4, 6, 7, 13].includes(candRel)) return false;

    return true;
  });
};

/**
 * Logically and biologically filters valid potential mothers for a member.
 */
export const getPotentialMothers = (member, allMembers = []) => {
  if (!member || !Array.isArray(allMembers)) return [];

  const currentSNo = member.serial_no;
  const currentRel = Number(member.q2_relationship || 1);
  const currentAge = Number(member.q4b_age || 0);

  return allMembers.filter((candidate) => {
    // 1. Cannot be self
    if (candidate.serial_no === currentSNo) return false;

    // 2. Must be female
    if (Number(candidate.q3_gender) !== 2) return false;

    // 3. Age barrier: Mother MUST be an adult (>= 15) and at least 15 years older than the child!
    const candidateAge = Number(candidate.q4b_age || 0);
    if (candidateAge < 15) return false;
    if (currentAge > 0 && candidateAge < currentAge + 15) return false;
    if (currentAge > 0 && candidateAge <= currentAge) return false;

    const candRel = Number(candidate.q2_relationship || 0);

    // Younger sisters (13) or daughters (3) can NEVER be mother of Head or adult members
    if ([3, 4, 6, 7, 13].includes(candRel)) {
      if (currentRel === 1 || currentRel === 13) return false;
    }

    // 4. Head of household (मुखिया - 01): Mother can ONLY be someone with code 12 (माता/पिता)
    if (currentRel === 1) {
      return candRel === 12 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 30);
    }

    // 5. Brother/Sister of Head (भाई/बहन - 13): Mother is Head's mother (Code 12)
    if (currentRel === 13) {
      return candRel === 12 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 30);
    }

    // 6. Spouse of Head (पति/पत्नी - 02)
    if (currentRel === 2) {
      return candRel === 30 && candidateAge >= (currentAge > 0 ? currentAge + 15 : 35);
    }

    // 7. Child of Head (बेटा/बेटी - 03): Mother is female Head (01) or Head's wife (02)
    if (currentRel === 3) {
      return (candRel === 1 && Number(candidate.q3_gender) === 2) ||
             (candRel === 2 && Number(candidate.q3_gender) === 2);
    }

    // 8. Grandchild of Head (पोता/पोती - 06): Mother is daughter-in-law (04) or daughter (03)
    if (currentRel === 6) {
      return (candRel === 4 || (candRel === 3 && Number(candidate.q3_gender) === 2)) && candidateAge >= (currentAge > 0 ? currentAge + 15 : 20);
    }

    // 9. Daughter-in-law (बहू - 04)
    if (currentRel === 4) {
      return candRel === 30;
    }

    // Exclude children, grandchildren, and siblings
    if ([3, 4, 6, 7, 13].includes(candRel)) return false;

    return true;
  });
};
