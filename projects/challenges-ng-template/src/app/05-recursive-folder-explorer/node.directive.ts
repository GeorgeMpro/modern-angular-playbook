import {Directive} from '@angular/core';
import {TreeNode} from './folder-explorer';

interface FolderContext {
  $implicit: TreeNode;
  depth: number;
}

@Directive({
  selector: 'ng-template[folderNode]',
})
export class FolderNode {

  static ngTemplateContextGuard(
    dir: FolderNode,
    ctx: unknown
  ): ctx is FolderContext {
    return true;
  }
}
