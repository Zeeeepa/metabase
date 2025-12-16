import { getIcon } from "metabase/lib/icon";
import type {
  CollectionItemModel,
} from "metabase-types/api";
import { isObject } from "metabase-types/guards";

import {
  type EntityPickerProps,
  type OmniPickerFolderItem,
  OmniPickerFolderModel,
  type OmniPickerItem,
  type PickerItemFunctions,
} from "./types";

export const getEntityPickerIcon = (
  item: OmniPickerItem,
  isSelected?: boolean,
) => {
  const icon = getIcon(item);

  if (["person", "group"].includes(icon.name)) {
    // should inherit color
    return icon;
  }

  if (isSelected && !icon.color) {
    icon.color = "text-white";
  }

  if (icon.name === "folder" && isSelected) {
    icon.name = "folder_filled";
  }

  return { ...icon, color: undefined, c: icon.color ?? "brand" };
};

export const isSelectedItem = (
  item: OmniPickerItem,
  selectedItem: OmniPickerItem | null,
): boolean => {
  return (
    !!selectedItem &&
    item.id === selectedItem.id &&
    item.model === selectedItem.model
  );
};

const isValidItem = (
  item: unknown,
): item is OmniPickerItem => {
  return isObject(item)
    && "model" in item
    && typeof item.model === "string"
    && !!item.id;
};

export function getItemFunctions({
  models,
  isFolderItem,
  isHiddenItem,
  isDisabledItem,
  isSelectableItem,
}:{
  models: EntityPickerProps["models"]
} & PickerItemFunctions) {
  const modelSet = new Set(models);

  const isFolder = (
    item: OmniPickerItem | unknown,
  ): item is OmniPickerFolderItem => {
    if (!isValidItem(item)) {
      return false;
    }

    if (isFolderItem) {
      return isFolderItem(item);
    }

    if (
      item.model === OmniPickerFolderModel.Database ||
      item.model === OmniPickerFolderModel.Schema
    ) {
      return true;
    }

    if (item.model !== OmniPickerFolderModel.Collection) {
      return false;
    }

    if (!("here" in item) && !("below" in item)) {
      return false;
    }

    const hereBelowSet = Array.from(
      new Set([
        ...("here" in item && Array.isArray(item.here) ? item.here : []),
        ...("below" in item && Array.isArray(item.below) ? item.below : []),
      ]),
    );
    return (
      item.model === OmniPickerFolderModel.Collection &&
      hereBelowSet.some((hereBelowModel) => modelSet.has(hereBelowModel))
    );
  };

  const isSelectable = (item: OmniPickerItem) => {
    if (isSelectableItem && isSelectableItem(item)) {
      return true;
    }

    if (!isValidItem(item)) {
      return false;
    }

    return modelSet.has(item.model);
  }

  const isHidden = (item: OmniPickerItem) => {
    if (!isValidItem(item)) {
      return true;
    }

    if (isHiddenItem) {
      return isHiddenItem(item);
    }

    return (
      !isSelectable(item) &&
      !isFolder(item)
    );
  };

  const isDisabled = (item: OmniPickerItem) => {
    if (isDisabledItem && isDisabledItem(item)) {
      return true;
    }

    return false;
  };

  return {
    isFolderItem: isFolder,
    isHiddenItem: isHidden,
    isDisabledItem: isDisabled,
    isSelectableItem: isSelectable,
  };
}

export const validCollectionModels = new Set<CollectionItemModel>([
  "collection",
  "dashboard",
  "document",
  "card",
  "dataset",
  "metric",
  // "table", FIXME: api should support this
]);

const isValidModel = (model: OmniPickerItem['model']): model is CollectionItemModel =>
  validCollectionModels.has(model as CollectionItemModel);

export const getValidCollectionItemModels = (models: OmniPickerItem['model'][]): CollectionItemModel[] =>
  models
  .filter(isValidModel)
  .concat(["collection"]); // always show folder models, TODO: what about dashboards?
