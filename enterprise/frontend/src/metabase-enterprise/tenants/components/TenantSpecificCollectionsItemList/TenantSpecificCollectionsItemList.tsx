import { useMemo } from "react";

import { ItemList, type OmniPickerItem } from "metabase/common/components/EntityPicker";
import { useListTenantsQuery } from "metabase-enterprise/api";
import type { Tenant } from "metabase-types/api";

export const TenantSpecificCollectionsItemList = ({ pathIndex }: { pathIndex: number }) => {
  const {
    data: tenantsData,
    error,
    isLoading,
  } = useListTenantsQuery({ status: "active" });

  const tenantCollections = useMemo(
    () => getTenantCollections(tenantsData?.data),
    [tenantsData?.data],
  );

  return (
    <ItemList
      items={tenantCollections}
      error={error}
      isLoading={isLoading}
      pathIndex={pathIndex}
    />
  );
};

const getTenantCollections = (
  tenants?: Tenant[],
): OmniPickerItem[] | undefined =>
  tenants
    ?.filter((tenant) => tenant.tenant_collection_id != null)
    .map(
      (tenant): OmniPickerItem => ({
        id: tenant.tenant_collection_id!,
        name: tenant.name,
        here: ["collection"], // tenant collections can contain collections
        model: "collection",
        location: "/",
        can_write: true,
        type: "tenant-specific-root-collection",
        collection_id: "tenant-specific",
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name)) ?? undefined;
