import {Component, signal} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {FolderNode} from './node.directive';

export interface TreeNode {
  id: number;
  name: string;
  children: TreeNode[];
}

const taxReturn: TreeNode = {id: 10, name: '2024-return.pdf', children: []};
const taxReceipts: TreeNode = {
  id: 11, name: 'receipts', children: [
    {id: 12, name: 'q1-receipts.csv', children: []},
    {id: 13, name: 'q2-receipts.csv', children: []},
  ]
};
const taxes: TreeNode = {id: 9, name: 'taxes', children: [taxReturn, taxReceipts]};
const resume: TreeNode = {id: 3, name: 'resume.pdf', children: []};
const coverLetter: TreeNode = {id: 4, name: 'cover-letter.docx', children: []};

const docs: TreeNode = {id: 2, name: 'docs', children: [resume, coverLetter, taxes]};

const vacation: TreeNode = {
  id: 6, name: 'vacation', children: [
    {id: 7, name: 'beach.jpg', children: []},
    {id: 8, name: 'sunset.png', children: []},
  ]
};
const photos: TreeNode = {id: 5, name: 'photos', children: [vacation]};

const music: TreeNode = {
  id: 14, name: 'music', children: [
    {
      id: 15, name: 'playlists', children: [
        {id: 16, name: 'chill.m3u', children: []},
        {id: 17, name: 'workout.m3u', children: []},
      ]
    },
    {
      id: 18, name: 'albums', children: [
        {
          id: 19, name: 'dark-side-of-the-moon', children: [
            {id: 20, name: '01-speak-to-me.flac', children: []},
            {id: 21, name: '02-breathe.flac', children: []},
            {id: 22, name: '03-time.flac', children: []},
          ]
        },
      ]
    },
  ]
};

const projects: TreeNode = {
  id: 23, name: 'projects', children: [
    {
      id: 24, name: 'mastering-angular', children: [
        {
          id: 25, name: 'src', children: [
            {id: 26, name: 'app', children: []},
            {id: 27, name: 'assets', children: []},
          ]
        },
        {id: 28, name: 'package.json', children: []},
      ]
    },
  ]
};

const root: TreeNode = {id: 1, name: 'root', children: [docs, photos, music, projects]};
@Component({
  selector: 'app-folder-explorer',
  imports: [
    NgTemplateOutlet,
    FolderNode
  ],
  templateUrl: './folder-explorer.html',
  styleUrl: './folder-explorer.scss',
})
export default class FolderExplorer {

  protected readonly root = root;

  private readonly extensionIcons: Record<string, string> = {
    '.pdf': '📄',
    '.docx': '📝',
    '.csv': '📊',
    '.jpg': '🖼️',
    '.png': '🖼️',
    '.flac': '🎵',
    '.m3u': '🎶',
    '.json': '⚙️',
  };

  protected fileIcon(node: TreeNode): string {
    if (node.children.length > 0) return '📁';
    const ext = node.name.substring(node.name.lastIndexOf('.'));
    return this.extensionIcons[ext] ?? '📃';
  }

  protected readonly nodeSet = signal<Set<number>>(new Set<number>());

  protected toggleDisplay(node: TreeNode): void {
    const isFolder = node.children.length > 0;
    if (isFolder) {
      this.nodeSet.update(curr => {
        const temp = new Set(curr);
        temp.has(node.id) ? temp.delete(node.id) :
          temp.add(node.id);
        return temp;
      });
    }

  }
}
