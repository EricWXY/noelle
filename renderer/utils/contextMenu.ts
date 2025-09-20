import { MENU_IDS } from '@common/constants'

export async function createContextMenu(menuId: MENU_IDS, cb?: (id: string) => void, dynamicLabels?: { label?: string, id: string, [key: string]: any }[]) {
  let result: string = ''
  window.api.contextMenuItemClick(menuId, id => {
    cb?.(id);
    result = id;
  });
  await window.api.showContextMenu(menuId, JSON.stringify(dynamicLabels));
  window.api.removeContextMenuListener(menuId);

  return result;
}
