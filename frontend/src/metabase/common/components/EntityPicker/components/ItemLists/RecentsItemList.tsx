import { useListRecentsQuery } from "metabase/api";
import { useOmniPickerContext } from "metabase/common/components/EntityPicker/context";

import { SearchResults } from "./SearchResults";

const MAX_RECENTS = 10;

export const RecentsItemList = () => {
  const { isHiddenItem, isDisabledItem } = useOmniPickerContext();

  const { data: results, error, isLoading } = useListRecentsQuery();

  const filteredResults = results?.filter(
    // don't show something you can't pick at all
    (item) => !isHiddenItem(item) || !isDisabledItem(item)
  ).slice(0, MAX_RECENTS) || [];

  return (
    <SearchResults
      searchResults={filteredResults}
      isLoading={isLoading}
      error={error}
      mode="recents"
    />
  );
};
