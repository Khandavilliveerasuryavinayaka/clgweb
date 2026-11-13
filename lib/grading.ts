/**
 * Grading and Marks Calculation Engine
 * Enforces strict SV College Academic Governance rules:
 * - Internal Exam Max: 50 (Pass: >= 25)
 * - External Exam Max: 50 (Pass: >= 25)
 * - Total Max: 100 (Pass: >= 50)
 * 
 * Passing requirement:
 * Internal >= 25 AND External >= 25 AND Total >= 50
 * If any condition fails: Status = FAIL, Grade = F, Grade Points = 0.
 */

export interface CalculatedResult {
  total: number | null;
  grade: string;
  gradePoints: number;
  passStatus: 'PASS' | 'FAIL' | 'PENDING';
  isInternalPass: boolean;
  isExternalPass: boolean;
  isTotalPass: boolean;
  errorMessage?: string;
}

export function validateExternalMarks(external: any): { isValid: boolean; error?: string; value: number | null } {
  if (external === '' || external === null || external === undefined) {
    return { isValid: true, value: null };
  }
  const num = Number(external);
  if (isNaN(num)) {
    return { isValid: false, error: 'External marks must be a valid number.', value: null };
  }
  if (num < 0) {
    return { isValid: false, error: 'External marks cannot be negative.', value: null };
  }
  if (num > 50) {
    return { isValid: false, error: 'External marks cannot exceed 50.', value: null };
  }
  return { isValid: true, value: Math.round(num * 10) / 10 };
}

export function calculateResult(
  internal: number | null | undefined,
  external: number | null | undefined
): CalculatedResult {
  if (internal === null || internal === undefined || isNaN(internal)) {
    return {
      total: null,
      grade: '—',
      gradePoints: 0,
      passStatus: 'PENDING',
      isInternalPass: false,
      isExternalPass: false,
      isTotalPass: false,
      errorMessage: 'Internal marks not available',
    };
  }

  if (external === null || external === undefined || isNaN(external)) {
    return {
      total: null,
      grade: '—',
      gradePoints: 0,
      passStatus: 'PENDING',
      isInternalPass: internal >= 25,
      isExternalPass: false,
      isTotalPass: false,
      errorMessage: 'External marks missing',
    };
  }

  const roundedInternal = Math.round(internal * 10) / 10;
  const roundedExternal = Math.round(external * 10) / 10;
  const total = Math.round((roundedInternal + roundedExternal) * 10) / 10;

  const isInternalPass = roundedInternal >= 25;
  const isExternalPass = roundedExternal >= 25;
  const isTotalPass = total >= 50;
  const isPass = isInternalPass && isExternalPass && isTotalPass;

  if (!isPass) {
    return {
      total,
      grade: 'F',
      gradePoints: 0,
      passStatus: 'FAIL',
      isInternalPass,
      isExternalPass,
      isTotalPass,
    };
  }

  let grade = 'F';
  let gradePoints = 0;

  if (total >= 90) {
    grade = 'O';
    gradePoints = 10;
  } else if (total >= 80) {
    grade = 'A+';
    gradePoints = 9;
  } else if (total >= 70) {
    grade = 'A';
    gradePoints = 8;
  } else if (total >= 60) {
    grade = 'B+';
    gradePoints = 7;
  } else if (total >= 50) {
    grade = 'B';
    gradePoints = 6;
  } else {
    grade = 'F';
    gradePoints = 0;
  }

  return {
    total,
    grade,
    gradePoints,
    passStatus: 'PASS',
    isInternalPass,
    isExternalPass,
    isTotalPass,
  };
}
