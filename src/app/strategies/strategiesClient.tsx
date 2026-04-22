"use client";

import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type StrategyListItem = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
};

type StrategyEmail = {
  id: string;
  stepIndex: number;
  dayOffset: number;
  subjectTemplate: string;
  bodyTemplate: string;
};

async function fetchEmails(strategyId: string): Promise<StrategyEmail[]> {
  const res = await fetch(`/api/strategies/${strategyId}/emails`);
  const json = (await res.json()) as { ok: boolean; emails: StrategyEmail[] };
  return json.emails ?? [];
}

export function StrategiesClient({ initialStrategies }: { initialStrategies: StrategyListItem[] }) {
  const [strategies, setStrategies] = useState<StrategyListItem[]>(initialStrategies);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () => strategies.find((s) => s.id === activeId) ?? null,
    [strategies, activeId]
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emails, setEmails] = useState<StrategyEmail[]>([]);

  const [newDayOffset, setNewDayOffset] = useState("0");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  const [saving, setSaving] = useState(false);

  async function openCreate() {
    setActiveId(null);
    setName("");
    setDescription("");
    setEmails([]);
    setOpen(true);
  }

  async function openEdit(id: string) {
    const s = strategies.find((x) => x.id === id);
    if (!s) return;
    setActiveId(id);
    setName(s.name);
    setDescription(s.description ?? "");
    setOpen(true);

    const loaded = await fetchEmails(id);
    setEmails(loaded);
  }

  async function saveStrategy() {
    setSaving(true);
    try {
      if (!name.trim()) return;

      if (!activeId) {
        const res = await fetch("/api/strategies", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, description })
        });
        const json = (await res.json()) as { ok: boolean; id?: string };
        if (!json.ok || !json.id) return;

        const item: StrategyListItem = {
          id: json.id,
          name: name.trim(),
          description: description.trim() || null,
          updatedAt: new Date().toISOString()
        };

        setStrategies((prev) => [item, ...prev]);
        setActiveId(json.id);
        return;
      }

      await fetch(`/api/strategies/${activeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description })
      });

      setStrategies((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                name: name.trim(),
                description: description.trim() || null,
                updatedAt: new Date().toISOString()
              }
            : s
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteStrategy() {
    if (!activeId) return;
    await fetch(`/api/strategies/${activeId}`, { method: "DELETE" });
    setStrategies((prev) => prev.filter((s) => s.id !== activeId));
    setOpen(false);
  }

  async function addEmail() {
    if (!activeId) return;

    const dayOffset = Number.parseInt(newDayOffset, 10);
    if (!Number.isFinite(dayOffset) || dayOffset < 0) return;
    if (!newSubject.trim() || !newBody.trim()) return;

    const res = await fetch(`/api/strategies/${activeId}/emails`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dayOffset,
        subjectTemplate: newSubject,
        bodyTemplate: newBody
      })
    });

    const json = (await res.json()) as { ok: boolean; id?: string; stepIndex?: number };
    if (!json.ok || !json.id || json.stepIndex === undefined) return;
    const createdId = String(json.id);
    const createdStepIndex = Number(json.stepIndex);
    if (!Number.isFinite(createdStepIndex)) return;

    setEmails((prev) => [
      ...prev,
      {
        id: createdId,
        stepIndex: createdStepIndex,
        dayOffset,
        subjectTemplate: newSubject,
        bodyTemplate: newBody
      }
    ]);

    setNewDayOffset(String(dayOffset));
    setNewSubject("");
    setNewBody("");
  }

  async function updateEmail(id: string, patch: Partial<StrategyEmail>) {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    await fetch(`/api/strategy-emails/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
  }

  async function deleteEmail(id: string) {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/strategy-emails/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Strategies</h1>
          <p className="mt-1 text-sm text-slate-600">Define outreach email sequences and cadence.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          New strategy
        </Button>
      </div>

      {strategies.length === 0 ? (
        <div className="text-sm text-slate-600">No strategies yet.</div>
      ) : (
        <div className="grid gap-2">
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => openEdit(s.id)}
              className="text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
            >
              <div className="text-sm font-semibold text-slate-900">{s.name}</div>
              <div className="mt-1 text-sm text-slate-600">{s.description ?? ""}</div>
              <div className="mt-2 text-xs text-slate-500">Updated: {s.updatedAt}</div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeId ? "Edit strategy" : "New strategy"}</DialogTitle>
            <DialogDescription>Strategies are ordered emails with a day offset.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <div className="text-xs text-slate-600">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-slate-600">Description</div>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={saveStrategy} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              {activeId ? (
                <Button variant="danger" type="button" onClick={deleteStrategy}>
                  Delete
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-900">Emails</div>
            {!activeId ? (
              <div className="mt-1 text-sm text-slate-600">Save the strategy to add emails.</div>
            ) : emails.length === 0 ? (
              <div className="mt-1 text-sm text-slate-600">No emails yet.</div>
            ) : (
              <div className="mt-3 grid gap-3">
                {emails
                  .slice()
                  .sort((a, b) => a.stepIndex - b.stepIndex)
                  .map((e) => (
                    <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          Email #{e.stepIndex + 1}
                        </div>
                        <Button variant="danger" type="button" onClick={() => deleteEmail(e.id)}>
                          Delete
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <div>
                          <div className="text-xs text-slate-600">Day offset</div>
                          <Input
                            type="number"
                            value={String(e.dayOffset)}
                            onChange={(ev) =>
                              updateEmail(e.id, {
                                dayOffset: Number.parseInt(ev.target.value, 10)
                              })
                            }
                          />
                        </div>
                        <div>
                          <div className="text-xs text-slate-600">Subject template</div>
                          <Input
                            value={e.subjectTemplate}
                            onChange={(ev) => updateEmail(e.id, { subjectTemplate: ev.target.value })}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-slate-600">Body template</div>
                          <Textarea
                            value={e.bodyTemplate}
                            onChange={(ev) => updateEmail(e.id, { bodyTemplate: ev.target.value })}
                            className="min-h-[120px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeId ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Add email</div>
                <div className="mt-3 grid gap-2">
                  <div>
                    <div className="text-xs text-slate-600">Day offset</div>
                    <Input
                      type="number"
                      value={newDayOffset}
                      onChange={(e) => setNewDayOffset(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Subject template</div>
                    <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Body template</div>
                    <Textarea
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button type="button" onClick={addEmail}>
                    Add
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
