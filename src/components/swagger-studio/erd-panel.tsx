
"use client";

import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, useNodesState, useEdgesState, Handle, Position, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 200;

function SchemaNode({ data }: { data: { label: string, properties: any, isMissing?: boolean } }) {
  const properties = data.properties || {};
  return (
    <Card className={data.isMissing ? "border-red-500" : ""}>
      <CardHeader className="p-2 border-b">
        <CardTitle className={data.isMissing ? "text-red-500 text-base" : "text-base"}>
          {data.isMissing && '⚠️ '}
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 text-xs">
        {Object.keys(properties).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(properties).map(([propName, propDetails]: [string, any]) => (
              <div key={propName} className="flex justify-between items-center">
                <span>{propName}</span>
                <span className="text-muted-foreground">{propDetails.$ref ? propDetails.$ref.split('/').pop() : (propDetails.type || 'any')}{propDetails.format ? `(${propDetails.format})` : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No properties defined.</p>
        )}
      </CardContent>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </Card>
  );
}

const nodeTypes = { schema: SchemaNode };


const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
     // Estimate node height based on properties
    const numProperties = node.data.properties ? Object.keys(node.data.properties).length : 1;
    const estimatedHeight = 60 + numProperties * 20;
    dagreGraph.setNode(node.id, { width: nodeWidth, height: Math.max(nodeHeight, estimatedHeight) });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top';
    node.sourcePosition = 'bottom';

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - (nodeWithPosition.height / 2),
    };

    return node;
  });

  return { nodes, edges };
};

function generateErdData(spec: any, missingSchemas: { schema: string }[]): { nodes: Node[], edges: Edge[] } {
  const schemas = spec?.components?.schemas || spec?.definitions;
  if (!schemas) {
    return { nodes: [], edges: [] };
  }

  const missingSchemaSet = new Set(missingSchemas.map(s => s.schema));

  const nodes: Node[] = Object.keys(schemas).map(name => ({
    id: name,
    type: 'schema',
    position: { x: 0, y: 0 },
    data: { 
      label: name,
      properties: schemas[name]?.properties
    },
     style: {
      width: nodeWidth,
      padding: 0,
    }
  }));

  missingSchemaSet.forEach(name => {
    if (!nodes.find(n => n.id === name)) {
      nodes.push({
        id: name,
        type: 'schema',
        position: { x: 0, y: 0 },
        data: { 
          label: name,
          properties: {},
          isMissing: true,
        },
        style: {
          width: nodeWidth,
          padding: 0,
        }
      })
    }
  })

  const edges: Edge[] = [];
  const refPrefixOAS3 = '#/components/schemas/';
  const refPrefixOAS2 = '#/definitions/';

  const findRefs = (obj: any, sourceName: string) => {
    if (!obj || typeof obj !== 'object') return;

    if (obj.$ref && typeof obj.$ref === 'string') {
       let targetName: string | null = null;
      if (obj.$ref.startsWith(refPrefixOAS3)) {
        targetName = obj.$ref.substring(refPrefixOAS3.length);
      } else if (obj.$ref.startsWith(refPrefixOAS2)) {
         targetName = obj.$ref.substring(refPrefixOAS2.length);
      }
      
      if (targetName) {
        edges.push({
          id: `e-${sourceName}-${targetName}-${Math.random()}`,
          source: sourceName,
          target: targetName,
          animated: true,
        });
      }
    }

    for (const value of Object.values(obj)) {
      findRefs(value, sourceName);
    }
  };

  Object.keys(schemas).forEach(name => {
    findRefs(schemas[name], name);
  });

  return { nodes, edges };
}

function LayoutFlow() {
  const { parsedSpec, missingSchemas } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!parsedSpec) return;
    const { nodes: initialNodes, edges: initialEdges } = generateErdData(parsedSpec, missingSchemas);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [parsedSpec, missingSchemas, setNodes, setEdges]);
  
  const handleNodeClick = (_: any, node: Node) => {
    if (typeof (window as any).goToMonacoLine === 'function' && !node.data.isMissing) {
      const path = (parsedSpec as any)?.components?.schemas ? `/components/schemas/${node.id}` : `/definitions/${node.id}`;
      (window as any).goToMonacoLine(path);
    }
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      nodeTypes={nodeTypes}
    >
      <Controls />
      <MiniMap />
      <Background gap={12} size={1} />
    </ReactFlow>
  );
}

export function ErdPanel() {
  const { parsedSpec } = useStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasSchemas = parsedSpec && ((parsedSpec as any).components?.schemas || (parsedSpec as any).definitions);

  if (!isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSchemas) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50 p-8">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">No Schemas Found</h3>
          <p>Define some schemas under `components/schemas` or `definitions` to see the diagram.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
       <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
    </div>
  );
}
