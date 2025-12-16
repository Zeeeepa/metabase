import type { Dispatch, SetStateAction } from "react";

import type {
  CollectionId,
  CollectionItem,
  DatabaseId,
  NativeQuerySnippet,
  SchemaName,
  TableId,
} from "metabase-types/api";

export type EntityPickerOptions = {
  // options to show/hide root items
  hasSearch?: boolean;
  hasRecents?: boolean;
  hasDatabases?: boolean;
  hasLibrary?: boolean;
  hasRootCollection?: boolean;
  hasPersonalCollection?: boolean;
  hasPersonalCollections?: boolean; // other users personal collections

  // options to customize the button bar
  hasConfirmButtons?: boolean;
  canCreateCollections?: boolean;
  actionButtons?: React.ReactNode[] | React.ReactNode;
  confirmButtonText?: React.ReactNode;
  cancelButtonText?: React.ReactNode;
};

export type PickerItemFunctions = {
  isFolderItem: (item: OmniPickerItem) => item is OmniPickerFolderItem;
  isHiddenItem: (item: OmniPickerItem) => boolean;
  isDisabledItem: (item: OmniPickerItem) => boolean;
  isSelectableItem: (item: OmniPickerItem) => boolean;
}

export type EntityPickerProps = {
  onChange: (value: OmniPickerItem) => void;
  onClose: () => void;
  models: OmniPickerItem["model"][];
  options: EntityPickerOptions;
  value?: OmniPickerValue;
  searchQuery?: string;
} & PickerItemFunctions;


export type OmniPickerContextValue = {
  path: OmniPickerItem[];
  setPath: Dispatch<SetStateAction<OmniPickerItem[]>>;
  isLoadingPath: boolean;
  previousPath: OmniPickerItem[];
  setPreviousPath: Dispatch<SetStateAction<OmniPickerItem[]>>;
  searchScope: string;
  setSearchScope: Dispatch<SetStateAction<string>>;
} & EntityPickerProps;

export type OmniPickerCollectionItem = Pick<
  CollectionItem,
  "name" | "model" | "here" | "below" | "moderated_status" | "display" | "can_write" | "location" | "collection" | "type" | "namespace"
> & {
  id: CollectionItem["id"] | CollectionId;
};

export type OmniPickerDashboardItem = {
  model: "dashboard";
  id: CollectionItem["id"] | CollectionId;
  name: string;
  here?: CollectionItem["here"];
  below?: CollectionItem["below"];
};

export type OmniPickerPickableItem<PickableModels extends CollectionItem["model"]> = OmniPickerItem & {
  model: PickableModels;
};

export type OmniPickerSchemaItem = {
  model: "schema";
  id: SchemaName;
  db_id: DatabaseId;
  name: SchemaName;
};

export type OmniPickerTableItem = {
  model: "table";
  id: TableId;
  db_id: DatabaseId;
  name: string;
};

export type OmniPickerDatabaseItem = {
  model: "database";
  id: DatabaseId;
  name: string;
};

export type OmniPickerSnippetItem = Pick<NativeQuerySnippet, "id" | "name"> & {
  model: "snippet";
};

export enum OmniPickerFolderModel {
  Database = "database",
  Schema = "schema",
  Collection = "collection",
  Dashboard = "dashboard",
}

export type DbTreeItem = OmniPickerDatabaseItem | OmniPickerSchemaItem | OmniPickerTableItem;

export const isInDbTree = (
  item: OmniPickerItem,
): item is DbTreeItem => {
  return (
    item.model === "database" ||
    item.model === "schema" ||
    item.model === "table"
  );
};

// this includes all possible item types that can be shown in the mini picker
export type OmniPickerItem =
  | OmniPickerCollectionItem
  | OmniPickerSchemaItem
  | OmniPickerTableItem
  | OmniPickerDatabaseItem;

export type OmniPickerDbValue = Pick<DbTreeItem, "model" | "id">;
export type OmniPickerTableValue = Pick<OmniPickerTableItem, "model" | "id">;
export type OmniPickerCollectionItemValue = Pick<OmniPickerCollectionItem, "model" | "id">;

export type OmniPickerValue = OmniPickerDbValue | OmniPickerCollectionItemValue;

// this is only the intermediate/folder types that cannot ultimately be picked
export type OmniPickerFolderItem =
  | OmniPickerDatabaseItem
  | OmniPickerSchemaItem
  | OmniPickerDashboardItem
  | OmniPickerCollectionItem & { model: "collection" };

// can't get schemas in search results
export type SearchableOmniPickerItem =
  | OmniPickerCollectionItem
  | OmniPickerTableItem
  | OmniPickerDatabaseItem;
