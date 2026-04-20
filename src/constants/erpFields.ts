export interface ERPField {
  key: string;
  label: string;
  required?: boolean;
  autoMapKeywords: string[];
}

export const ERP_FIELDS: ERPField[] = [
  { key: 'name', label: 'Name', required: true, autoMapKeywords: ['name', 'student', 'full name'] },
  { key: 'fatherName', label: 'Father\'s Name', autoMapKeywords: ['father', 'parent'] },
  { key: 'motherName', label: 'Mother\'s Name', autoMapKeywords: ['mother'] },
  { key: 'dob', label: 'Date of Birth', autoMapKeywords: ['dob', 'birth', 'date'] },
  { key: 'phone', label: 'Phone Number', required: true, autoMapKeywords: ['phone', 'mobile', 'contact'] },
  { key: 'regNo', label: 'Registration No', required: true, autoMapKeywords: ['reg', 'enrollment', 'roll'] },
  { key: 'course', label: 'Course', autoMapKeywords: ['course', 'degree'] },
  { key: 'stream', label: 'Stream', autoMapKeywords: ['stream', 'branch'] },
  { key: 'batch', label: 'Batch', autoMapKeywords: ['batch', 'year'] },
  { key: 'section', label: 'Section', autoMapKeywords: ['section'] },
  { key: 'gender', label: 'Gender', autoMapKeywords: ['gender', 'sex'] },
  { key: 'category', label: 'Category', autoMapKeywords: ['category', 'caste'] },
];

export const INITIAL_PAYLOAD_DEFAULTS = {
  section: "A",
  branchId: "Morning",
  session: "2025-26 Odd",
  entity: "6487ec9e91f7297664a62ffc",
  qualifications: [],
  role: [],
  workExperience: [],
  oldNew: "HOGC",
  bankDetails: {}
};
