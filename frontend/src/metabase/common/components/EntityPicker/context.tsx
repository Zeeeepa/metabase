import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { useGetPathFromValue } from "./hooks/use-get-path-from-value";
import type {
  EntityPickerProps,
  OmniPickerContextValue,
  OmniPickerItem,
} from "./types";
import { getItemFunctions } from "./utils";

export const OmniPickerContext = createContext<
  OmniPickerContextValue | undefined
>(undefined);

export const EntityPickerProvider = ({ children, value }: {
  children: React.ReactNode;
  value: EntityPickerProps;
}) => {

  const [path, setPath, { isLoadingPath }] = useGetPathFromValue({
    value: value.value
  });

  const [previousPath, setPreviousPath] = useState<OmniPickerItem[]>([]);
  const [searchScope, setSearchScope] = useState<string>("");

  const {
    isFolderItem,
    isHiddenItem,
    isDisabledItem,
    isSelectableItem,
  } = useMemo(() => getItemFunctions({
    models: value.models,
    isFolderItem: value.isFolderItem,
    isHiddenItem: value.isHiddenItem,
    isDisabledItem: value.isDisabledItem,
    isSelectableItem: value.isSelectableItem,
  }), [value]);

  return (
    <OmniPickerContext.Provider value={{
      ...value,
      path,
      isLoadingPath,
      setPath,
      previousPath,
      setPreviousPath,
      searchScope,
      setSearchScope,
      isFolderItem,
      isHiddenItem,
      isDisabledItem,
      isSelectableItem,
    }}>
      {children}
    </OmniPickerContext.Provider>
  )
}

export const useOmniPickerContext = () => {
  const context = useContext(OmniPickerContext);

  if (!context) {
    throw new Error(
      "useOmniPickerContext must be used within a OmniPickerProvider",
    );
  }
  return context;
};
