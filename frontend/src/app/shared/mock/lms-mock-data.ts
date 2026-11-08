import { signal } from '@angular/core';

import { Activity, Announcement, Course, Grade, Section, Student } from '../models/lms.models';

const DEMO_COURSES: Course[] = [
  {
    id: 'course-sia',
    code: 'IT-301',
    title: 'Systems Integration and Architecture',
    coverGradient: 'linear-gradient(135deg, #7b7fb8, #5b4f9e)',
    sections: [
      {
        id: 'sec-bsit-3a',
        courseId: 'course-sia',
        name: 'BSIT 3 - A',
        sectionCode: 'A1B2-C3D4',
      },
      {
        id: 'sec-bscs-3a',
        courseId: 'course-sia',
        name: 'BSCS 3 - A',
        sectionCode: 'E5F6-G7H8',
      },
    ],
  },
  {
    id: 'course-web',
    code: 'IT-302',
    title: 'Web Development',
    coverGradient: 'linear-gradient(135deg, #b9c8da, #9a9cb0)',
    sections: [
      {
        id: 'sec-bsit-3b',
        courseId: 'course-web',
        name: 'BSIT 3 - B',
        sectionCode: 'J9K1-L2M3',
      },
    ],
  },
  {
    id: 'course-intro',
    code: 'IT-101',
    title: 'Introduction to Computing',
    coverGradient: 'linear-gradient(135deg, #e9c3c8, #b78aa6)',
    sections: [
      {
        id: 'sec-bsit-1a',
        courseId: 'course-intro',
        name: 'BSIT 1 - A',
        sectionCode: 'N4P5-Q6R7',
      },
    ],
  },
];

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    authorName: 'Prof. Santos',
    postedAt: '2026-10-28T10:00:00',
    body: 'Welcome to SIA! Please check the Classwork tab for the syllabus.',
  },
];

const DEMO_ACTIVITIES: Activity[] = [
  {
    id: 'mat-1',
    sectionId: 'sec-bsit-3a',
    kind: 'Material',
    title: 'Course syllabus',
    details: 'Read before our first meeting.',
    dueAt: null,
    points: 0,
    topic: 'Week 1',
  },
  {
    id: 'act-1',
    sectionId: 'sec-bsit-3a',
    kind: 'Activity',
    title: 'Project 1',
    details: 'Submit your system architecture proposal as a PDF.',
    dueAt: '2026-11-09T23:59',
    points: 100,
    topic: null,
  },
  {
    id: 'act-2',
    sectionId: 'sec-bsit-3a',
    kind: 'Activity',
    title: 'Exercise 1',
    details: 'Complete the integration worksheet.',
    dueAt: '2026-11-11T17:00',
    points: 50,
    topic: null,
  },
];

const DEMO_STUDENTS: Student[] = [
  { id: 'stu-1', sectionId: 'sec-bsit-3a', lastName: 'Reyes', firstName: 'Ana' },
  { id: 'stu-2', sectionId: 'sec-bsit-3a', lastName: 'Santos', firstName: 'Ben' },
  { id: 'stu-3', sectionId: 'sec-bsit-3a', lastName: 'Dela Cruz', firstName: 'Carla' },
  { id: 'stu-4', sectionId: 'sec-bsit-3a', lastName: 'Garcia', firstName: 'Diego' },
  { id: 'stu-5', sectionId: 'sec-bsit-3a', lastName: 'Lim', firstName: 'Elise' },
  { id: 'stu-6', sectionId: 'sec-bsit-3a', lastName: 'Tan', firstName: 'Francis' },
];

const DEMO_GRADES: Grade[] = [
  {
    studentId: 'stu-1',
    activityId: 'act-1',
    score: 92,
    status: 'Turned In',
    submissionFile: 'stu-1_act-1.pdf',
  },
  {
    studentId: 'stu-1',
    activityId: 'act-2',
    score: 45,
    status: 'Turned In',
    submissionFile: 'stu-1_act-2.pdf',
  },
  { studentId: 'stu-2', activityId: 'act-1', score: null, status: 'Pending' },
  {
    studentId: 'stu-2',
    activityId: 'act-2',
    score: 38,
    status: 'Turned In',
    submissionFile: 'stu-2_act-2.pdf',
  },
  {
    studentId: 'stu-3',
    activityId: 'act-1',
    score: 85,
    status: 'Turned In',
    submissionFile: 'stu-3_act-1.pdf',
  },
  { studentId: 'stu-3', activityId: 'act-2', score: null, status: 'Pending' },
  {
    studentId: 'stu-4',
    activityId: 'act-1',
    score: 78,
    status: 'Turned In',
    submissionFile: 'stu-4_act-1.pdf',
  },
  {
    studentId: 'stu-4',
    activityId: 'act-2',
    score: 42,
    status: 'Turned In',
    submissionFile: 'stu-4_act-2.pdf',
  },
  {
    studentId: 'stu-5',
    activityId: 'act-1',
    score: 100,
    status: 'Turned In',
    submissionFile: 'stu-5_act-1.pdf',
  },
  {
    studentId: 'stu-5',
    activityId: 'act-2',
    score: 50,
    status: 'Turned In',
    submissionFile: 'stu-5_act-2.pdf',
  },
  { studentId: 'stu-6', activityId: 'act-1', score: null, status: 'Pending' },
  { studentId: 'stu-6', activityId: 'act-2', score: null, status: 'Pending' },
];

export const MOCK_COURSES: Course[] = [];
export const MOCK_ANNOUNCEMENTS: Announcement[] = [];
export const MOCK_ACTIVITIES: Activity[] = [];
export const MOCK_STUDENTS: Student[] = [];
export const MOCK_GRADES: Grade[] = [];

const DEMO_FLAG_KEY = 'ia-demo-data';

/** True while the sample data is loaded. Drives the "Demo data" toggle. */
export const demoDataLoaded = signal(false);

function replaceContents<T>(target: T[], source: T[]): void {
  target.splice(0, target.length, ...source);
}

function saveFlag(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(DEMO_FLAG_KEY, '1');
    } else {
      localStorage.removeItem(DEMO_FLAG_KEY);
    }
  } catch {
    // Storage can be blocked; the toggle still works for this session.
  }
}

function readFlag(): boolean {
  try {
    return localStorage.getItem(DEMO_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

/** Replaces everything in memory with copies of the sample data. */
export function loadDemoData(): void {
  replaceContents(MOCK_COURSES, structuredClone(DEMO_COURSES));
  replaceContents(MOCK_ANNOUNCEMENTS, structuredClone(DEMO_ANNOUNCEMENTS));
  replaceContents(MOCK_ACTIVITIES, structuredClone(DEMO_ACTIVITIES));
  replaceContents(MOCK_STUDENTS, structuredClone(DEMO_STUDENTS));
  replaceContents(MOCK_GRADES, structuredClone(DEMO_GRADES));
  demoDataLoaded.set(true);
  saveFlag(true);
}

/** Empties everything, including anything added during the session. */
export function clearDemoData(): void {
  replaceContents(MOCK_COURSES, []);
  replaceContents(MOCK_ANNOUNCEMENTS, []);
  replaceContents(MOCK_ACTIVITIES, []);
  replaceContents(MOCK_STUDENTS, []);
  replaceContents(MOCK_GRADES, []);
  demoDataLoaded.set(false);
  saveFlag(false);
}

export function findSectionById(id: string | null): Section | undefined {
  return MOCK_COURSES.flatMap((course) => course.sections).find((section) => section.id === id);
}

// Keep demo mode across page refreshes (mock data itself resets on refresh).
if (readFlag()) {
  loadDemoData();
}
