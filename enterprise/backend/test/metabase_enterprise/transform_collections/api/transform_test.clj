(ns metabase-enterprise.transform-collections.api.transform-test
  "Tests for transform collection (folder) functionality."
  (:require
   [clojure.test :refer :all]
   [metabase.collections.models.collection :as collection]
   [metabase.test :as mt]
   [metabase.util :as u]
   [toucan2.core :as t2]))

(def ^:private root-collection
  (assoc collection/root-collection :name "Root Collection" :namespace "transforms"))

(deftest create-transform-with-collection-id-test
  (testing "Creating transforms with collection_id"
    (mt/with-premium-features #{:transforms :transform-collections}
      (mt/with-temp [:model/Collection collection {:name "My Transform Folder" :namespace "transforms"}]
        (testing "Can create a transform in a transform collection"
          (mt/with-temp [:model/Transform transform {:name "Test Transform"
                                                     :collection_id (:id collection)
                                                     :source {:type "query"
                                                              :query {:database (mt/id)
                                                                      :type "native"
                                                                      :native {:query "SELECT 1"}}}
                                                     :target {:type "table"
                                                              :name "test_table"}}]
            (is (= (:id collection) (:collection_id transform)))))

        (testing "Can create a transform without collection_id (root level)"
          (mt/with-temp [:model/Transform transform {:name "Root Transform"
                                                     :source {:type "query"
                                                              :query {:database (mt/id)
                                                                      :type "native"
                                                                      :native {:query "SELECT 1"}}}
                                                     :target {:type "table"
                                                              :name "test_table_2"}}]
            (is (nil? (:collection_id transform)))))))))

(deftest transform-collection-namespace-validation-test
  (testing "Transforms can only be placed in collections with namespace = 'transforms'"
    (mt/with-premium-features #{:transforms :transform-collections}
      (testing "Creating transform in wrong namespace collection throws error"
        (mt/with-temp [:model/Collection snippets-collection {:name "Snippets Folder" :namespace "snippets"}]
          (is (thrown-with-msg?
               clojure.lang.ExceptionInfo
               #"Transform can only go in Collections in the :transforms namespace"
               (t2/insert! :model/Transform {:name "Bad Transform"
                                             :collection_id (:id snippets-collection)
                                             :source {:type "query"
                                                      :query {:database (mt/id)
                                                              :type "native"
                                                              :native {:query "SELECT 1"}}}
                                             :target {:type "table"
                                                      :name "test_table"}})))))

      (testing "Creating transform in normal collection throws error"
        (mt/with-temp [:model/Collection normal-collection {:name "Normal Collection"}]
          (is (thrown-with-msg?
               clojure.lang.ExceptionInfo
               #"Transform can only go in Collections in the :transforms namespace"
               (t2/insert! :model/Transform {:name "Bad Transform"
                                             :collection_id (:id normal-collection)
                                             :source {:type "query"
                                                      :query {:database (mt/id)
                                                              :type "native"
                                                              :native {:query "SELECT 1"}}}
                                             :target {:type "table"
                                                      :name "test_table"}}))))))))

(deftest move-transform-between-collections-test
  (testing "Moving transforms between transform collections"
    (mt/with-premium-features #{:transforms :transform-collections}
      (mt/with-temp [:model/Collection collection-1 {:name "Transform Folder 1" :namespace "transforms"}
                     :model/Collection collection-2 {:name "Transform Folder 2" :namespace "transforms"}
                     :model/Transform transform {:name "Movable Transform"
                                                 :collection_id (:id collection-1)
                                                 :source {:type "query"
                                                          :query {:database (mt/id)
                                                                  :type "native"
                                                                  :native {:query "SELECT 1"}}}
                                                 :target {:type "table"
                                                          :name "test_table"}}]
        (testing "Can move transform to another transform collection"
          (t2/update! :model/Transform (:id transform) {:collection_id (:id collection-2)})
          (is (= (:id collection-2)
                 (t2/select-one-fn :collection_id :model/Transform (:id transform)))))

        (testing "Can move transform to root (nil collection_id)"
          (t2/update! :model/Transform (:id transform) {:collection_id nil})
          (is (nil? (t2/select-one-fn :collection_id :model/Transform (:id transform)))))

        (testing "Cannot move transform to wrong namespace collection"
          (mt/with-temp [:model/Collection snippets-collection {:name "Snippets Folder" :namespace "snippets"}]
            (is (thrown-with-msg?
                 clojure.lang.ExceptionInfo
                 #"Transform can only go in Collections in the :transforms namespace"
                 (t2/update! :model/Transform (:id transform) {:collection_id (:id snippets-collection)})))))))))

