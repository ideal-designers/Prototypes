import { TreeNode } from '../../../../shared/ds';
import { FOLDER_ROLLUPS, MOCK_DATA_ROOM, MOCK_PROJECT_MARK } from '../../data/mock-data';
import { DOC_FILE_ICON } from '../../models/mock-doc.model';

/** Id of the project row — pass it as fvdr-tree's [selectedId] to tint it. */
export const PROJECT_NODE_ID = 'project';

/**
 * The project tree every Documents-family pane shows: the branded project row
 * (expanded) over the room's top-level folders, each holding its documents.
 *
 * Built from the shared corpus in `data/mock-data.ts`, so the tree behind the
 * assistant lists exactly what the assistant cites.
 *
 * Returns a fresh array per call — `fvdr-tree` writes node state back.
 */
export function projectTree(): TreeNode[] {
  return [
    {
      id: PROJECT_NODE_ID,
      label: MOCK_DATA_ROOM.name,
      mark: MOCK_PROJECT_MARK,
      expanded: true,
      children: FOLDER_ROLLUPS.map(rollup => ({
        id: rollup.folder.id,
        label: rollup.folder.name,
        fileType: 'folder-colored' as const,
        children: rollup.documents.map(doc => ({
          id: doc.id,
          label: doc.name,
          fileType: DOC_FILE_ICON[doc.type],
        })),
      })),
    },
  ];
}
