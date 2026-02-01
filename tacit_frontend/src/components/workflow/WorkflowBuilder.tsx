"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Connection,
    NodeTypes,
    Handle,
    Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { WorkflowStep, WorkflowStepType } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const WORKFLOW_STEP_TYPES: { value: WorkflowStepType; label: string; description: string; color: string; icon: string }[] = [
    { value: 'extract_topics', label: 'Extract Topics', description: 'Extract key topics', color: 'bg-blue-500', icon: '📋' },
    { value: 'summarize', label: 'Summarize', description: 'Create summary', color: 'bg-green-500', icon: '📝' },
    { value: 'extract_quotes', label: 'Extract Quotes', description: 'Extract quotes', color: 'bg-purple-500', icon: '💬' },
    { value: 'generate_action_items', label: 'Action Items', description: 'Generate actions', color: 'bg-orange-500', icon: '✅' },
    { value: 'create_transcript', label: 'Transcript', description: 'Create transcript', color: 'bg-pink-500', icon: '📄' },
    { value: 'format_markdown', label: 'Markdown', description: 'Format as Markdown', color: 'bg-cyan-500', icon: '📝' },
    { value: 'export_pdf', label: 'Export PDF', description: 'Export as PDF', color: 'bg-red-500', icon: '📕' },
    { value: 'export_docx', label: 'Export DOCX', description: 'Export as DOCX', color: 'bg-indigo-500', icon: '📘' },
    { value: 'custom_prompt', label: 'Custom', description: 'Custom prompt', color: 'bg-gray-500', icon: '⚙️' },
];

interface CustomNodeData {
    step: WorkflowStep;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<WorkflowStep>) => void;
}

