import React, { createContext, useContext, useState } from "react";

export type CasePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type CaseStatus = "ACTIVE" | "UNDER REVIEW" | "SUSPENDED" | "CLOSED";

export interface InvestigationCase {
  id: string;
  name: string;
  codeName: string;
  agency: string;
  status: CaseStatus;
  priority: CasePriority;
  summary: string;
  createdDate: string;
  leadOfficer: string;
  isPrototypeRecord?: boolean;
}

export interface DossierItem {
  id: string;
  type: "SUBJECT" | "EVIDENCE" | "PATTERN" | "RELATIONSHIP";
  title: string;
  subtitle: string;
  category?: string;
  isKeyFinding?: boolean;
  dateAdded: string;
  targetEntityId?: string;
  details?: Record<string, any>;
}

export interface InvestigatorNote {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  isKeyFinding?: boolean;
}

export interface CaseActivity {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  officer: string;
}

const DEFAULT_CASES: InvestigationCase[] = [
  {
    id: "CASE-2026-014",
    name: "Operation Grey Ledger",
    codeName: "OGL-NCRB-2026",
    agency: "NCRB / MHA Special Cell",
    status: "ACTIVE",
    priority: "HIGH",
    summary:
      "Syndicated criminal network investigation regarding produce cash skimming at Azadpur Mandi, multi-tiered Hawala transaction cycles, and shell front enterprise layering.",
    createdDate: "2026-04-12",
    leadOfficer: "Inspr. Rajesh Sharma",
    isPrototypeRecord: false,
  },
  {
    id: "CASE-2026-042",
    name: "Operation Blue Shield",
    codeName: "OBS-CYBER-042",
    agency: "Delhi Police Cyber Crime",
    status: "UNDER REVIEW",
    priority: "MEDIUM",
    summary:
      "Cross-border illicit crypto gateway laundering, SIM box syndicate relay infrastructure, and financial proxy identities.",
    createdDate: "2026-03-01",
    leadOfficer: "ACP V. K. Malhotra",
    isPrototypeRecord: true,
  },
  {
    id: "CASE-2026-009",
    name: "Operation Red Falcon",
    codeName: "ORF-NARCO-009",
    agency: "Narcotics Control Bureau (NCB)",
    status: "CLOSED",
    priority: "CRITICAL",
    summary:
      "Inter-state precursor chemical smuggling conduit operating through Western Railway transit hubs.",
    createdDate: "2026-01-15",
    leadOfficer: "DySP Arvind Rathore",
    isPrototypeRecord: true,
  },
];

const DEFAULT_DOSSIER_ITEMS: DossierItem[] = [
  {
    id: "person:naveen_bhatia",
    type: "SUBJECT",
    title: "Naveen Bhatia",
    subtitle: "Syndicate Accountant & Betweenness Bottleneck (Rank #1)",
    category: "PERSON",
    isKeyFinding: true,
    dateAdded: "2026-04-12 10:15",
    targetEntityId: "person:naveen_bhatia",
  },
  {
    id: "pattern:hawala_cycle",
    type: "PATTERN",
    title: "Hawala Transaction Cycle",
    subtitle: "Circular 4-account routing: acc:a02 -> acc:a03 -> acc:a08 -> acc:a09 -> acc:a02",
    category: "FINANCIAL ROUTE",
    isKeyFinding: true,
    dateAdded: "2026-04-12 11:30",
  },
  {
    id: "FIR-2026-014",
    type: "EVIDENCE",
    title: "FIR-2026-014 Registered",
    subtitle: "Crime Branch Special Cell filing regarding Azadpur produce diversion",
    category: "FIR",
    isKeyFinding: true,
    dateAdded: "2026-04-12 09:42",
    targetEntityId: "FIR-2026-014",
  },
  {
    id: "phone:ph03",
    type: "SUBJECT",
    title: "phone:ph03 (Farhan Lodhi)",
    subtitle: "141 call burst following FIR registration (Mule Relay)",
    category: "PHONE",
    isKeyFinding: false,
    dateAdded: "2026-04-12 13:05",
    targetEntityId: "phone:ph03",
  },
];

const DEFAULT_NOTES: InvestigatorNote[] = [
  {
    id: "NOTE-001",
    title: "Initial Mandi Cash Diversion Pattern",
    content:
      "FIR-2026-014 logged regarding systematic produce cash skimming at Azadpur Mandi. Produce commission agents report anomalous daily settlement gaps.",
    author: "Inspr. Rajesh Sharma",
    timestamp: "2026-04-12 09:55",
    isKeyFinding: true,
  },
  {
    id: "NOTE-002",
    title: "Naveen Bhatia Structural Position",
    content:
      "Topological centrality analysis identifies Naveen Bhatia with betweenness rank #1 (0.02555). He bridges physical produce traders to shell holding entities.",
    author: "Krishna Singh (Investigator)",
    timestamp: "2026-04-12 11:10",
    isKeyFinding: true,
  },
  {
    id: "NOTE-003",
    title: "Mule Phone Burst Post-Registration",
    content:
      "Call detail analysis reveals 141 rapid outbound calls on phone:ph03 within 3 hours following registration of FIR-2026-014. Probable network panic relay.",
    author: "Cyber Intelligence Cell",
    timestamp: "2026-04-12 12:40",
    isKeyFinding: false,
  },
];

