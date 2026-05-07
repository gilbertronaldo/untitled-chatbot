export interface EducationRecord {
  student_id: string;
  grade_level: string;
  school: string;
  attendance_pct: number;
  math_score: number;
  reading_score: number;
  science_score: number;
  term: "Term 1" | "Term 2" | "Term 3";
}

export const educationDataset: EducationRecord[] = [
  { student_id: "STU-001", grade_level: "Grade 8", school: "North High", attendance_pct: 95, math_score: 82, reading_score: 79, science_score: 84, term: "Term 1" },
  { student_id: "STU-002", grade_level: "Grade 8", school: "North High", attendance_pct: 89, math_score: 76, reading_score: 81, science_score: 78, term: "Term 1" },
  { student_id: "STU-003", grade_level: "Grade 9", school: "Central Academy", attendance_pct: 97, math_score: 91, reading_score: 88, science_score: 90, term: "Term 1" },
  { student_id: "STU-004", grade_level: "Grade 9", school: "Central Academy", attendance_pct: 92, math_score: 85, reading_score: 84, science_score: 83, term: "Term 1" },
  { student_id: "STU-005", grade_level: "Grade 10", school: "Westview", attendance_pct: 88, math_score: 74, reading_score: 77, science_score: 75, term: "Term 1" },
  { student_id: "STU-006", grade_level: "Grade 10", school: "Westview", attendance_pct: 94, math_score: 86, reading_score: 82, science_score: 87, term: "Term 1" },
  { student_id: "STU-007", grade_level: "Grade 8", school: "North High", attendance_pct: 96, math_score: 84, reading_score: 82, science_score: 85, term: "Term 2" },
  { student_id: "STU-008", grade_level: "Grade 9", school: "Central Academy", attendance_pct: 90, math_score: 80, reading_score: 83, science_score: 79, term: "Term 2" },
  { student_id: "STU-009", grade_level: "Grade 10", school: "Westview", attendance_pct: 93, math_score: 88, reading_score: 85, science_score: 89, term: "Term 2" },
  { student_id: "STU-010", grade_level: "Grade 8", school: "North High", attendance_pct: 87, math_score: 72, reading_score: 76, science_score: 73, term: "Term 2" },
  { student_id: "STU-011", grade_level: "Grade 9", school: "Central Academy", attendance_pct: 98, math_score: 93, reading_score: 90, science_score: 92, term: "Term 3" },
  { student_id: "STU-012", grade_level: "Grade 10", school: "Westview", attendance_pct: 91, math_score: 83, reading_score: 80, science_score: 84, term: "Term 3" },
  { student_id: "STU-013", grade_level: "Grade 8", school: "North High", attendance_pct: 94, math_score: 86, reading_score: 84, science_score: 88, term: "Term 3" },
  { student_id: "STU-014", grade_level: "Grade 9", school: "Central Academy", attendance_pct: 86, math_score: 71, reading_score: 74, science_score: 70, term: "Term 3" },
  { student_id: "STU-015", grade_level: "Grade 10", school: "Westview", attendance_pct: 95, math_score: 90, reading_score: 87, science_score: 91, term: "Term 3" },
];

export const educationDatasetSchema = `
Dataset: Education Performance (${educationDataset.length} records)
Fields:
- student_id: Student identifier
- grade_level: Student grade level
- school: School name
- attendance_pct: Attendance percentage
- math_score: Math score
- reading_score: Reading score
- science_score: Science score
- term: Academic term
`;
