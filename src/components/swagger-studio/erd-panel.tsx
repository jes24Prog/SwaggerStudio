
"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Loader2, Wand2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, useNodesState, useEdgesState, Handle, Position, type Node, type Edge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as yaml from 'js-yaml';
import { get, set } from 'lodash';
import { useToast } from "@/hooks/use-toast";
import { InputDialog } from "./input-dialog";
import { formatSpec } from "@/lib/swagger-utils";
import { cn } from "@/lib/utils";


const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 200;

function SchemaNode({ data }: { data: { label: string, properties: any, isMissing?: boolean, onExtract: (path: string[], schemaName: string) => void } }) {
  const properties = data.properties || {};

  const handleExtractClick = (propName: string) => {
    // Construct the path for extraction from within the component
    const path = data.label.split('.'); // If label is already a path
    const finalPath = [...path, 'properties', propName];
    data.onExtract(finalPath, `Extracted${data.label}${propName.charAt(0).toUpperCase() + propName.slice(1)}`);
  };

  return (
    <Card className={cn("react-flow__node-schema", data.isMissing ? "border-destructive" : "border-border")}>
       <CardHeader className={cn("p-2 border-b", data.isMissing ? "bg-destructive/10" : "bg-muted")}>
        <CardTitle className={cn("text-base font-semibold", data.isMissing ? "text-destructive" : "text-foreground")}>
          {data.isMissing && '⚠️ '}
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 text-xs">
        {Object.keys(properties).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(properties).map(([propName, propDetails]: [string, any]) => (
              <div key={propName} className="flex justify-between items-center group">
                <div>
                  <span className="font-medium">{propName}</span>
                  <span className="text-muted-foreground ml-2">{propDetails.$ref ? propDetails.$ref.split('/').pop() : (propDetails.type || 'any')}{propDetails.format ? `(${propDetails.format})` : ''}</span>
                </div>
                {propDetails.type === 'object' && propDetails.properties && !propDetails.$ref && (
                   <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => handleExtractClick(propName)} title={`Extract ${propName} to new schema`}>
                     <Wand2 className="h-3 w-3" />
                   </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No properties defined.</p>
        )}
      </CardContent>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </Card>
  );
}

function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }: Edge) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path id={id} style={data.style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
      {data.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 5px',
              background: data.style.stroke || 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: '4px',
              pointerEvents: 'all'
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}


const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    let height = nodeHeight;
    if (node.type === 'schema') {
       const numProperties = node.data.properties ? Object.keys(node.data.properties).length : 1;
       height = 60 + numProperties * 25;
    }
    dagreGraph.setNode(node.id, { width: nodeWidth, height: Math.max(150, height) });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'left';
    node.sourcePosition = 'right';

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - (nodeWithPosition.height / 2),
    };

    return node;
  });

  return { nodes, edges };
};