(deftest ^:parallel transform-collection-items-test
  (testing "GET /api/collection/:id/items"
    (testing "Transforms should come back when fetching items in a Collection in the :transforms namespace"
      (mt/with-temp [:model/Collection collection {:namespace "transforms" :name "My Transform Collection"}
                     :model/Transform transform {:collection_id (:id collection)
                                                 :name "My Transform"
                                                 :source {:type "query"
                                                          :query {:database (mt/id)
                                                                  :type "native"
                                                                  :native {:query "SELECT 1"}}}
                                                 :target {:type "table"
                                                          :name "test_table"}}]
        (mt/with-premium-features #{:transforms :transform-collections}
          (is (=? [{:id (:id transform)
                    :name "My Transform"
                    :entity_id (:entity_id transform)
                    :model "transform"}]
                  (:data (mt/user-http-request :crowberto :get 200 (format "collection/%d/items" (:id collection))))))

          (testing "\nShould be able to pass ?models=transform to filter"
            (is (=? [{:id (:id transform)
                      :name "My Transform"
                      :entity_id (:entity_id transform)
                      :model "transform"}]
                    (:data (mt/user-http-request :crowberto :get 200
                                                 (format "collection/%d/items?models=transform" (:id collection))))))))))))

(deftest transform-collection-items-nested-test
  (testing "GET /api/collection/:id/items"
    (testing "Transform collections should return nested collections and transforms"
      (mt/with-premium-features #{:transforms :transform-collections}
        (mt/with-temp [:model/Collection collection {:namespace "transforms" :name "Parent Transform Collection"}
                       :model/Collection sub-collection {:namespace "transforms"
                                                         :name "Nested Transform Collection"
                                                         :location (collection/location-path collection)}
                       :model/Transform transform {:collection_id (:id collection)
                                                   :name "Parent Transform"
                                                   :source {:type "query"
                                                            :query {:database (mt/id)
                                                                    :type "native"
                                                                    :native {:query "SELECT 1"}}}
                                                   :target {:type "table"
                                                            :name "test_table_1"}}
                       :model/Transform _nested-transform {:collection_id (:id sub-collection)
                                                           :name "Nested Transform"
                                                           :source {:type "query"
                                                                    :query {:database (mt/id)
                                                                            :type "native"
                                                                            :native {:query "SELECT 2"}}}
                                                           :target {:type "table"
                                                                    :name "test_table_2"}}]
          ;; The parent collection should show the transform and sub-collection, not the nested transform
          (is (=? [{:id (:id sub-collection) :name "Nested Transform Collection"}
                   {:id (:id transform) :name "Parent Transform"}]
                  (:data (mt/user-http-request :crowberto :get 200 (format "collection/%d/items" (:id collection)))))))))))

(deftest root-transform-collection-items-test
  (testing "GET /api/collection/root/items?namespace=transforms"
    (mt/with-premium-features #{:transforms :transform-collections}
      (mt/with-temp [:model/Transform transform {:name "Root Level Transform"
                                                 :collection_id nil
                                                 :source {:type "query"
                                                          :query {:database (mt/id)
                                                                  :type "native"
                                                                  :native {:query "SELECT 1"}}}
                                                 :target {:type "table"
                                                          :name "test_table"}}
                     :model/Collection collection {:namespace "transforms" :name "Transform Folder"}]
        (let [response (:data (mt/user-http-request :crowberto :get 200
                                                    "collection/root/items?namespace=transforms"))]
          (testing "Root transform collection shows transforms without collection_id"
            (is (some #(= (:id transform) (:id %)) response)))
          (testing "Root transform collection shows transform folders"
            (is (some #(= (:id collection) (:id %)) response))))))))

(deftest transform-collections-feature-flag-test
  (testing "Transform collections require :transform-collections feature flag"
    (testing "Without feature flag, transforms still work but collections are not enforced"
      (mt/with-premium-features #{:transforms}
        (mt/with-temp [:model/Collection collection {:name "Transform Folder" :namespace "transforms"}]
          ;; Without the feature flag, the collection namespace check still happens at the model level
          ;; but the collection items query may not return transforms correctly
          (testing "Can still create transforms in transform collections"
            (mt/with-temp [:model/Transform transform {:name "Test Transform"
                                                       :collection_id (:id collection)
                                                       :source {:type "query"
                                                                :query {:database (mt/id)
                                                                        :type "native"
                                                                        :native {:query "SELECT 1"}}}
                                                       :target {:type "table"
                                                                :name "test_table"}}]
              (is (= (:id collection) (:collection_id transform))))))))))

(deftest transform-collection-filter-clause-test
  (testing "Transform collections are filtered from normal collection queries"
    (mt/with-premium-features #{:transform-collections}
      (mt/with-temp [:model/Collection transforms-collection {:name "Transform Folder" :namespace "transforms"}
                     :model/Collection normal-collection {:name "Normal Collection"}]
        (testing "Normal collection list doesn't include transform collections"
          ;; The collection API returns a sequence directly (not {:data [...]})
          (let [response (mt/user-http-request :crowberto :get 200 "collection")]
            (is (not (some #(= (:id transforms-collection) (:id %)) response)))
            (is (some #(= (:id normal-collection) (:id %)) response))))

        (testing "Transform namespace collection list includes transform collections"
          (let [response (mt/user-http-request :crowberto :get 200 "collection?namespace=transforms")]
            (is (some #(= (:id transforms-collection) (:id %)) response))
            (is (not (some #(= (:id normal-collection) (:id %)) response)))))))))
