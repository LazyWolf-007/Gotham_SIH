import React, { createContext, useContext, useState } from "react";

export interface InvestigationCase {
  id: string;
  name: string;
  codeName: string;
  agency: string;
  status: "ACTIVE" | "ARCHIVED" | "UNDER_REVIEW";
  summary: string;
  createdDate: string;
  leadOfficer: string;
}

const DEFAULT_CASES: InvestigationCase[] = [
  {
    id: "SIH26189",
    name: "Operation Grey Ledger",
    codeName: "OGL-NCRB-2026",
    agency: "NCRB / MHA Special Cell",
    status: "ACTIVE",
    summary: "Azadpur mandi produce cash skimming, front company money mule laundering, and Hawala cycles.",
    createdDate: "2026-04-12",
    leadOfficer: "Inspr. Rajesh Sharma"
  },
  {
    id: "CASE-2026-042",
    name: "Operation Blue Shield",
    codeName: "OBS-CYBER-042",
    agency: "Delhi Police Cyber Crime",
    status: "UNDER_REVIEW",
    summary: "Cross-border illicit crypto gateway laundering & SIM box syndicate network.",
    createdDate: "2026-03-01",
    leadOfficer: "ACP V. K. Malhotra"
  }
];

interface CaseContextType {
  activeCase: InvestigationCase;
  cases: InvestigationCase[];
  selectCase: (id: string) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCase, setActiveCase] = useState<InvestigationCase>(DEFAULT_CASES[0]);
  const [cases] = useState<InvestigationCase[]>(DEFAULT_CASES);

  const selectCase = (id: string) => {
    const found = cases.find((c) => c.id === id);
    if (found) {
      setActiveCase(found);
    }
  };

  return (
    <CaseContext.Provider value={{ activeCase, cases, selectCase }}>
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