function LayoutFlow() {
  const { spec, setSpec, parsedSpec, missingSchemas } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { toast } = useToast();
  const [isExtractDialogOpen, setExtractDialogOpen] = useState(false);
  const [extractionArgs, setExtractionArgs] = useState<{ path: string[], initialName: string } | null>(null);

  const handleExtractRequest = useCallback((path: string[], initialName: string) => {
    setExtractionArgs({ path, initialName });
    setExtractDialogOpen(true);
  }, []);

  const handleExtractSchema = async (schemaName: string) => {
    if (!extractionArgs || !schemaName) return;

    try {
        const parsed = yaml.load(spec) as any;
        const schemaContainerPath = parsed.components?.schemas ? 'components.schemas' : 'definitions';
        
        // The path now needs to be relative to the schema container
        const fullPathToProp = [schemaContainerPath, ...extractionArgs.path];
        const objectToExtract = get(parsed, fullPathToProp);
        
        if (!objectToExtract) {
          toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not find object to extract.' });
          return;
        }

        // 1. Define the new schema
        const newSchemaPath = [schemaContainerPath, schemaName];
        set(parsed, newSchemaPath, objectToExtract);

        // 2. Replace the inline object with a $ref
        const refPath = parsed.components?.schemas ? `#/components/schemas/${schemaName}` : `#/definitions/${schemaName}`;
        set(parsed, fullPathToProp, { $ref: refPath });
        
        const newSpec = yaml.dump(parsed);
        const formatted = await formatSpec(newSpec);
        setSpec(formatted);
        toast({ title: 'Schema Extracted', description: `Created "${schemaName}" and updated the reference.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Extraction Failed', description: e.message });
    }
    setExtractionArgs(null);
  };
  
  const nodeTypes = React.useMemo(() => ({ 
    schema: (props: any) => <SchemaNode {...props} data={{...props.data, onExtract: handleExtractRequest }} />
  }), [handleExtractRequest]);

  const edgeTypes = React.useMemo(() => ({ custom: CustomEdge }), []);

  const generateErdData = useCallback((specObj: any, missing: { schema: string }[]): { nodes: Node[], edges: Edge[] } => {
    if (!specObj) return { nodes: [], edges: [] };
    
    const schemas = specObj?.components?.schemas || specObj?.definitions || {};
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const missingSchemaSet = new Set(missing.map(s => s.schema));
    const refPrefixOAS3 = '#/components/schemas/';
    const refPrefixOAS2 = '#/definitions/';

    const getRefName = ($ref: string) => {
      if ($ref.startsWith(refPrefixOAS3)) return $ref.substring(refPrefixOAS3.length);
      if ($ref.startsWith(refPrefixOAS2)) return $ref.substring(refPrefixOAS2.length);
      return null;
    }

    // Add Schema nodes
    Object.keys(schemas).forEach(name => {
      nodes.push({
        id: name,
        type: 'schema',
        position: { x: 0, y: 0 },
        data: { 
          label: name,
          properties: schemas[name]?.properties,
        },
      });
    });

    // Add Missing Schema nodes
    missingSchemaSet.forEach(name => {
      if (!nodes.find(n => n.id === name)) {
        nodes.push({
          id: name,
          type: 'schema',
          position: { x: 0, y: 0 },
          data: { label: name, properties: {}, isMissing: true },
        });
      }
    });
  
    // Connect schemas to other schemas
    const compositionTypes = ['allOf', 'oneOf', 'anyOf'];
    const findSchemaRefs = (obj: any, sourceName: string) => {
      if (!obj || typeof obj !== 'object') return;
  
      if (obj.$ref && typeof obj.$ref === 'string') {
        const targetName = getRefName(obj.$ref);
        if (targetName && !compositionTypes.some(ct => obj[ct])) {
          edges.push({
            id: `e-${sourceName}-${targetName}-${Math.random()}`,
            source: sourceName,
            target: targetName,
            type: 'custom',
            data: { style: { stroke: 'hsl(var(--chart-1))', strokeWidth: 2 }},
            markerEnd: { type: 'arrowclosed', color: 'hsl(var(--chart-1))' },
          });
        }
      }
  
      for (const [key, value] of Object.entries(obj)) {
        if (compositionTypes.includes(key) && Array.isArray(value)) {
            const colors: { [key: string]: string } = {
                allOf: 'hsl(var(--chart-2))', // green
                oneOf: 'hsl(var(--chart-4))', // orange
                anyOf: 'hsl(var(--chart-5))', // purple
            }
            const dashStyles: { [key: string]: string } = {
                allOf: '',
                oneOf: '5,5',
                anyOf: '10,10',
            }

            value.forEach(item => {
                if(item.$ref) {
                    const targetName = getRefName(item.$ref);
                    if (targetName) {
                         edges.push({
                            id: `e-${sourceName}-${targetName}-${key}-${Math.random()}`,
                            source: sourceName,
                            target: targetName,
                            type: 'custom',
                            data: { 
                              label: key,
                              style: { stroke: colors[key], strokeDasharray: dashStyles[key], strokeWidth: 2 }
                            },
                            markerEnd: { type: 'arrowclosed', color: colors[key] },
                        });
                    }
                }
            })
        } else {
             findSchemaRefs(value, sourceName);
        }
      }
    };
  
    Object.keys(schemas).forEach(name => {
      findSchemaRefs(schemas[name], name);
    });
  
    return { nodes, edges };
  }, []);

  useEffect(() => {
    if (!parsedSpec) return;
    const { nodes: initialNodes, edges: initialEdges } = generateErdData(parsedSpec, missingSchemas);
    if (initialNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [parsedSpec, missingSchemas, setNodes, setEdges, generateErdData]);
  
  const handleNodeClick = (_: any, node: Node) => {
    if (typeof (window as any).goToMonacoLine === 'function' && !node.data.isMissing && node.type === 'schema') {
        const path = (parsedSpec as any)?.components?.schemas ? `/components/schemas/${node.id}` : `/definitions/${node.id}`;
        (window as any).goToMonacoLine(path);
    }
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
      >
        <Controls />
        <MiniMap />
        <Background gap={16} size={1} />
      </ReactFlow>
      <InputDialog
        isOpen={isExtractDialogOpen}
        onOpenChange={setExtractDialogOpen}
        title="Extract to New Schema"
        description="Enter a name for the new reusable schema."
        inputLabel="Schema Name"
        initialValue={extractionArgs?.initialName}
        onConfirm={handleExtractSchema}
      />
    </>
  );
}

export function ErdPanel() {
  const { parsedSpec } = useStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasContent = parsedSpec && ((parsedSpec as any).components?.schemas || (parsedSpec as any).definitions);

  if (!isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50 p-8">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">No Schemas to Display</h3>
          <p>Define some schemas in `components/schemas` to see the diagram.</p>
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

    