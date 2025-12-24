import { t } from "ttag";

import { Loader } from "metabase/ui";
import { useGetWorkspaceGraphQuery } from "metabase-enterprise/api";
import type {
  DependencyEdge,
  DependencyEntry,
  DependencyGraph,
  DependencyNode,
  TableDependencyNode,
  TransformDependencyNode,
  WorkspaceId,
  WorkspaceTransformDependencyNode,
} from "metabase-types/api";

import { DependencyGraph as DependencyGraphComponent } from "../../../../dependencies/components/DependencyGraph/DependencyGraph";

type GraphTabProps = {
  workspaceId: WorkspaceId;
};

export function GraphTab({ workspaceId }: GraphTabProps) {
  const {
    data: graphData,
    isFetching,
    error,
  } = useGetWorkspaceGraphQuery(workspaceId);

  // Create a dummy entry to prevent DependencyGraph from clearing the graph
  // The workspace graph shows the entire workspace without filtering
  const dummyEntry: DependencyEntry = {
    id: workspaceId.toString(), // Convert number to string
    type: "transform", // Using transform as the type since it's a valid dependency type
  };

  if (isFetching) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
      >
        <Loader />
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
      >
        {t`Failed to load dependency graph`}
      </div>
    );
  }

  // Transform workspace graph data to match DependencyGraph format
  const dependencyNodes: DependencyNode[] = graphData.nodes.map((node) => {
    if (node.type === "input-table") {
      // Input tables need special handling - they're not in the standard types
      // We'll treat them as table nodes
      const tableNode: TableDependencyNode = {
        id: node.id, // Use the original ID from the API
        type: "table",
        data: {
          name: (node.data?.name as string) || `Table ${node.id}`,
          display_name:
            (node.data?.display_name as string) ||
            (node.data?.name as string) ||
            `Table ${node.id}`,
          description: node.data?.description || null,
          db_id: (node.data?.db_id as number) || 0,
          schema: (node.data?.schema as string) || "public",
          db: node.data?.db || { name: "Database", id: 0 },
          fields: node.data?.fields || [],
        },
        dependents_count: node.dependents_count,
      };
      return tableNode;
    } else if (node.type === "workspace-transform") {
      // Handle workspace transforms
      const transformNode: WorkspaceTransformDependencyNode = {
        id: node.id, // Use the original ID from the API
        type: "workspace-transform", // Keep the original type
        data: {
          name: (node.data?.name as string) || `Transform ${node.id}`,
          description: node.data?.description || null,
          table: node.data?.table || {
            name: "Output Table",
            display_name: "Output Table",
          },
          workspaceId: workspaceId, // Include workspaceId for URL generation
          ref_id: node.data?.ref_id as string | undefined,
        },
        dependents_count: node.dependents_count,
      };
      return transformNode;
    } else {
      // Handle other node types (transforms, etc.)
      const transformNode: TransformDependencyNode = {
        id: node.id, // Use the original ID from the API
        type: "transform",
        data: {
          name: (node.data?.name as string) || `Transform ${node.id}`,
          description: node.data?.description || null,
          table: node.data?.table || {
            name: "Output Table",
            display_name: "Output Table",
          },
        },
        dependents_count: node.dependents_count,
      };
      return transformNode;
    }
  });

  // Transform edges to match DependencyEdge format
  const dependencyEdges: DependencyEdge[] = graphData.edges.map((edge) => ({
    from_entity_id: edge.from_entity_id, // Use original ID directly
    from_entity_type:
      edge.from_entity_type === "input-table"
        ? "table"
        : (edge.from_entity_type as "transform" | "workspace-transform"),
    to_entity_id: edge.to_entity_id, // Use original ID directly
    to_entity_type:
      edge.to_entity_type === "workspace-transform"
        ? "workspace-transform"
        : (edge.to_entity_type as "table" | "transform"),
  }));

  // Combine into DependencyGraph format
  const dependencyGraph: DependencyGraph = {
    nodes: dependencyNodes,
    edges: dependencyEdges,
  };

  const getGraphUrl = () => `/api/ee/workspace/${workspaceId}/graph`;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <DependencyGraphComponent
        entry={dummyEntry}
        graph={dependencyGraph}
        isFetching={isFetching}
        error={error}
        getGraphUrl={getGraphUrl}
        withEntryPicker={false}
      />
    </div>
  );
}
