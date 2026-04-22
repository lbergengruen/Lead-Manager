"use client";

import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Mail, Receipt, RotateCw } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type CompanyStage = "dead-lead" | "contacted" | "evaluating-proposal" | "trial-30-day" | "client";

export type CompanyContact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
};

export type CompanyLineContract = {
  id: string;
  startDate: string;
  endDate: string;
  pricePerMonthCents: number;
};

export type CompanyLine = {
  id: string;
  name: string;
  isInvoiced: boolean;
  contracts: CompanyLineContract[];
};

export type CompanyCard = {
  id: string;
  name: string;
  notes: string | null;
  stage: CompanyStage;
  commissionPercentage: number;
  nextOutreachDueAt: string | null;
  hasDueOutreach: boolean;
  hasDueReminder: boolean;
  hasDueRenewal: boolean;
  strategyAssigned: { id: string; name: string } | null;
  contacts: CompanyContact[];
  lines: CompanyLine[];
};

export type StrategyOption = { id: string; name: string };

const STAGES: { id: CompanyStage; title: string }[] = [
  { id: "dead-lead", title: "Dead Leads" },
  { id: "contacted", title: "Contacted" },
  { id: "evaluating-proposal", title: "Evaluating Proposal" },
  { id: "trial-30-day", title: "30 day Trial" },
  { id: "client", title: "Client" }
];

