import { Tables, TablesInsert } from './database.types';

export type Activity = Tables<'activities'>;
export type Submission = Tables<'submissions'>;
export type Attachment = Tables<'attachments'>;

export type NewActivity = TablesInsert<'activities'>;

export type SubmissionWithFiles = Submission & { attachments: Attachment[] };

export interface NewSubmission {
  activityId: string;
  sectionId: string; // needed for the storage path
  studentId: string;
  answerText: string | null; // the link goes here
  file?: File | null;
}