const DEFAULT_ACTIVITIES: CaseActivity[] = [
  {
    id: "ACT-001",
    action: "Case Dossier Initiated",
    target: "Operation Grey Ledger",
    timestamp: "Today, 09:30",
    officer: "Inspr. Rajesh Sharma",
  },
  {
    id: "ACT-002",
    action: "Subject Marked Key Node",
    target: "Naveen Bhatia (Accountant)",
    timestamp: "Today, 10:15",
    officer: "Krishna Singh",
  },
  {
    id: "ACT-003",
    action: "Pattern Identified",
    target: "Hawala 4-Account Cycle",
    timestamp: "Today, 11:30",
    officer: "Algorithm / Engine",
  },
  {
    id: "ACT-004",
    action: "Counterfactual Cut Executed",
    target: "Intervention on person:naveen_bhatia",
    timestamp: "Today, 13:20",
    officer: "Krishna Singh",
  },
];

interface CaseContextType {
  activeCase: InvestigationCase;
  cases: InvestigationCase[];
  selectCase: (id: string) => void;
  createCase: (newCase: Omit<InvestigationCase, "createdDate" | "isPrototypeRecord">) => boolean;
  dossierItems: DossierItem[];
  addToDossier: (item: Omit<DossierItem, "dateAdded">) => void;
  removeFromDossier: (id: string) => void;
  toggleKeyFinding: (id: string) => void;
  isInDossier: (id: string) => boolean;
  notes: InvestigatorNote[];
  addNote: (title: string, content: string, isKeyFinding?: boolean) => void;
  deleteNote: (id: string) => void;
  activities: CaseActivity[];
  logActivity: (action: string, target: string) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCase, setActiveCase] = useState<InvestigationCase>(DEFAULT_CASES[0]);
  const [cases, setCases] = useState<InvestigationCase[]>(DEFAULT_CASES);
  const [dossierItems, setDossierItems] = useState<DossierItem[]>(DEFAULT_DOSSIER_ITEMS);
  const [notes, setNotes] = useState<InvestigatorNote[]>(DEFAULT_NOTES);
  const [activities, setActivities] = useState<CaseActivity[]>(DEFAULT_ACTIVITIES);

  const selectCase = (id: string) => {
    const found = cases.find((c) => c.id === id);
    if (found) {
      setActiveCase(found);
      logActivity("Case Selected", found.name);
    }
  };

  const createCase = (newCase: Omit<InvestigationCase, "createdDate" | "isPrototypeRecord">): boolean => {
    if (!newCase.id || !newCase.name) return false;
    // Prevent duplicate IDs
    if (cases.some((c) => c.id.toLowerCase() === newCase.id.toLowerCase())) {
      return false;
    }

    const created: InvestigationCase = {
      ...newCase,
      createdDate: new Date().toISOString().split("T")[0],
      isPrototypeRecord: true,
    };

    setCases((prev) => [created, ...prev]);
    setActiveCase(created);
    logActivity("Case Created", created.name);
    return true;
  };

  const addToDossier = (item: Omit<DossierItem, "dateAdded">) => {
    if (dossierItems.some((d) => d.id === item.id)) return;
    const now = new Date();
    const dateStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
    const newItem: DossierItem = { ...item, dateAdded: dateStr };
    setDossierItems((prev) => [newItem, ...prev]);
    logActivity("Added to Dossier", item.title);
  };

  const removeFromDossier = (id: string) => {
    setDossierItems((prev) => prev.filter((d) => d.id !== id));
    logActivity("Removed from Dossier", id);
  };

  const toggleKeyFinding = (id: string) => {
    setDossierItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isKeyFinding: !d.isKeyFinding } : d))
    );
  };

  const isInDossier = (id: string): boolean => {
    return dossierItems.some((d) => d.id === id);
  };

  const addNote = (title: string, content: string, isKeyFinding: boolean = false) => {
    if (!content.trim()) return;
    const now = new Date();
    const dateStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
    const newNote: InvestigatorNote = {
      id: `NOTE-${String(notes.length + 1).padStart(3, "0")}`,
      title: title.trim() || "Field Observation",
      content: content.trim(),
      author: "Investigator Krishna Singh",
      timestamp: dateStr,
      isKeyFinding,
    };
    setNotes((prev) => [newNote, ...prev]);
    logActivity("Officer Note Logged", newNote.title);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const logActivity = (action: string, target: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const act: CaseActivity = {
      id: `ACT-${Date.now()}`,
      action,
      target,
      timestamp: `Today, ${timeStr}`,
      officer: "Krishna Singh",
    };
    setActivities((prev) => [act, ...prev.slice(0, 19)]);
  };

  return (
    <CaseContext.Provider
      value={{
        activeCase,
        cases,
        selectCase,
        createCase,
        dossierItems,
        addToDossier,
        removeFromDossier,
        toggleKeyFinding,
        isInDossier,
        notes,
        addNote,
        deleteNote,
        activities,
        logActivity,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
};