function CustomNode({ data, selected }: { data: CustomNodeData; selected?: boolean }) {
    const stepType = WORKFLOW_STEP_TYPES.find(t => t.value === data.step.type);
    
    return (
        <div className={`px-4 py-3 shadow-xl rounded-md border-2 min-w-[220px] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm transition-all duration-200 ${
            selected 
                ? 'border-[#22c55e] shadow-[0_0_20px_-5px_rgba(34,197,94,0.6)] scale-105' 
                : 'border-white/10 hover:border-[#22c55e]/40 hover:shadow-2xl'
        }`}>
            <Handle 
                type="target" 
                position={Position.Top} 
                className="!bg-primary !w-3 !h-3 !border-2 !border-background !rounded-full hover:!scale-125 transition-transform" 
            />
            
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-md ${stepType?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <span className="text-white text-lg font-bold">
                            {stepType?.icon || '⚙️'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate mb-0.5">
                            {data.step.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-medium">
                            {stepType?.label || data.step.type}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0 hover:bg-red-500/20 hover:text-red-400 transition-colors rounded-md"
                    onClick={() => data.onDelete(data.step.id)}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
            
            {data.step.description && (
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 line-clamp-2 leading-relaxed">
                    {data.step.description}
                </div>
            )}
            
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className="!bg-primary !w-3 !h-3 !border-2 !border-background !rounded-full hover:!scale-125 transition-transform" 
            />
        </div>
    );
}

function StartNode({ selected }: { selected?: boolean }) {
    return (
        <div className={`w-14 h-14 shadow-xl rounded-md border-2 bg-gradient-to-br from-[#22c55e]/20 via-[#22c55e]/15 to-[#22c55e]/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
            selected 
                ? 'border-[#22c55e] shadow-[0_0_20px_-5px_rgba(34,197,94,0.6)] scale-110' 
                : 'border-[#22c55e]/60 hover:border-[#22c55e] hover:shadow-2xl'
        }`}>
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-[#22c55e] !w-3 !h-3 !border-2 !border-[#09090b] !rounded-full hover:!scale-125 transition-transform"
            />
            <div className="w-8 h-8 rounded-md bg-[#22c55e] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">▶</span>
            </div>
        </div>
    );
}

function EndNode({ selected }: { selected?: boolean }) {
    return (
        <div className={`w-14 h-14 shadow-xl rounded-md border-2 bg-gradient-to-br from-red-500/30 via-red-500/20 to-red-600/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${
            selected 
                ? 'border-red-400 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] scale-110' 
                : 'border-red-500/60 hover:border-red-400 hover:shadow-2xl'
        }`}>
            <Handle 
                type="target" 
                position={Position.Top} 
                className="!bg-red-500 !w-3 !h-3 !border-2 !border-[#09090b] !rounded-full hover:!scale-125 transition-transform" 
            />
            <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">■</span>
            </div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    custom: CustomNode,
    start: StartNode,
    end: EndNode,
};

interface WorkflowBuilderProps {
    steps: WorkflowStep[];
    onStepsChange: (steps: WorkflowStep[]) => void;
}

export function WorkflowBuilder({ steps, onStepsChange }: WorkflowBuilderProps) {
    const START_NODE_ID = 'start-node';
    const END_NODE_ID = 'end-node';
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        // Prevent deleting start/end nodes
        if (nodeId === START_NODE_ID || nodeId === END_NODE_ID) {
            return;
        }
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        onStepsChange(steps.filter(s => s.id !== nodeId).map((s, idx) => ({ ...s, order: idx })));
    }, [steps, onStepsChange, setNodes, setEdges, START_NODE_ID, END_NODE_ID]);

    const handleUpdateNode = useCallback((nodeId: string, updates: Partial<WorkflowStep>) => {
        const updatedSteps = steps.map(s => s.id === nodeId ? { ...s, ...updates } : s);
        onStepsChange(updatedSteps);
        
        // Update node data
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? {
                          ...node,
                          data: {
                              ...node.data,
                              step: { ...node.data.step, ...updates },
                          },
                      }
                    : node
            )
        );
    }, [steps, onStepsChange, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            if (params.source && params.target) {
                setEdges((eds) => addEdge({ 
                    ...params, 
                    type: 'smoothstep', 
                    animated: true, 
                    style: { 
                        stroke: 'rgb(16, 185, 129)', 
                        strokeWidth: 2.5,
                        filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.3))',
                    } 
                }, eds));
                
                // Update step order based on connections
                const sourceIndex = steps.findIndex(s => s.id === params.source);
                const targetIndex = steps.findIndex(s => s.id === params.target);
                
                if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex + 1 !== targetIndex) {
                    // Reorder steps
                    const newSteps = [...steps];
                    const [removed] = newSteps.splice(sourceIndex, 1);
                    newSteps.splice(targetIndex, 0, removed);
                    onStepsChange(newSteps.map((s, idx) => ({ ...s, order: idx })));
                }
            }
        },
        [steps, onStepsChange, setEdges]
    );

    const handleAddStep = useCallback((stepType: WorkflowStepType) => {
        const stepTypeInfo = WORKFLOW_STEP_TYPES.find(t => t.value === stepType);
        const newStep: WorkflowStep = {
            id: `step_${Date.now()}`,
            type: stepType,
            name: stepTypeInfo?.label || 'New Step',
            order: steps.length,
        };
        
        const newSteps = [...steps, newStep];
        onStepsChange(newSteps);
        
        // The useEffect will handle adding the node and edges automatically
    }, [steps, onStepsChange]);

    // Initialize and update nodes/edges when steps change (preserve positions)
    useEffect(() => {
        setNodes((currentNodes) => {
            const currentStepIds = new Set(steps.map(s => s.id));
            const currentNodeIds = new Set(currentNodes.map(n => n.id).filter(id => id !== START_NODE_ID && id !== END_NODE_ID));
            
            // Always ensure start and end nodes exist
            const startNode = currentNodes.find(n => n.id === START_NODE_ID) || {
                id: START_NODE_ID,
                type: 'start' as const,
                position: { x: 400, y: 50 },
                data: {},
            };
            
            const endNode = currentNodes.find(n => n.id === END_NODE_ID) || {
                id: END_NODE_ID,
                type: 'end' as const,
                position: { x: 400, y: 600 },
                data: {},
            };
            
            // Check if we need to add/remove step nodes or if initializing
            const needsUpdate = 
                currentNodes.length === 0 ||
                steps.length !== currentNodeIds.size ||
                steps.some(s => !currentNodeIds.has(s.id)) ||
                currentNodes.some(n => n.id !== START_NODE_ID && n.id !== END_NODE_ID && !currentStepIds.has(n.id));
            
            if (needsUpdate || currentNodes.length === 0) {
                // Rebuild step nodes array preserving positions
                const stepNodes = steps.map((step, index) => {
                    const existingNode = currentNodes.find(n => n.id === step.id);
                    return {
                        id: step.id,
                        type: 'custom' as const,
                        position: existingNode?.position || { x: 400, y: 200 + index * 150 },
                        data: {
                            step,
                            onDelete: handleDeleteNode,
                            onUpdate: handleUpdateNode,
                        },
                    };
                });
                
                return [startNode, ...stepNodes, endNode];
            } else {
                // Just update node data for existing step nodes, keep start/end
                const stepNodes = currentNodes
                    .filter(n => n.id !== START_NODE_ID && n.id !== END_NODE_ID)
                    .map((node) => {
                        const step = steps.find(s => s.id === node.id);
                        return step
                            ? {
                                  ...node,
                                  data: {
                                      ...node.data,
                                      step,
                                  },
                              }
                            : node;
                    });
                
                return [startNode, ...stepNodes, endNode];
            }
        });

        // Update edges - connect start -> first step -> ... -> last step -> end
        const newEdges: Edge[] = [];
        
        // Connect start to first step if steps exist
        if (steps.length > 0) {
            newEdges.push({
                id: `e${START_NODE_ID}-${steps[0].id}`,
                source: START_NODE_ID,
                target: steps[0].id,
                type: 'smoothstep',
                animated: true,
                style: { 
                    stroke: '#22c55e', 
                    strokeWidth: 2.5,
                    filter: 'drop-shadow(0 0 3px rgba(34, 197, 94, 0.5))',
                },
            });
        }
        
        // Connect steps in sequence
        steps.slice(0, -1).forEach((step, index) => {
            newEdges.push({
                id: `e${step.id}-${steps[index + 1].id}`,
                source: step.id,
                target: steps[index + 1].id,
                type: 'smoothstep',
                animated: true,
                style: { 
                    stroke: '#22c55e', 
                    strokeWidth: 2.5,
                    filter: 'drop-shadow(0 0 3px rgba(34, 197, 94, 0.5))',
                },
            });
        });
        
        // Connect last step to end if steps exist
        if (steps.length > 0) {
            newEdges.push({
                id: `e${steps[steps.length - 1].id}-${END_NODE_ID}`,
                source: steps[steps.length - 1].id,
                target: END_NODE_ID,
                type: 'smoothstep',
                animated: true,
                style: { 
                    stroke: 'rgb(239, 68, 68)', 
                    strokeWidth: 2.5,
                    filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.4))',
                },
            });
        }

        setEdges((currentEdges) => {
            const currentIds = new Set(currentEdges.map(e => e.id));
            const newIds = new Set(newEdges.map(e => e.id));
            
            if (currentIds.size !== newIds.size || 
                Array.from(currentIds).some(id => !newIds.has(id))) {
                return newEdges;
            }
            return currentEdges;
        });
    }, [steps, handleDeleteNode, handleUpdateNode, setNodes, setEdges, START_NODE_ID, END_NODE_ID]);

    return (
        <div className="w-full h-full border-0 overflow-hidden bg-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-black"
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { 
                        strokeWidth: 2.5,
                        stroke: '#22c55e',
                    },
                }}
            >
                <Background
                    gap={20} 
                    size={1}
                    color="rgba(255, 255, 255, 0.05)"
                    className="opacity-100"
                />
                <Controls 
                    className="bg-[rgba(255,255,255,0.02)]/90 backdrop-blur-md border border-white/10 shadow-lg rounded-md p-1"
                    showInteractive={false}
                />
                <MiniMap 
                    className="bg-[rgba(255,255,255,0.02)]/90 backdrop-blur-md border border-white/10 shadow-xl rounded-md overflow-hidden"
                    nodeColor={(node) => {
                        if (node.type === 'start') {
                            return '#22c55e'; // green-500
                        }
                        if (node.type === 'end') {
                            return '#ef4444'; // red-500
                        }
                        const nodeData = node.data as CustomNodeData;
                        if (nodeData?.step?.type) {
                            const stepType = WORKFLOW_STEP_TYPES.find(t => t.value === nodeData.step.type);
                            const colorMap: Record<string, string> = {
                                'bg-blue-500': '#3b82f6',
                                'bg-green-500': '#22c55e',
                                'bg-purple-500': '#a855f7',
                                'bg-orange-500': '#f97316',
                                'bg-pink-500': '#ec4899',
                                'bg-cyan-500': '#06b6d4',
                                'bg-red-500': '#ef4444',
                                'bg-indigo-500': '#6366f1',
                                'bg-gray-500': '#6b7280',
                            };
                            return colorMap[stepType?.color || 'bg-gray-500'] || '#6b7280';
                        }
                        return '#6b7280';
                    }}
                    maskColor="rgba(0, 0, 0, 0.6)"
                    pannable
                    zoomable
                />
            </ReactFlow>
        </div>
    );
}

