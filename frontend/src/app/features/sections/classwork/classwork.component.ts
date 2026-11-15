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
  name: string | null; // null = the default group
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

  // Display name of the default group. Renaming it only changes this label.
  protected readonly defaultTopicName = signal('No topic');

  // Bumped whenever MOCK_ACTIVITIES changes so the view refreshes
  private readonly version = signal(0);
  private bump(): void {
    this.version.update((v) => v + 1);
  }

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
    this.version();
    return MOCK_ACTIVITIES.filter((item) => item.sectionId === this.sectionId);
  }

  // The default group is always first and always shown
  protected get groups(): ClassworkGroup[] {
    const items = this.items;
    const named = this.topics().map((name) => ({
      name,
      items: items.filter((item) => item.topic === name),
    }));
    const unassigned = items.filter((item) => !item.topic);
    return [{ name: null, items: unassigned }, ...named];
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
      const name = result.title.trim();
      if (this.nameTaken(name, null)) {
        this.snackBar.open('A topic with that name already exists.', 'Dismiss', {
          duration: 4000,
        });
        return;
      }
      this.topics.update((t) => [...t, name]);
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
      linkUrl: result.linkUrl,
    };
    MOCK_ACTIVITIES.push(item);
    this.bump();
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
    item.linkUrl = result.linkUrl;
    if (item.kind === 'Activity') {
      item.dueAt = result.dueAt;
      item.points = result.points;
    }
    this.bump();
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
          this.bump();
        }
      });
  }

  // true if another topic (or the default group) already uses this name
  private nameTaken(name: string, except: string | null): boolean {
    const lower = name.toLowerCase();
    const all = [this.defaultTopicName(), ...this.topics()];
    return all.some((n) => n.toLowerCase() === lower && n !== except);
  }

  protected async editTopic(oldName: string | null): Promise<void> {
    const current = oldName ?? this.defaultTopicName();

    const result = await firstValueFrom(
      this.dialog
        .open<ClassworkItemDialogComponent, ClassworkDialogData, ClassworkDialogResult>(
          ClassworkItemDialogComponent,
          { width: '560px', data: { kind: 'Topic', initialTitle: current } },
        )
        .afterClosed(),
    );
    const newName = result?.title.trim();
    if (!newName || newName === current) return;

    if (this.nameTaken(newName, current)) {
      this.snackBar.open('A topic with that name already exists.', 'Dismiss', {
        duration: 4000,
      });
      return;
    }

    // Default group: only the label changes
    if (oldName === null) {
      this.defaultTopicName.set(newName);
      return;
    }

    this.topics.update((t) => t.map((n) => (n === oldName ? newName : n)));
    MOCK_ACTIVITIES.forEach((item) => {
      if (item.sectionId === this.sectionId && item.topic === oldName) {
        item.topic = newName;
      }
    });
    this.bump();
  }

  protected deleteTopic(topicName: string | null): void {
    const displayName = topicName ?? this.defaultTopicName();
    const message =
      topicName === null
        ? `Remove everything in "${displayName}"? All its materials and activities will be permanently deleted.`
        : `Delete "${displayName}"? All materials and activities inside it will be permanently removed.`;

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '560px',
        data: { message },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        // The default group stays; named topics are removed
        if (topicName !== null) {
          this.topics.update((t) => t.filter((name) => name !== topicName));
        }

        for (let i = MOCK_ACTIVITIES.length - 1; i >= 0; i--) {
          const it = MOCK_ACTIVITIES[i];
          const inGroup = topicName === null ? !it.topic : it.topic === topicName;
          if (it.sectionId === this.sectionId && inGroup) {
            MOCK_ACTIVITIES.splice(i, 1);
          }
        }
        this.bump();
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
      this.bump();
    } catch {
      this.snackBar.open('File upload failed.', 'Dismiss', { duration: 5000 });
    }
  }
}