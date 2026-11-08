import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { demoDataLoaded } from '../../../shared/mock/lms-mock-data';

interface PostComment {
  author: string;
  date: string;
  content: string;
}

interface Post {
  author: string;
  date: string;
  content: string;
  comments: PostComment[];
  draft?: string;
}

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.scss',
})
export class StreamComponent {
  newPost = '';
  posts: Post[] = demoDataLoaded()
    ? [
        {
          author: 'Prof. Santos',
          date: 'October 28, 2026 10:00 AM',
          content: 'Welcome to SIA! Please check the Classwork tab for the syllabus.',
          comments: [],
        },
      ]
    : [];

  submitPost(): void {
    if (!this.newPost.trim()) {
      return;
    }
    this.posts.unshift({
      author: 'Prof. Santos',
      date: new Date().toLocaleString(),
      content: this.newPost.trim(),
      comments: [],
    });
    this.newPost = '';
  }

  addComment(post: Post): void {
    const content = post.draft?.trim();
    if (!content) {
      return;
    }
    post.comments.push({
      author: 'Prof. Santos',
      date: new Date().toLocaleString(),
      content,
    });
    post.draft = '';
  }
}
