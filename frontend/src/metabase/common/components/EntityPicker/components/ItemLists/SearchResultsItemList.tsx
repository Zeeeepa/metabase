import { useDebouncedValue } from "@mantine/hooks";
import { useMemo } from "react";

import { useSearchQuery } from "metabase/api";
import { useOmniPickerContext } from "metabase/common/components/EntityPicker/context";

import { SearchResults } from "./SearchResults";

export const SearchResultsItemList = () => {
  const { models, searchQuery, isHiddenItem, searchScope } =
    useOmniPickerContext();

  const { searchCollection, searchModels } = useMemo(() => {
    if (searchScope === "databases") {
      // if we're searching the databases scope, only search for tables
      return {
        searchCollection: undefined,
        searchModels: "table" as const,
      };
    }
    return {
      searchCollection: searchScope || undefined,
      searchModels: models,
    };
  }, [searchScope, models]);

  // FIXME, debouncing object doesn't work
  const [debouncedQuery] = useDebouncedValue({
    q: searchQuery,
    collection: searchCollection === null ? "root" : searchCollection,
    models: searchModels,
  }, 500);

  const {
    data: results,
    error,
    isLoading,
  } = useSearchQuery(
    debouncedQuery,
    { skip: !debouncedQuery.q },
  );

  const filteredResults =
    results?.data.filter((item) => !isHiddenItem?.(item)) || [];

  if (!debouncedQuery) {
    return null;
  }

  return (
    <SearchResults
      searchResults={filteredResults}
      isLoading={isLoading}
      error={error}
      mode="search"
    />
  );
};
