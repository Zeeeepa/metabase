(ns metabase-enterprise.transform-collections.api.transform
  (:require
   [metabase.premium-features.core :refer [defenterprise]]
   [metabase.util.honey-sql-2 :as h2x]))

(defenterprise transforms-collection-filter-clause
  "Clause to filter out transform collections from the collection query on OSS instances, and instances without the
  transform-collections feature flag. EE implementation returns `nil`, so as to not filter out transform collections."
  :feature :transform-collections
  [])

(defenterprise transforms-collection-children-query
  "Collection children query for transforms on EE."
  :feature :transform-collections
  [collection _options]
  {:select [:id :collection_id :name :entity_id [(h2x/literal "transform") :model]]
   :from [[:transform :t]]
   :where [:= :collection_id (:id collection)]})