function eurosToCents(raw: string) {
  const normalized = String(raw).trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function formatEURFromCents(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function StageColumn({
  stage,
  title,
  children
}: {
  stage: CompanyStage;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={
        "rounded-xl border border-slate-200 bg-slate-50/60 p-3 min-h-[220px] " +
        (isOver ? "ring-2 ring-slate-300" : "")
      }
    >
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function DraggableCard({ company, onClick }: { company: CompanyCard; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: company.id });

  const hasMissingInvoice = company.lines.some((l) => !l.isInvoiced);
  const lineCount = company.lines.length;
  const totalMonthlyCents = company.lines.reduce(
    (sum, l) => sum + l.contracts.reduce((cSum, c) => cSum + c.pricePerMonthCents, 0),
    0
  );
  const commissionCents = Math.round((totalMonthlyCents * company.commissionPercentage) / 100);

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : {};

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={
        "w-full text-left rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50 transition-colors " +
        (isDragging ? "opacity-60" : "")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{company.name}</div>
          <div className="mt-1 text-xs text-slate-600">
            {lineCount} {lineCount === 1 ? "line" : "lines"} · {formatEURFromCents(totalMonthlyCents)}/mo
          </div>
          {company.commissionPercentage > 0 ? (
            <div className="mt-0.5 text-xs font-medium text-green-700">
              {company.commissionPercentage}% commission · {formatEURFromCents(commissionCents)}/mo
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          {company.hasDueOutreach ? <Mail className="h-4 w-4" /> : null}
          {company.hasDueReminder ? <Bell className="h-4 w-4" /> : null}
          {company.hasDueRenewal ? <RotateCw className="h-4 w-4" /> : null}
          {hasMissingInvoice ? <Receipt className="h-4 w-4" /> : null}
        </div>
      </div>
    </button>
  );
}

function toDateTimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${min}`;
}

type TransitionState = {
  open: boolean;
  companyId: string;
  fromStage: CompanyStage;
  toStage: CompanyStage;
  requiresClientLine: boolean;
};

function TransitionWizard({
  transition,
  onCancel,
  onConfirm,
  strategies
}: {
  transition: TransitionState | null;
  onCancel: () => void;
  onConfirm: (payload: {
    strategyId?: string;
    occurredAt?: string;
    proposalDate?: string;
    trialStartDate?: string;
    clientLine?: {
      name: string;
      contractStartDate: string;
      contractEndDate: string;
      pricePerMonthCents: number;
    };
  }) => void;
  strategies: StrategyOption[];
}) {
  const isOpen = Boolean(transition?.open);
  const now = new Date();

  const [occurredAt, setOccurredAt] = useState(toDateTimeLocalValue(now));
  const [strategyId, setStrategyId] = useState("");
  const [proposalDate, setProposalDate] = useState(toDateTimeLocalValue(now));
  const [trialStartDate, setTrialStartDate] = useState(toDateTimeLocalValue(now));

  const [lineName, setLineName] = useState("");
  const [contractStartDate, setContractStartDate] = useState(toDateTimeLocalValue(now));
  const [contractEndDate, setContractEndDate] = useState(toDateTimeLocalValue(now));
  const [pricePerMonth, setPricePerMonth] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const n = new Date();
    setOccurredAt(toDateTimeLocalValue(n));
    setStrategyId("");
    setProposalDate(toDateTimeLocalValue(n));
    setTrialStartDate(toDateTimeLocalValue(n));

    setLineName("");
    setContractStartDate(toDateTimeLocalValue(n));
    setContractEndDate(toDateTimeLocalValue(n));
    setPricePerMonth("");
  }, [isOpen]);

  const toStage = transition?.toStage ?? "dead-lead";
  const fromStage = transition?.fromStage ?? "dead-lead";

  const needsStrategy = toStage === "contacted";
  const needsProposalDate = toStage === "evaluating-proposal";
  const needsTrialStart = toStage === "trial-30-day";
  const needsClientLine = toStage === "client" && Boolean(transition?.requiresClientLine);

  const pricePerMonthCents = eurosToCents(pricePerMonth);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? null : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move card</DialogTitle>
          <DialogDescription>
            {fromStage} → {toStage}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <div className="text-xs text-slate-600">Occurred at</div>
            <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>

          {needsStrategy ? (
            <div>
              <div className="text-xs text-slate-600">Strategy</div>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a strategy</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {needsProposalDate ? (
            <div>
              <div className="text-xs text-slate-600">Proposal date</div>
              <Input type="datetime-local" value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} />
            </div>
          ) : null}

          {needsTrialStart ? (
            <div>
              <div className="text-xs text-slate-600">Trial start date</div>
              <Input type="datetime-local" value={trialStartDate} onChange={(e) => setTrialStartDate(e.target.value)} />
            </div>
          ) : null}

          {toStage === "client" ? (
            <div className="grid gap-2">
              <div className="text-xs text-slate-600">Client lines</div>
              {needsClientLine ? (
                <div className="text-sm text-slate-600">Add at least one line to become a client.</div>
              ) : (
                <div className="text-sm text-slate-600">Optionally add a new line.</div>
              )}

              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ gridColumn: "1 / span 2" }}>
                  <div className="text-xs text-slate-600">Line name</div>
                  <Input value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="Product / line" />
                </div>
                <div>
                  <div className="text-xs text-slate-600">Contract start</div>
                  <Input
                    type="datetime-local"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600">Contract end</div>
                  <Input
                    type="datetime-local"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: "1 / span 2" }}>
                  <div className="text-xs text-slate-600">Monthly price (€)</div>
                  <Input
                    inputMode="decimal"
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(e.target.value)}
                    placeholder="e.g. 499.99"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              onConfirm({
                occurredAt,
                ...(needsStrategy ? { strategyId } : {}),
                ...(needsProposalDate ? { proposalDate } : {}),
                ...(needsTrialStart ? { trialStartDate } : {}),
                ...(toStage === "client" && lineName
                  ? {
                      clientLine: {
                        name: lineName,
                        contractStartDate,
                        contractEndDate,
                        pricePerMonthCents: pricePerMonthCents ?? 0
                      }
                    }
                  : {})
              })
            }
            disabled={
              (needsStrategy && !strategyId) ||
              !occurredAt ||
              (needsClientLine &&
                (!lineName ||
                  !contractStartDate ||
                  !contractEndDate ||
                  !pricePerMonth ||
                  pricePerMonthCents === null ||
                  pricePerMonthCents <= 0))
            }
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompanyModal({
  company,
  open,
  onOpenChange,
  onCompanyPatch,
  onCompanyDelete,
  isEditing,
  onIsEditingChange
}: {
  company: CompanyCard;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompanyPatch: (companyId: string, patch: Partial<CompanyCard>) => void;
  onCompanyDelete: (companyId: string) => void;
  isEditing: boolean;
  onIsEditingChange: (v: boolean) => void;
}) {

  const lastCompanyIdRef = useRef<string | null>(null);

  const [name, setName] = useState(company.name);
  const [notes, setNotes] = useState(company.notes ?? "");
  const [commissionPercentage, setCommissionPercentage] = useState(String(company.commissionPercentage));
  const [savingCompany, setSavingCompany] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);

  const [contacts, setContacts] = useState<CompanyContact[]>(company.contacts);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRole, setNewContactRole] = useState("");
  const [creatingContact, setCreatingContact] = useState(false);

  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachSubject, setOutreachSubject] = useState<string | null>(null);
  const [outreachBody, setOutreachBody] = useState<string | null>(null);
  const [outreachDueAt, setOutreachDueAt] = useState<string | null>(company.nextOutreachDueAt);
  const [outreachAcknowledgedAt, setOutreachAcknowledgedAt] = useState(toDateTimeLocalValue(new Date()));

  const [lines, setLines] = useState<CompanyLine[]>(company.lines);
  const [creatingLine, setCreatingLine] = useState(false);
  const [newLineName, setNewLineName] = useState("");
  const [newContractStartDate, setNewContractStartDate] = useState(toDateTimeLocalValue(new Date()));
  const [newContractEndDate, setNewContractEndDate] = useState(toDateTimeLocalValue(new Date()));
  const [newPricePerMonth, setNewPricePerMonth] = useState("");

  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editingContractStart, setEditingContractStart] = useState("");
  const [editingContractEnd, setEditingContractEnd] = useState("");
  const [editingContractPrice, setEditingContractPrice] = useState("");
  const [savingContract, setSavingContract] = useState(false);

  const companyId = company.id;
  const companyName = company.name;
  const companyNotes = company.notes;
  const companyCommissionPercentage = company.commissionPercentage;
  const companyContacts = company.contacts;
  const companyNextOutreachDueAt = company.nextOutreachDueAt;
  const companyStrategyId = company.strategyAssigned?.id;
  const companyLinesArr = company.lines;

  useEffect(() => {
    // sync modal state when switching companies (but don't reset edit mode on incremental updates)
    const switchingCompany = lastCompanyIdRef.current !== null && lastCompanyIdRef.current !== companyId;
    lastCompanyIdRef.current = companyId;
    if (switchingCompany) {
      onIsEditingChange(false);
      setName(companyName);
      setNotes(companyNotes ?? "");
      setCommissionPercentage(String(companyCommissionPercentage));
      setContacts(companyContacts);
      setOutreachDueAt(companyNextOutreachDueAt);
      setOutreachSubject(null);
      setOutreachBody(null);
      setOutreachAcknowledgedAt(toDateTimeLocalValue(new Date()));
      setLines(companyLinesArr);
      return;
    }

    if (!open) return;

    // If we're not editing, keep modal state in sync with external updates.
    if (!isEditing) {
      setName(companyName);
      setNotes(companyNotes ?? "");
      setCommissionPercentage(String(companyCommissionPercentage));
      setContacts(companyContacts);
      setOutreachDueAt(companyNextOutreachDueAt);
      setLines(companyLinesArr);
    }
  }, [
    companyId,
    companyName,
    companyNotes,
    companyCommissionPercentage,
    companyContacts,
    companyNextOutreachDueAt,
    companyLinesArr,
    open,
    isEditing,
    onIsEditingChange
  ]);

  useEffect(() => {
    if (!open) return;
    if (!companyStrategyId) return;

    setOutreachLoading(true);
    fetch(`/api/companies/${companyId}/outreach`)
      .then((r) => r.json())
      .then((json: any) => {
        setOutreachSubject(json?.email?.subjectTemplate ?? null);
        setOutreachBody(json?.email?.bodyTemplate ?? null);
        setOutreachDueAt(json?.assignment?.nextOutreachDueAt ?? companyNextOutreachDueAt);
      })
      .finally(() => setOutreachLoading(false));
  }, [open, companyId, companyStrategyId, companyNextOutreachDueAt]);

  async function saveCompany() {
    const commissionPct = Math.trunc(Number(commissionPercentage));
    if (Number.isNaN(commissionPct) || commissionPct < 0 || commissionPct > 100) {
      window.alert("Commission must be between 0 and 100");
      return;
    }

    setSavingCompany(true);
    try {
      await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, notes, commissionPercentage: commissionPct })
      });

      onCompanyPatch(company.id, { name, notes, commissionPercentage: commissionPct });
    } finally {
      setSavingCompany(false);
    }
  }

  async function deleteCompany() {
    const ok = window.confirm(`Delete "${company.name}"? This cannot be undone.`);
    if (!ok) return;

    setDeletingCompany(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      if (!res.ok) return;

      onCompanyDelete(company.id);
      onOpenChange(false);
    } finally {
      setDeletingCompany(false);
    }
  }

  async function createContact() {
    setCreatingContact(true);
    try {
      const res = await fetch(`/api/companies/${company.id}/contacts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newContactName || null,
          email: newContactEmail || null,
          phone: newContactPhone || null,
          role: newContactRole || null,
          isPrimary: contacts.length === 0
        })
      });

      const json = (await res.json()) as { ok: boolean; id?: string };
      if (!json.ok || !json.id) return;
      const createdId = String(json.id);

      setContacts((prev) => [
        ...prev,
        {
          id: createdId,
          name: newContactName || null,
          email: newContactEmail || null,
          phone: newContactPhone || null,
          role: newContactRole || null,
          isPrimary: prev.length === 0
        }
      ]);

      setNewContactName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setNewContactRole("");
    } finally {
      setCreatingContact(false);
    }
  }

  async function updateContact(id: string, patch: Partial<CompanyContact>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
  }

  async function deleteContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
  }

  async function updateLine(id: string, patch: Partial<CompanyLine>) {
    setLines((prev) => {
      const nextLines = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
      onCompanyPatch(company.id, { lines: nextLines });
      return nextLines;
    });

    await fetch(`/api/lines/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
  }

  async function deleteLine(id: string) {
    const ok = window.confirm("Delete this line?");
    if (!ok) return;

    setLines((prev) => {
      const nextLines = prev.filter((l) => l.id !== id);
      onCompanyPatch(company.id, { lines: nextLines });
      return nextLines;
    });

    await fetch(`/api/lines/${id}`, { method: "DELETE" });
  }

  async function saveContract(contractId: string) {
    const pricePerMonthCents = eurosToCents(editingContractPrice);
    if (pricePerMonthCents === null || pricePerMonthCents <= 0) return;

    setSavingContract(true);
    try {
      const res = await fetch(`/api/line-contracts/${contractId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contractStartDate: editingContractStart,
          contractEndDate: editingContractEnd,
          pricePerMonthCents
        })
      });

      if (!res.ok) return;

      setLines((prev) => {
        const nextLines = prev.map((l) => ({
          ...l,
          contracts: l.contracts.map((c) =>
            c.id === contractId
              ? {
                  ...c,
                  startDate: new Date(editingContractStart).toISOString(),
                  endDate: new Date(editingContractEnd).toISOString(),
                  pricePerMonthCents
                }
              : c
          )
        }));
        onCompanyPatch(company.id, { lines: nextLines });
        return nextLines;
      });

      setEditingContractId(null);
    } finally {
      setSavingContract(false);
    }
  }

  const dueOutreach = outreachDueAt ? new Date(outreachDueAt) <= new Date() : false;

  async function acknowledgeOutreach() {
    const ack = new Date(outreachAcknowledgedAt);
    const res = await fetch(`/api/companies/${company.id}/outreach/ack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acknowledgedAt: ack.toISOString() })
    });

    const json = (await res.json()) as { ok?: boolean; nextOutreachDueAt?: string | null };
    if (!json.ok) return;

    const next = json.nextOutreachDueAt ?? null;
    setOutreachDueAt(next);
    onCompanyPatch(company.id, {
      nextOutreachDueAt: next,
      hasDueOutreach: next ? new Date(next) <= new Date() : false
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>{company.stage}</DialogDescription>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    onIsEditingChange(false);
                    setName(companyName);
                    setNotes(companyNotes ?? "");
                    setCommissionPercentage(String(companyCommissionPercentage));
                    setContacts(companyContacts);
                    setLines(companyLinesArr);
                  }}
                >
                  Cancel
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => onIsEditingChange(true)}>
                  Edit
                </Button>
              )}
              <Button variant="danger" type="button" onClick={deleteCompany} disabled={deletingCompany}>
                {deletingCompany ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Company</div>
            <div className="mt-2 grid gap-2">
              <div>
                <div className="text-xs text-slate-600">Name</div>
                <Input value={name} readOnly={!isEditing} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-600">Notes</div>
                <Textarea
                  value={notes}
                  readOnly={!isEditing}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[90px]"
                />
              </div>
              <div>
                <div className="text-xs text-slate-600">Commission (%)</div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPercentage}
                  readOnly={!isEditing}
                  onChange={(e) => setCommissionPercentage(e.target.value)}
                  placeholder="0-100"
                />
              </div>
              {isEditing ? (
                <div>
                  <Button type="button" onClick={saveCompany} disabled={savingCompany}>
                    {savingCompany ? "Saving…" : "Save"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Outreach</div>
            {!company.strategyAssigned ? (
              <div className="mt-1 text-sm text-slate-600">No strategy assigned.</div>
            ) : outreachLoading ? (
              <div className="mt-1 text-sm text-slate-600">Loading…</div>
            ) : (
              <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-600">
                  Strategy: {company.strategyAssigned.name}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Next due: {outreachDueAt ?? ""}{dueOutreach ? " (due)" : ""}
                </div>
                {outreachSubject || outreachBody ? (
                  <div className="mt-3 grid gap-2">
                    <div>
                      <div className="text-xs text-slate-600">Subject</div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 whitespace-pre-wrap">
                        {outreachSubject ?? ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Body</div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 whitespace-pre-wrap">
                        {outreachBody ?? ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={outreachAcknowledgedAt}
                        onChange={(e) => setOutreachAcknowledgedAt(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const text = `Subject: ${outreachSubject ?? ""}\n\n${outreachBody ?? ""}`;
                          navigator.clipboard.writeText(text);
                        }}
                      >
                        Copy
                      </Button>
                      <Button type="button" onClick={acknowledgeOutreach} disabled={!dueOutreach}>
                        Mark re-contacted
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">Contacts</div>
            {contacts.length === 0 ? (
              <div className="mt-1 text-sm text-slate-600">No contacts yet.</div>
            ) : (
              <div className="mt-2 grid gap-2">
                {contacts.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="grid gap-2">
                      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div>
                          <div className="text-xs text-slate-600">Name</div>
                          <Input
                            value={c.name ?? ""}
                            readOnly={!isEditing}
                            onChange={(e) => updateContact(c.id, { name: e.target.value || null })}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-slate-600">Role</div>
                          <Input
                            value={c.role ?? ""}
                            readOnly={!isEditing}
                            onChange={(e) => updateContact(c.id, { role: e.target.value || null })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div>
                          <div className="text-xs text-slate-600">Email</div>
                          <Input
                            value={c.email ?? ""}
                            readOnly={!isEditing}
                            onChange={(e) => updateContact(c.id, { email: e.target.value || null })}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-slate-600">Phone</div>
                          <Input
                            value={c.phone ?? ""}
                            readOnly={!isEditing}
                            onChange={(e) => updateContact(c.id, { phone: e.target.value || null })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={c.isPrimary}
                            disabled={!isEditing}
                            onChange={(e) => updateContact(c.id, { isPrimary: e.target.checked })}
                          />{" "}
                          Primary
                        </label>
                        {isEditing ? (
                          <Button variant="danger" type="button" onClick={() => deleteContact(c.id)}>
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isEditing ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">Add contact</div>
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <div className="text-xs text-slate-600">Name</div>
                    <Input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Role</div>
                    <Input value={newContactRole} onChange={(e) => setNewContactRole(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Email</div>
                    <Input value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Phone</div>
                    <Input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3">
                  <Button type="button" onClick={createContact} disabled={creatingContact}>
                    {creatingContact ? "Adding…" : "Add"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">Lines / Contracts</div>
            {lines.length === 0 ? (
              <div className="mt-1 text-sm text-slate-600">No lines yet.</div>
            ) : (
              <div className="mt-2 grid gap-2">
                {lines.map((l) => (
                  <div key={l.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      {isEditing ? (
                        <Input
                          value={l.name}
                          onChange={(e) => updateLine(l.id, { name: e.target.value })}
                          className="h-8"
                        />
                      ) : (
                        <div className="text-sm font-medium text-slate-900">{l.name}</div>
                      )}
                      <label className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={l.isInvoiced}
                          onChange={async (e) => {
                            await updateLine(l.id, { isInvoiced: e.target.checked });
                          }}
                        />
                        Invoiced
                      </label>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 flex justify-end">
                        <Button variant="danger" type="button" onClick={() => deleteLine(l.id)}>
                          Delete line
                        </Button>
                      </div>
                    ) : null}
                    {l.contracts.length === 0 ? (
                      <div className="mt-1 text-sm text-slate-600">No contracts.</div>
                    ) : (
                      <div className="mt-2 grid gap-2">
                        {l.contracts.map((c) => {
                          const isEditingThisContract = isEditing && editingContractId === c.id;
                          return (
                            <div key={c.id} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                              {isEditingThisContract ? (
                                <div className="grid gap-2">
                                  <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                    <div>
                                      <div className="text-xs text-slate-600">Start</div>
                                      <Input
                                        type="datetime-local"
                                        value={editingContractStart}
                                        onChange={(e) => setEditingContractStart(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-600">End</div>
                                      <Input
                                        type="datetime-local"
                                        value={editingContractEnd}
                                        onChange={(e) => setEditingContractEnd(e.target.value)}
                                      />
                                    </div>
                                    <div style={{ gridColumn: "1 / span 2" }}>
                                      <div className="text-xs text-slate-600">Monthly price (€)</div>
                                      <Input
                                        inputMode="decimal"
                                        value={editingContractPrice}
                                        onChange={(e) => setEditingContractPrice(e.target.value)}
                                        placeholder="e.g. 499.99"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => setEditingContractId(null)}
                                      disabled={savingContract}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => saveContract(c.id)}
                                      disabled={
                                        savingContract ||
                                        !editingContractStart ||
                                        !editingContractEnd ||
                                        eurosToCents(editingContractPrice) === null ||
                                        (eurosToCents(editingContractPrice) ?? 0) <= 0
                                      }
                                    >
                                      {savingContract ? "Saving…" : "Save"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    {c.startDate} → {c.endDate} · {formatEURFromCents(c.pricePerMonthCents)}/mo
                                  </div>
                                  {isEditing ? (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => {
                                        setEditingContractId(c.id);
                                        setEditingContractStart(toDateTimeLocalValue(new Date(c.startDate)));
                                        setEditingContractEnd(toDateTimeLocalValue(new Date(c.endDate)));
                                        setEditingContractPrice(String((c.pricePerMonthCents / 100).toFixed(2)));
                                      }}
                                    >
                                      Edit
                                    </Button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isEditing ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">Add line</div>
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ gridColumn: "1 / span 2" }}>
                    <div className="text-xs text-slate-600">Line name</div>
                    <Input value={newLineName} onChange={(e) => setNewLineName(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Contract start</div>
                    <Input
                      type="datetime-local"
                      value={newContractStartDate}
                      onChange={(e) => setNewContractStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Contract end</div>
                    <Input
                      type="datetime-local"
                      value={newContractEndDate}
                      onChange={(e) => setNewContractEndDate(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / span 2" }}>
                    <div className="text-xs text-slate-600">Monthly price (€)</div>
                    <Input
                      inputMode="decimal"
                      value={newPricePerMonth}
                      onChange={(e) => setNewPricePerMonth(e.target.value)}
                      placeholder="e.g. 499.99"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={async () => {
                      const pricePerMonthCents = eurosToCents(newPricePerMonth);
                      if (pricePerMonthCents === null || pricePerMonthCents <= 0) return;

                      setCreatingLine(true);
                      try {
                        const res = await fetch(`/api/companies/${company.id}/lines`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            name: newLineName,
                            contractStartDate: newContractStartDate,
                            contractEndDate: newContractEndDate,
                            pricePerMonthCents
                          })
                        });
                        const json = (await res.json()) as any;
                        if (!res.ok || !json?.ok || !json?.line) return;

                        setLines((prev) => {
                          const nextLines = [...prev, json.line];
                          onCompanyPatch(company.id, { lines: nextLines });
                          return nextLines;
                        });

                        setNewLineName("");
                        setNewPricePerMonth("");
                      } finally {
                        setCreatingLine(false);
                      }
                    }}
                    disabled={
                      creatingLine ||
                      !newLineName ||
                      !newContractStartDate ||
                      !newContractEndDate ||
                      !newPricePerMonth ||
                      eurosToCents(newPricePerMonth) === null ||
                      (eurosToCents(newPricePerMonth) ?? 0) <= 0
                    }
                  >
                    {creatingLine ? "Adding…" : "Add"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BoardClient({
  initialCompanies,
  strategies
}: {
  initialCompanies: CompanyCard[];
  strategies: StrategyOption[];
}) {
  const [companies, setCompanies] = useState<CompanyCard[]>(initialCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [transition, setTransition] = useState<TransitionState | null>(null);

  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  function patchCompany(companyId: string, patch: Partial<CompanyCard>) {
    setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...c, ...patch } : c)));
  }

  function removeCompany(companyId: string) {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selected = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const grouped = useMemo(() => {
    const m: Record<CompanyStage, CompanyCard[]> = {
      "dead-lead": [],
      contacted: [],
      "evaluating-proposal": [],
      "trial-30-day": [],
      client: []
    };

    for (const c of companies) {
      const derived: CompanyCard = {
        ...c,
        hasDueOutreach: c.nextOutreachDueAt ? new Date(c.nextOutreachDueAt) <= new Date() : false
      };

      m[derived.stage].push(derived);
    }

    return m;
  }, [companies]);

  async function persistStage(companyId: string, toStage: CompanyStage) {
    await fetch(`/api/companies/${companyId}/stage`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toStage })
    });
  }

  async function createCompany() {
    setCreatingCompany(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: createName, notes: createNotes })
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok || !json?.company?.id) {
        window.alert(json?.error ?? "Failed to create lead");
        return;
      }

      const created: CompanyCard = {
        id: String(json.company.id),
        name: String(json.company.name ?? createName),
        notes: json.company.notes ?? (createNotes.trim() ? createNotes.trim() : null),
        stage: (json.company.stage as CompanyStage) ?? "dead-lead",
        commissionPercentage: 0,
        nextOutreachDueAt: null,
        hasDueOutreach: false,
        hasDueReminder: false,
        hasDueRenewal: false,
        strategyAssigned: null,
        contacts: [],
        lines: []
      };

      setCompanies((prev) => [created, ...prev]);
      setSelectedCompanyId(created.id);
      setEditingCompanyId(null);

      setCreateOpen(false);
      setCreateName("");
      setCreateNotes("");
    } finally {
      setCreatingCompany(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Leads & Clients</h1>
          <p className="mt-1 text-sm text-slate-600">Drag company cards between columns.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New Lead
        </Button>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) {
            setCreateName("");
            setCreateNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New lead</DialogTitle>
            <DialogDescription>Create a new company card in Dead Leads.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <div className="text-xs text-slate-600">Company name</div>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-slate-600">Notes</div>
              <Textarea value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} className="min-h-[90px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateName("");
                  setCreateNotes("");
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={createCompany} disabled={creatingCompany || !createName.trim()}>
                {creatingCompany ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        onDragEnd={(event) => {
          const companyId = String(event.active.id);
          const overStage = event.over?.id as CompanyStage | undefined;
          if (!overStage) return;

          const current = companies.find((c) => c.id === companyId);
          if (!current) return;
          if (current.stage === overStage) return;

          const requiresWizard =
            overStage === "contacted" ||
            overStage === "evaluating-proposal" ||
            overStage === "trial-30-day" ||
            overStage === "client";

          if (requiresWizard) {
            setTransition({
              open: true,
              companyId,
              fromStage: current.stage,
              toStage: overStage,
              requiresClientLine: overStage === "client" && current.lines.length === 0
            });
            return;
          }

          setCompanies((prev) =>
            prev.map((c) => (c.id === companyId ? { ...c, stage: overStage } : c))
          );

          persistStage(companyId, overStage).catch(() => {
            // revert on failure
            setCompanies((prev) =>
              prev.map((c) => (c.id === companyId ? { ...c, stage: current.stage } : c))
            );
          });
        }}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, minmax(220px, 1fr))" }}>
          {STAGES.map((s) => (
            <StageColumn key={s.id} stage={s.id} title={s.title}>
              {grouped[s.id].map((c) => (
                <DraggableCard
                  key={c.id}
                  company={c}
                  onClick={() => {
                    setSelectedCompanyId(c.id);
                    setEditingCompanyId(null);
                  }}
                />
              ))}
            </StageColumn>
          ))}
        </div>
      </DndContext>

      {selected ? (
        <CompanyModal
          company={selected}
          open={Boolean(selectedCompanyId)}
          onOpenChange={(v) => {
            if (v) return;
            setSelectedCompanyId(null);
            setEditingCompanyId(null);
          }}
          onCompanyPatch={patchCompany}
          onCompanyDelete={removeCompany}
          isEditing={editingCompanyId === selected.id}
          onIsEditingChange={(v) => setEditingCompanyId(v ? selected.id : null)}
        />
      ) : null}

      <TransitionWizard
        transition={transition}
        strategies={strategies}
        onCancel={() => setTransition(null)}
        onConfirm={async (payload) => {
          if (!transition) return;
          const companyId = transition.companyId;
          const toStage = transition.toStage;
          const prevStage = transition.fromStage;

          // optimistic
          setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...c, stage: toStage } : c)));
          setTransition(null);

          const res = await fetch(`/api/companies/${companyId}/transition`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ toStage, ...payload })
          });

          if (!res.ok) {
            // revert
            setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...c, stage: prevStage } : c)));
          } else {
            const json = (await res.json()) as any;
            if (toStage === "contacted" && json?.assignment) {
              patchCompany(companyId, {
                nextOutreachDueAt: json.assignment.nextOutreachDueAt,
                hasDueOutreach: json.assignment.nextOutreachDueAt
                  ? new Date(json.assignment.nextOutreachDueAt) <= new Date()
                  : false,
                strategyAssigned: json.assignment.strategy
              });
            }

            if (toStage === "client" && json?.createdLine) {
              setCompanies((prev) =>
                prev.map((c) =>
                  c.id === companyId
                    ? {
                        ...c,
                        lines: [...c.lines, json.createdLine]
                      }
                    : c
                )
              );
            }
          }
        }}
      />
    </div>
  );
}
