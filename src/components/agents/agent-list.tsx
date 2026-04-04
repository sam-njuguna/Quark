"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentComponent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { 
  BotIcon, 
  PlusIcon, 
  TrashIcon, 
  RefreshCwIcon,
  ActivityIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronRightIcon
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description?: string;
  agentType: string;
  isActive: boolean;
  lastSeenAt?: string;
  maxConcurrentTasks: string;
  rateLimit: string;
  createdAt: string;
}

interface AgentStats {
  totalTasks: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
}

export function AgentList({ teamId }: { teamId: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, AgentStats>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newAgent, setNewAgent] = useState({ 
    name: "", 
    description: "", 
    agentType: "ai" as const,
    systemPrompt: "",
    workType: "task",
  });

  useEffect(() => {
    loadAgents();
  }, [teamId]);

  async function loadAgents() {
    try {
      const res = await fetch(`/api/agents?teamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        
        const statsMap: Record<string, AgentStats> = {};
        for (const a of data.agents || []) {
          const sRes = await fetch(`/api/agents/${a.id}/stats`);
          if (sRes.ok) {
            statsMap[a.id] = await sRes.json();
          }
        }
        setStats(statsMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createAgent() {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...newAgent, 
          teamId,
          agentType: "ai",
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewAgent({ name: "", description: "", agentType: "ai", systemPrompt: "", workType: "task" });
        loadAgents();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteAgent(id: string) {
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (res.ok) loadAgents();
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleAgent(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) loadAgents();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading agents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Agents</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="size-4 mr-1" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create AI Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={newAgent.name} 
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="My AI Agent"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input 
                  value={newAgent.description} 
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="What this agent does"
                />
              </div>
              <div>
                <Label>Default Work Type</Label>
                <Select
                  value={newAgent.workType}
                  onValueChange={(v) => setNewAgent({ ...newAgent, workType: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select default work type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Default work type for this agent when processing tasks
                </p>
              </div>
              <div>
                <Label>System Prompt (Rules & Instructions)</Label>
                <Textarea 
                  value={newAgent.systemPrompt} 
                  onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                  placeholder="Define rules and instructions the AI should follow. E.g., 'Always use bullet points, Include code examples, Write in simple language...'"
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These rules will be used as the system prompt for AI executions
                </p>
              </div>
              <Button onClick={createAgent} className="w-full">Create Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BotIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p>No agents configured</p>
            <p className="text-sm">Add an AI agent to automate work</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => {
            const s = stats[agent.id] || { pending: 0, inProgress: 0, completed: 0, failed: 0 };
            return (
              <Card key={agent.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/agents/${agent.id}`}>
                        <BotIcon className="size-5 hover:text-primary transition-colors" />
                      </Link>
                      <Link href={`/dashboard/agents/${agent.id}`}>
                        <CardTitle className="text-base hover:text-primary transition-colors">
                          {agent.name}
                        </CardTitle>
                      </Link>
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleAgent(agent.id, !agent.isActive)}
                      >
                        <RefreshCwIcon className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContentComponent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <p className="text-sm text-muted-foreground">
                            This will permanently delete the agent "{agent.name}" and all associated tasks. This action cannot be undone.
                          </p>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAgent(agent.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContentComponent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="size-4 text-amber-500" />
                      <span>{s.pending} pending</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ActivityIcon className="size-4 text-blue-500" />
                      <span>{s.inProgress} running</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="size-4 text-emerald-500" />
                      <span>{s.completed} done</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircleIcon className="size-4 text-red-500" />
                      <span>{s.failed} failed</span>
                    </div>
                  </div>
                  {agent.lastSeenAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last seen: {new Date(agent.lastSeenAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
