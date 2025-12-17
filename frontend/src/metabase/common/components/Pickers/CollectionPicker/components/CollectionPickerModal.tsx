import { useCallback, useMemo } from "react";
import { t } from "ttag";
import _ from "underscore";

import {
  type EntityType,
  canPlaceEntityInCollection,
  canPlaceEntityInCollectionOrDescendants,
} from "metabase/collections/utils";
import type { RecentItem, SearchResult } from "metabase-types/api";

import {
  EntityPickerModal,
  type EntityPickerModalProps,
  type OmniPickerCollectionItem,
  type OmniPickerItem,
} from "../../../EntityPicker";
import { getNamespaceForItem, isNamespaceRoot } from "../../utils";
import { getCollectionType } from "../types";


const baseCanSelectItem = (
  item: OmniPickerCollectionItem,
): boolean => {
  return (
    !!item &&
    item.can_write !== false &&
    (item.model === "collection" || item.model === "dashboard")
  );
};

const searchFilter = (
  searchResults: SearchResult[],
  entityType?: EntityType,
): SearchResult[] => {
  return searchResults.filter((result) => {
    if (!result.can_write || result.collection.type === "trash") {
      return false;
    }

    if (result.model === "collection" && entityType) {
      return canPlaceEntityInCollection(entityType, result.collection_type);
    }

    return true;
  });
};

const recentItemFilter = (
  recentItems: RecentItem[],
  entityType?: EntityType,
): RecentItem[] => {
  if (!entityType) {
    return recentItems;
  }

  return recentItems.filter((item) => {
    if (item.model === "collection") {
      return canPlaceEntityInCollection(entityType, item.collection_type);
    }
    return true;
  });
};

/**
 * A picker that only picks collections
 */
export const CollectionPickerModal = ({
  title = t`Choose a collection`,
  entityType,
  isDisabledItem: isDisabledItemProp,
  isHiddenItem: isHiddenItemProp,
  isSelectableItem: isSelectableItemProp,
  ...props
}: EntityPickerModalProps & {
  entityType?: EntityType;
}) => {
  const shouldDisableItem = useMemo(() => {
    const entityTypeCheck = entityType
      ? (item: OmniPickerCollectionItem) => {
          if (item.model === "collection") {
            return !canPlaceEntityInCollectionOrDescendants(
              entityType,
              getCollectionType(item),
            );
          }
          return false;
        }
      : undefined;

    if (isDisabledItemProp && entityTypeCheck) {
      return (item: OmniPickerCollectionItem) => {
        return isDisabledItemProp(item) || entityTypeCheck(item);
      };
    }

    return isDisabledItemProp || entityTypeCheck;
  }, [isDisabledItemProp, entityType]);


  // canSelectItem determines if the Confirm button should be enabled
  // Namespace roots can be navigated into but not selected as final destinations
  const canSelectItem = useCallback(
    (
      item: OmniPickerItem,
    ): boolean => {
      if (!baseCanSelectItem(item)) {
        return false;
      }

      if (isSelectableItemProp && !isSelectableItemProp(item)) {
        return false;
      }

      if (entityType && item.model === "collection") {
        const collectionType = getCollectionType(item);
        if (!canPlaceEntityInCollection(entityType, collectionType)) {
          return false;
        }
      }

      // Check if namespace root is disallowed for this entityType
      if (
        entityType &&
        entityType !== "collection" &&
        isNamespaceRoot(item)
      ) {
        return false;
      }

      return true;
    },
    [_canSelectItem, entityType, options.savingModel],
  );

  const shouldHide = useMemo(() => {
    if (isHiddenItemProp) {
      return (item: OmniPickerItem) => {
        return isHiddenItemProp(item) || isNamespaceRoot(item);
      };
    }

    return isNamespaceRoot;
  }, [isHiddenItemProp]);

  const canCreateCollectionInSelected =
    selectedItem?.can_write !== false &&
    (selectedItem?.model !== "collection" ||
      canPlaceEntityInCollection("collection", selectedItem.type));

  // Determine the effective namespace for creating new collections
  // Priority: 1) options.namespace (explicit), 2) selectedItem namespace, 3) undefined
  const effectiveNamespace = useMemo(() => {
    // If explicitly set in options, use that
    if (options.namespace) {
      return options.namespace;
    }

    // Get namespace from the currently selected item
    return getNamespaceForItem(selectedItem);
  }, [options.namespace, selectedItem]);

  return (
    <>
      <EntityPickerModal
        title={title}
        isDisabledItem={shouldDisableItem}
        isSelectableItem={canSelectItem}
        {...props}
        models={["collection"]}
      />
    </>
  );
};
