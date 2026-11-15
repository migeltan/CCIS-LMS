export interface Section {
  id: string;
  courseId: string;
  name: string;
  sectionCode: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  coverGradient: string;
  coverImageUrl?: string;
  sections: Section[];
}

export type ClassworkKind = 'Material' | 'Activity';

export interface Activity {
  id: string;
  sectionId: string;
  kind: ClassworkKind;
  title: string;
  details: string;
  dueAt: string | null;
  points: number;
  topic: string | null;
  attachmentPath?: string | null;
  linkUrl?: string | null;
}

export interface Student {
  id: string;
  sectionId: string;
  lastName: string;
  firstName: string;
}

export type GradeStatus = 'Turned In' | 'Pending';

export interface Grade {
  studentId: string;
  activityId: string;
  score: number | null;
  status: GradeStatus;
  submissionFile?: string | null;
}

export interface Announcement {
  id: string;
  authorName: string;
  postedAt: string;
  body: string;
}
