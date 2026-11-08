import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/confirm-dialog/confirm-dialog.component';
import { MOCK_ACTIVITIES } from '../../../shared/mock/lms-mock-data';
import { Activity } from '../../../shared/models/lms.models';
import { StorageService, displayNameFromPath } from '../../../shared/storage/storage.service';
import {
  ClassworkDialogData,
  ClassworkDialogKind,
  ClassworkDialogResult,
  ClassworkItemDialogComponent,
} from './classwork-item-dialog/classwork-item-dialog.component';

interface ClassworkGroup {
  name: string | null;
  items: Activity[];
}

@Component({
  selector: 'app-classwork',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatMenuModule, MatIconModule],
  templateUrl: './classwork.component.html',
  styleUrl: './classwork.component.scss',
})
export class ClassworkComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(StorageService);

  protected readonly sectionId = inject(ActivatedRoute).parent?.snapshot.paramMap.get('id') ?? '';

  protected readonly createKinds: readonly ClassworkDialogKind[] = [
    'Topic',
    'Material',
    'Activity',
  ];

  // 1. TOPICS IS NOW A SIGNAL
  protected readonly topics = signal<string[]>(
    Array.from(
      new Set(
        MOCK_ACTIVITIES.filter((i) => i.sectionId === this.sectionId && i.topic).map(
          (i) => i.topic as string,
        ),
      ),
    ),
  );

  protected get items(): Activity[] {
    return MOCK_ACTIVITIES.filter((item) => item.sectionId === this.sectionId);
  }

  // 2. NOTICE THE PARENTHESES ON this.topics()
  protected get groups(): ClassworkGroup[] {
    const items = this.items;
    const named = this.topics().map((name) => ({
      // <--- this.topics() with ()
      name,
      items: items.filter((item) => item.topic === name),
    }));
    const unassigned = items.filter((item) => item.topic === null);
    return unassigned.length > 0 ? [{ name: null, items: unassigned }, ...named] : named;
  }

  protected attachmentName(item: Activity): string | null {
    return item.attachmentPath ? displayNameFromPath(item.attachmentPath) : null;
  }

  protected async openCreate(
    kind: ClassworkDialogKind,
    topicName: string | null = null,
  ): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<ClassworkItemDialogComponent, ClassworkDialogData, ClassworkDialogResult>(
          ClassworkItemDialogComponent,
          { width: '560px', data: { kind } },
        )
        .afterClosed(),
    );
    if (!result) return;

    if (kind === 'Topic') {
      this.topics.update((t) => [...t, result.title]); // Signal update
      return;
    }

    const isActivity = kind === 'Activity';
    const item: Activity = {
      id: `item-${Date.now()}`,
      sectionId: this.sectionId,
      kind,
      title: result.title,
      details: result.details,
      dueAt: isActivity ? result.dueAt : null,
      points: isActivity ? result.points : 0,
      topic: topicName,
      attachmentPath: null,
    };
    MOCK_ACTIVITIES.push(item);
    if (result.file) {
      await this.attachFile(item, result.file);
    }
  }

  protected async openEdit(item: Activity): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<ClassworkItemDialogComponent, ClassworkDialogData, ClassworkDialogResult>(
          ClassworkItemDialogComponent,
          { width: '560px', data: { kind: item.kind, item } },
        )
        .afterClosed(),
    );
    if (!result) return;

    item.title = result.title;
    item.details = result.details;
    if (item.kind === 'Activity') {
      item.dueAt = result.dueAt;
      item.points = result.points;
    }
    if (result.file) {
      await this.attachFile(item, result.file);
    }
  }

  protected confirmDelete(item: Activity): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '560px',
        data: { message: `Delete "${item.title}"? This action is permanent and cannot be undone.` },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          const index = MOCK_ACTIVITIES.findIndex((i) => i.id === item.id);
          if (index !== -1) MOCK_ACTIVITIES.splice(index, 1);
        }
      });
  }

  // 3. EDIT TOPIC USING SIGNALS AND WINDOW.PROMPT
  protected editTopic(oldName: string | null): void {
    const defaultPrompt = oldName ?? 'New Topic';
    const newName = window.prompt('Enter new topic name:', defaultPrompt);

    if (!newName || newName.trim() === '' || newName === oldName) return;

    if (oldName === null) {
      this.topics.update((t) => [...t, newName]);
    } else {
      this.topics.update((t) => t.map((name) => (name === oldName ? newName : name)));
    }

    MOCK_ACTIVITIES.forEach((item) => {
      if (item.sectionId === this.sectionId && item.topic === oldName) {
        item.topic = newName;
      }
    });
  }

  protected deleteTopic(topicName: string | null): void {
    const displayName = topicName ?? 'No topic';

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '560px',
        data: {
          message: `Delete "${displayName}"? All materials and activities inside it will be permanently removed.`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        if (topicName !== null) {
          this.topics.update((t) => t.filter((name) => name !== topicName));
        }

        for (let i = MOCK_ACTIVITIES.length - 1; i >= 0; i--) {
          if (
            MOCK_ACTIVITIES[i].sectionId === this.sectionId &&
            MOCK_ACTIVITIES[i].topic === topicName
          ) {
            MOCK_ACTIVITIES.splice(i, 1);
          }
        }
      });
  }

  protected async openAttachment(item: Activity): Promise<void> {
    if (!item.attachmentPath) return;
    try {
      const url = await this.storage.getMaterialUrl(item.attachmentPath);
      window.open(url, '_blank', 'noopener');
    } catch {
      this.snackBar.open('Could not open the file. Try again.', 'Dismiss', { duration: 5000 });
    }
  }

  private async attachFile(item: Activity, file: File): Promise<void> {
    try {
      item.attachmentPath = await this.storage.uploadMaterial(item.sectionId, file);
    } catch {
      this.snackBar.open('File upload failed.', 'Dismiss', { duration: 5000 });
    }
  }
}
