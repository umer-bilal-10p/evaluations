import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useDemoContext } from "@/context/DemoContext";
import { type DateRange } from "react-day-picker";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type EvalStatus = "Not Started" | "In Progress" | "Completed";
type TransformerType = "Three-Phase Pad" | "Single-Phase Pad" | "Pole Mount";
type IntakeCategory = "Surplus" | "Recycle";
type IntakeTag = "Base Damage" | "NPX: Rewind" | "NPX: Repair" | "NPX: Scrap";

const ALL_STATUSES: EvalStatus[]       = ["Not Started", "In Progress", "Completed"];
const ALL_CATEGORIES: IntakeCategory[] = ["Surplus", "Recycle"];

/* ─── Column definitions ─────────────────────────────────────────────────────── */
const COL_DEFS = [
  { key: "date",        label: "Date & Time Received" },
  { key: "mfgSerial",  label: "MFG S#" },
  { key: "icNumber",   label: "IC#" },
  { key: "mfr",        label: "MFR" },
  { key: "type",       label: "Type" },
  { key: "kva",        label: "KVA" },
  { key: "intake",     label: "Intake Type" },
  { key: "load",       label: "Load #" },
  { key: "whs",        label: "WHS" },
  { key: "status",     label: "Status" },
  { key: "site",       label: "Site" },
  { key: "completedOn",  label: "Completed On" },
  { key: "completedBy",  label: "Completed By" },
] as const;

type ColKey = typeof COL_DEFS[number]["key"];
type ColVisibility = Record<ColKey, boolean>;

const DEFAULT_COL_VISIBILITY: ColVisibility = {
  date: true, mfgSerial: true, icNumber: true, mfr: true, type: true,
  kva: true, intake: true, load: true, whs: true, status: true,
  site: true, completedOn: true, completedBy: true,
};

/* ─── Data model ─────────────────────────────────────────────────────────────── */
interface ActiveUser { name: string; initials: string; color: string; }

interface UnitComment {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  timestamp: string;
  text: string;
}

interface EvaluationUnit {
  id: string;
  dateReceived: string;
  timeReceived: string;
  mfgSerial: string;
  icNumber: string;
  manufacturer: string;
  transformerType: TransformerType;
  kva: number;
  intakeCategory: IntakeCategory;
  intakeTags: IntakeTag[];
  loadNumber: number;
  warehouseNumber: number;
  warehouse: string;
  site: string;
  status: EvalStatus;
  completedOn: string | null;
  completedBy: string | null;
  activeUser: ActiveUser | null;
  comments: UnitComment[];
  hasUnreadComment: boolean;
}


/* ─── Seed comments ──────────────────────────────────────────────────────────── */
const C = (id: string, author: string, initials: string, color: string, timestamp: string, text: string): UnitComment =>
  ({ id, author, authorInitials: initials, authorColor: color, timestamp, text });

const SEED_UNITS: EvaluationUnit[] = [
  /* ── Active / Pending ──────────────────────────────────────────────────────── */
  { id: "1",  dateReceived: "2024-07-22", timeReceived: "11:28 AM", mfgSerial: "TF-7662-M", icNumber: "185940632", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 1750, intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Rewind"],  loadNumber: 194503, warehouseNumber: 74,  warehouse: "74 - KS Dock Stock",                           site: "KSSO", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: true,  comments: [
    C("c1a", "Maria Santos",  "MS", "#7c3aed", "2024-07-24T09:15:00Z", "Tank exterior shows impact damage on the south panel. Flagged for structural review before proceeding."),
    C("c1b", "Carlos Rivera", "CR", "#0047BB", "2024-07-25T14:32:00Z", "Noted — holding intake until structural team signs off. Will update."),
  ]},
  { id: "2",  dateReceived: "2024-08-20", timeReceived: "9:53 AM",  mfgSerial: "TF-9884-K", icNumber: "221083647", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 250,  intakeCategory: "Recycle", intakeTags: ["NPX: Repair"],                 loadNumber: 425019, warehouseNumber: 725, warehouse: "725 - Temple, TX Finished Goods",               site: "TXTE", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "3",  dateReceived: "2024-11-05", timeReceived: "3:21 PM",  mfgSerial: "TF-5540-E", icNumber: "312048756", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 2000, intakeCategory: "Recycle", intakeTags: ["Base Damage", "NPX: Repair"],  loadNumber: 314087, warehouseNumber: 503, warehouse: "503 - Elba, AL  Yard",                          site: "ALEL", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: false, comments: [
    C("c3a", "James Mitchell", "JM", "#0047BB", "2024-11-06T10:00:00Z", "Confirmed base damage on bottom rail. Photos uploaded to SharePoint."),
  ]},
  { id: "4",  dateReceived: "2024-11-18", timeReceived: "2:37 PM",  mfgSerial: "TF-9201-A", icNumber: "098432711", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 500,  intakeCategory: "Recycle", intakeTags: ["NPX: Rewind"],                 loadNumber: 203415, warehouseNumber: 952, warehouse: "952 - Temple, TX Repair",                       site: "TXTE", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "5",  dateReceived: "2024-07-09", timeReceived: "6:47 PM",  mfgSerial: "TF-6551-N", icNumber: "093284756", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 400,  intakeCategory: "Recycle", intakeTags: ["Base Damage", "NPX: Scrap"],   loadNumber: 362780, warehouseNumber: 97,  warehouse: "97 - CO - Repair Equipment",                   site: "COGJ", status: "In Progress", completedOn: null, completedBy: null, activeUser: { name: "Carlos Rivera", initials: "CR", color: "#0047BB" }, hasUnreadComment: false, comments: [
    C("c5a", "Carlos Rivera", "CR", "#0047BB", "2024-07-12T11:20:00Z", "Evaluation started. Core appears intact but windings need closer inspection."),
  ]},
  { id: "6",  dateReceived: "2025-01-15", timeReceived: "10:12 AM", mfgSerial: "TF-3371-D", icNumber: "441928573", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 1000, intakeCategory: "Surplus", intakeTags: ["Base Damage"],                 loadNumber: 119204, warehouseNumber: 99,  warehouse: "99 - KS - Repair Equipment",                   site: "KSSO", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: true,  comments: [
    C("c6a", "Maria Santos",  "MS", "#7c3aed", "2025-01-17T08:45:00Z", "Please prioritize this unit — customer is waiting on evaluation results before making a purchase decision."),
  ]},
  { id: "7",  dateReceived: "2025-02-03", timeReceived: "8:05 AM",  mfgSerial: "TF-8831-G", icNumber: "554738201", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 750,  intakeCategory: "Recycle", intakeTags: ["NPX: Rewind", "NPX: Repair"],  loadNumber: 278456, warehouseNumber: 80,  warehouse: "80 - CO Dock Stock",                            site: "COGJ", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "9",  dateReceived: "2025-03-14", timeReceived: "4:30 PM",  mfgSerial: "TF-2278-B", icNumber: "789042316", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 3000, intakeCategory: "Recycle", intakeTags: ["NPX: Scrap"],                  loadNumber: 451803, warehouseNumber: 607, warehouse: "607 - Valley  Dock Stock",                      site: "WASP", status: "In Progress", completedOn: null, completedBy: null, activeUser: { name: "Sarah Chen", initials: "SC", color: "#7c3aed" }, hasUnreadComment: false, comments: [
    C("c9a", "Sarah Chen",    "SC", "#7c3aed", "2025-03-15T13:30:00Z", "Initial assessment done. Unit is a strong scrap candidate — oil contaminated, core delaminated."),
    C("c9b", "James Mitchell","JM", "#0047BB", "2025-03-16T09:45:00Z", "Understood. Proceed with scrap evaluation pathway and document weight and materials."),
    C("c9c", "Sarah Chen",    "SC", "#7c3aed", "2025-03-17T11:00:00Z", "Materials documented. Awaiting final sign-off to proceed."),
  ]},
  { id: "10", dateReceived: "2025-04-07", timeReceived: "11:55 AM", mfgSerial: "TF-1045-A", icNumber: "823615490", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 500,  intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Repair"],  loadNumber: 512948, warehouseNumber: 65,  warehouse: "65 - Sharon, PA Yard",                          site: "PASH", status: "Not Started", completedOn: null, completedBy: null, activeUser: null, hasUnreadComment: false, comments: [] },

  /* ── Completed ─────────────────────────────────────────────────────────────── */
  { id: "8",  dateReceived: "2023-02-14", timeReceived: "9:10 AM",  mfgSerial: "TF-1183-D", icNumber: "104837265", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 500,  intakeCategory: "Surplus", intakeTags: ["NPX: Repair"],                 loadNumber: 138204, warehouseNumber: 78,  warehouse: "78 - KS New Transf and Regulators",            site: "KSSO", status: "Completed", completedOn: "2023-03-01", completedBy: "Carlos Rivera",  activeUser: null, hasUnreadComment: false, comments: [
    C("c8a",  "Carlos Rivera", "CR", "#0047BB", "2023-02-20T08:30:00Z", "Unit passed full dielectric test. Recommended for repair and resale."),
  ]},
  { id: "11", dateReceived: "2023-03-08", timeReceived: "2:45 PM",  mfgSerial: "TF-3318-K", icNumber: "213904856", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 1000, intakeCategory: "Recycle", intakeTags: ["NPX: Scrap"],                  loadNumber: 247830, warehouseNumber: 71,  warehouse: "71 - TN Finished Goods",                       site: "TNDE", status: "Completed", completedOn: "2023-03-22", completedBy: "Maria Santos",   activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "12", dateReceived: "2023-04-19", timeReceived: "10:30 AM", mfgSerial: "TF-8820-R", icNumber: "329847102", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 750,  intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Rewind"],  loadNumber: 361509, warehouseNumber: 604, warehouse: "604 - Valley  Finished Goods",                  site: "WASP", status: "Completed", completedOn: "2023-05-04", completedBy: "James Mitchell",  activeUser: null, hasUnreadComment: false, comments: [
    C("c12a", "James Mitchell","JM", "#0047BB", "2023-04-25T14:00:00Z", "Rewind inspection complete — core in good condition. Cleared for surplus inventory."),
    C("c12b", "Maria Santos",  "MS", "#7c3aed", "2023-05-04T09:30:00Z", "Documentation closed out and unit transferred to surplus yard."),
  ]},
  { id: "13", dateReceived: "2023-05-30", timeReceived: "8:20 AM",  mfgSerial: "TF-2245-F", icNumber: "448203917", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 250,  intakeCategory: "Recycle", intakeTags: ["NPX: Repair"],                 loadNumber: 175092, warehouseNumber: 502, warehouse: "502 - Elba, AL  Repair",                        site: "ALEL", status: "Completed", completedOn: "2023-06-12", completedBy: "Sarah Chen",    activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "14", dateReceived: "2023-07-11", timeReceived: "3:50 PM",  mfgSerial: "TF-5567-P", icNumber: "561029384", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 2000, intakeCategory: "Surplus", intakeTags: ["Base Damage"],                 loadNumber: 408317, warehouseNumber: 82,  warehouse: "82 - Temple, TX Virtual Receiving",             site: "TXTE", status: "Completed", completedOn: "2023-07-28", completedBy: "David Park",     activeUser: null, hasUnreadComment: false, comments: [
    C("c14a", "David Park",    "DP", "#059669", "2023-07-18T11:45:00Z", "Base frame damage noted but contained to mounting skids only. Transformer internals unaffected."),
  ]},
  { id: "15", dateReceived: "2023-08-24", timeReceived: "1:15 PM",  mfgSerial: "TF-9912-Q", icNumber: "672841053", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 1500, intakeCategory: "Recycle", intakeTags: ["NPX: Scrap"],                  loadNumber: 293748, warehouseNumber: 76,  warehouse: "76 - CO New Transf and Regulators",            site: "COGJ", status: "Completed", completedOn: "2023-09-10", completedBy: "Linda Torres",   activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "16", dateReceived: "2023-10-03", timeReceived: "9:40 AM",  mfgSerial: "TF-4481-T", icNumber: "784930261", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 400,  intakeCategory: "Surplus", intakeTags: ["NPX: Rewind"],                 loadNumber: 520671, warehouseNumber: 67,  warehouse: "67 - Osage City, KS Fin. Goods",               site: "KSOC", status: "Completed", completedOn: "2023-10-19", completedBy: "Carlos Rivera",  activeUser: null, hasUnreadComment: false, comments: [
    C("c16a", "Carlos Rivera", "CR", "#0047BB", "2023-10-10T10:15:00Z", "Rewind evaluation complete. LV winding shows minimal degradation. Surplus eligible."),
  ]},
  { id: "17", dateReceived: "2023-11-14", timeReceived: "11:05 AM", mfgSerial: "TF-7730-H", icNumber: "895014372", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 3000, intakeCategory: "Recycle", intakeTags: ["Base Damage", "NPX: Scrap"],   loadNumber: 147863, warehouseNumber: 954, warehouse: "954 - Bakersfield, CA - Repair Equipment",      site: "CABA", status: "Completed", completedOn: "2023-11-30", completedBy: "Maria Santos",   activeUser: null, hasUnreadComment: false, comments: [
    C("c17a", "Maria Santos",  "MS", "#7c3aed", "2023-11-20T16:00:00Z", "Heavy base damage and severe oil contamination. Scrap designation confirmed."),
    C("c17b", "James Mitchell","JM", "#0047BB", "2023-11-30T08:00:00Z", "Scrap weight and materials list filed. Closed."),
  ]},
  { id: "18", dateReceived: "2023-12-20", timeReceived: "2:00 PM",  mfgSerial: "TF-6659-W", icNumber: "901283647", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 750,  intakeCategory: "Surplus", intakeTags: ["NPX: Repair"],                 loadNumber: 334510, warehouseNumber: 724, warehouse: "724 - Sharon, PA Finished Goods",               site: "PASH", status: "Completed", completedOn: "2024-01-08", completedBy: "James Mitchell",  activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "19", dateReceived: "2024-01-29", timeReceived: "10:55 AM", mfgSerial: "TF-1124-Z", icNumber: "012947385", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 500,  intakeCategory: "Recycle", intakeTags: ["NPX: Rewind"],                 loadNumber: 481927, warehouseNumber: 98,  warehouse: "98 - TN - Repair Equipment",                   site: "TNDE", status: "Completed", completedOn: "2024-02-14", completedBy: "Sarah Chen",    activeUser: null, hasUnreadComment: false, comments: [
    C("c19a", "Sarah Chen",    "SC", "#7c3aed", "2024-02-05T09:00:00Z", "Rewind pathways checked. Minor insulation wear noted but within tolerance. Surplus approved."),
  ]},
  { id: "20", dateReceived: "2024-02-15", timeReceived: "4:10 PM",  mfgSerial: "TF-8843-V", icNumber: "123048576", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 1000, intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Repair"],  loadNumber: 209384, warehouseNumber: 504, warehouse: "504 - Elba, AL  Finished Goods",                site: "ALEL", status: "Completed", completedOn: "2024-03-01", completedBy: "David Park",     activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "21", dateReceived: "2024-03-22", timeReceived: "8:30 AM",  mfgSerial: "TF-3302-S", icNumber: "234159687", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 1750, intakeCategory: "Recycle", intakeTags: ["NPX: Scrap"],                  loadNumber: 563071, warehouseNumber: 13,  warehouse: "13 - Osage City, KS Parts",                    site: "KSOC", status: "Completed", completedOn: "2024-04-05", completedBy: "Linda Torres",   activeUser: null, hasUnreadComment: false, comments: [
    C("c21a", "Linda Torres",  "LT", "#b45309", "2024-03-29T14:30:00Z", "Core and windings confirmed non-recoverable. Scrap disposition approved."),
  ]},
  { id: "22", dateReceived: "2024-04-30", timeReceived: "1:20 PM",  mfgSerial: "TF-5571-L", icNumber: "345267890", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 250,  intakeCategory: "Surplus", intakeTags: ["NPX: Repair"],                 loadNumber: 128745, warehouseNumber: 643, warehouse: "643 - Bakersfield, CA Yard - Used, New, Dock Stock", site: "CABA", status: "Completed", completedOn: "2024-05-14", completedBy: "Carlos Rivera",  activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "23", dateReceived: "2024-05-17", timeReceived: "3:00 PM",  mfgSerial: "TF-7748-X", icNumber: "456380912", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 2000, intakeCategory: "Recycle", intakeTags: ["Base Damage", "NPX: Rewind"],  loadNumber: 397264, warehouseNumber: 786, warehouse: "786 - Sharon, PA New Transformers",              site: "PASH", status: "Completed", completedOn: "2024-06-02", completedBy: "Maria Santos",   activeUser: null, hasUnreadComment: false, comments: [
    C("c23a", "Maria Santos",  "MS", "#7c3aed", "2024-05-24T10:00:00Z", "HV winding rewind assessment complete. Recommending for full rewind and surplus re-listing."),
    C("c23b", "Carlos Rivera", "CR", "#0047BB", "2024-06-02T13:00:00Z", "Rewind cleared. Unit re-tagged and moved to surplus staging."),
  ]},
  { id: "24", dateReceived: "2024-06-25", timeReceived: "9:00 AM",  mfgSerial: "TF-2291-C", icNumber: "567491023", manufacturer: "Siemens", transformerType: "Three-Phase Pad", kva: 400,  intakeCategory: "Surplus", intakeTags: ["NPX: Rewind", "NPX: Repair"],  loadNumber: 442183, warehouseNumber: 90,  warehouse: "90 - KS Receiving (Virtual Whse)",              site: "KSSO", status: "Completed", completedOn: "2024-07-10", completedBy: "James Mitchell",  activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "25", dateReceived: "2024-08-06", timeReceived: "11:30 AM", mfgSerial: "TF-9927-Y", icNumber: "678502134", manufacturer: "Eaton",   transformerType: "Three-Phase Pad", kva: 1500, intakeCategory: "Recycle", intakeTags: ["NPX: Scrap"],                  loadNumber: 315847, warehouseNumber: 75,  warehouse: "75 - TN New Transf and Regulators",            site: "TNDE", status: "Completed", completedOn: "2024-08-22", completedBy: "Sarah Chen",    activeUser: null, hasUnreadComment: false, comments: [
    C("c25a", "Sarah Chen",    "SC", "#7c3aed", "2024-08-14T15:00:00Z", "Severe corrosion throughout. Insulation failure on all three phases. Scrap confirmed."),
  ]},
  { id: "26", dateReceived: "2024-09-10", timeReceived: "2:50 PM",  mfgSerial: "TF-4460-B", icNumber: "789613245", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 750,  intakeCategory: "Surplus", intakeTags: ["Base Damage"],                 loadNumber: 271039, warehouseNumber: 64,  warehouse: "64 - Temple, TX Yard",                          site: "TXTE", status: "Completed", completedOn: "2024-09-25", completedBy: "David Park",     activeUser: null, hasUnreadComment: false, comments: [] },
  { id: "27", dateReceived: "2024-10-22", timeReceived: "8:15 AM",  mfgSerial: "TF-6614-J", icNumber: "890724356", manufacturer: "ABB",     transformerType: "Three-Phase Pad", kva: 3000, intakeCategory: "Recycle", intakeTags: ["NPX: Repair"],                 loadNumber: 504921, warehouseNumber: 728, warehouse: "728 - Bakersfield, CA Finished Goods",          site: "CABA", status: "Completed", completedOn: "2024-11-07", completedBy: "Linda Torres",   activeUser: null, hasUnreadComment: false, comments: [
    C("c27a", "Linda Torres",  "LT", "#b45309", "2024-10-30T09:15:00Z", "Winding resistance tests passed. Tap changer serviced. Ready for surplus."),
    C("c27b", "David Park",    "DP", "#059669", "2024-11-07T14:00:00Z", "Final documentation complete. Unit released to surplus yard."),
  ]},
  { id: "28", dateReceived: "2025-02-28", timeReceived: "1:44 PM",  mfgSerial: "TF-4492-C", icNumber: "667193845", manufacturer: "GE",      transformerType: "Three-Phase Pad", kva: 1500, intakeCategory: "Surplus", intakeTags: ["Base Damage", "NPX: Rewind"],  loadNumber: 390127, warehouseNumber: 953, warehouse: "953 - Sharon, PA Repair",                       site: "PASH", status: "Completed", completedOn: "2025-03-05", completedBy: "Maria Santos",   activeUser: null, hasUnreadComment: false, comments: [
    C("c28a", "James Mitchell","JM", "#0047BB", "2025-03-01T09:00:00Z", "Inspection complete. All components within spec. Recommending for surplus resale."),
    C("c28b", "Maria Santos",  "MS", "#7c3aed", "2025-03-05T15:10:00Z", "Evaluation finalized and closed. Documentation submitted to logistics."),
  ]},
];

const ROW_INTERVAL_MS = 280;
const MANUFACTURERS  = [...new Set(SEED_UNITS.map((u) => u.manufacturer))].sort();
const WAREHOUSES     = [...new Set(SEED_UNITS.map((u) => u.warehouse))].sort();
const KVA_VALUES     = [...new Set(SEED_UNITS.map((u) => u.kva))].sort((a, b) => a - b).map(String);
const SITES          = ["ALEL", "CABA", "COGJ", "KSOC", "KSSO", "PASH", "TNDE", "TXTE", "WASP"];

/* ─── Filters ────────────────────────────────────────────────────────────────── */
type Filters = {
  dateFrom: string; dateTo: string; icNumber: string; loadNumber: string;
  manufacturer: string[]; kva: string[]; warehouse: string[];
  intakeCategory: string[]; status: string[]; site: string[];
};
const EMPTY_FILTERS: Filters = {
  dateFrom: "", dateTo: "", icNumber: "", loadNumber: "",
  manufacturer: [], kva: [], warehouse: [],
  intakeCategory: [], status: [], site: [],
};
function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.dateFrom) n++; if (f.dateTo) n++; if (f.icNumber) n++; if (f.loadNumber) n++;
  if (f.manufacturer.length) n++; if (f.kva.length) n++;
  if (f.warehouse.length) n++; if (f.intakeCategory.length) n++;
  if (f.status.length) n++; if (f.site.length) n++;
  return n;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`;
}
function formatDateTime(iso: string, time: string) { return { date: formatDate(iso), time }; }
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ─── Shared field styles ────────────────────────────────────────────────────── */
const FIELD: React.CSSProperties = {
  height: 34, fontSize: 13, padding: "0 10px", borderRadius: 7,
  border: "1px solid hsl(var(--border))", background: "hsl(var(--background))",
  color: "hsl(var(--foreground))", outline: "none", boxSizing: "border-box",
  lineHeight: "34px", width: "100%", fontFamily: "inherit",
};
const LABEL: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))", marginBottom: 4, whiteSpace: "nowrap",
  fontFamily: "inherit",
};
const CARD: React.CSSProperties = {
  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  borderRadius: 12,
};

function FInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-[34px] text-[13px] rounded-[7px] font-sans bg-background shadow-none"
    />
  );
}

/* ─── Date Range Picker ──────────────────────────────────────────────────────── */
function DateRangePicker({ from, to, onChange }: {
  from: string; to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const toDate = (iso: string) => iso ? new Date(iso + "T00:00:00") : undefined;
  const toIso = (d: Date | undefined) => d ? d.toISOString().split("T")[0] : "";

  const range: DateRange = { from: toDate(from), to: toDate(to) };

  const fmt = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const label = from || to
    ? `${fmt(from) || "…"}  –  ${fmt(to) || "…"}`
    : "All dates";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          style={{
            ...FIELD,
            height: 38, padding: "0 14px", lineHeight: "normal",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", gap: 8, boxShadow: "none",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1, overflow: "hidden" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "hsl(var(--muted-foreground))" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{
              fontSize: 13, color: from || to ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </span>
          {(from || to) && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange("", ""); }}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: 2, borderRadius: 3, color: "hsl(var(--muted-foreground))", cursor: "pointer" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            onChange(toIso(r?.from), toIso(r?.to));
            if (r?.from && r?.to) setOpen(false);
          }}
          numberOfMonths={2}
          className="[--cell-size:1.85rem] text-[13px]"
        />
      </PopoverContent>
    </Popover>
  );
}

/* ─── Multi-select ───────────────────────────────────────────────────────────── */
function MultiSelect({ value, onChange, options, placeholder, style }: {
  value: string[]; onChange: (v: string[]) => void; options: string[]; placeholder: string; style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (opt: string) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  const remove = (e: React.MouseEvent, opt: string) => { e.stopPropagation(); onChange(value.filter((v) => v !== opt)); };
  return (
    <div style={{ position: "relative", ...style }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div style={{
            ...FIELD, position: "relative", height: "auto", minHeight: 34, display: "flex", flexWrap: "wrap",
            alignItems: "center", gap: 4, padding: value.length > 0 ? "4px 28px 4px 5px" : "0 28px 0 10px",
            cursor: "pointer", boxSizing: "border-box",
            border: open ? "1px solid #0047BB" : "1px solid hsl(var(--border))",
          }}>
            {value.length === 0 ? (
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, lineHeight: "24px", userSelect: "none" }}>{placeholder}</span>
            ) : value.map((opt) => (
              <span key={opt} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(0,71,187,0.09)", color: "#0047BB",
                border: "1px solid rgba(0,71,187,0.22)", borderRadius: 5,
                fontSize: 12, fontWeight: 500, padding: "1px 5px 1px 7px",
                lineHeight: "20px", whiteSpace: "nowrap", userSelect: "none",
              }}>
                {opt}
                <span onClick={(e) => remove(e, opt)} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 14, height: 14, borderRadius: 3, cursor: "pointer",
                  color: "#0047BB", opacity: 0.7, fontSize: 14, lineHeight: 1,
                  flexShrink: 0,
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.opacity = "1"; (e.currentTarget as HTMLSpanElement).style.background = "rgba(0,71,187,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.opacity = "0.7"; (e.currentTarget as HTMLSpanElement).style.background = "transparent"; }}
                >×</span>
              </span>
            ))}
            {/* Chevron arrow */}
            <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1l4 4 4-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-0 max-h-[220px] overflow-y-auto"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          {options.map((opt) => (
            <div key={opt}
              onClick={() => toggle(opt)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "hsl(var(--foreground))", userSelect: "none", background: value.includes(opt) ? "rgba(0,71,187,0.06)" : "transparent" }}
              onMouseEnter={(e) => { if (!value.includes(opt)) (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--muted))"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = value.includes(opt) ? "rgba(0,71,187,0.06)" : "transparent"; }}>
              <Checkbox
                checked={value.includes(opt)}
                onCheckedChange={() => {}}
                tabIndex={-1}
                className="h-[14px] w-[14px] shrink-0 rounded-[3px] border-[#0047BB] data-[state=checked]:bg-[#0047BB] data-[state=checked]:border-[#0047BB] pointer-events-none"
              />
              {opt}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─── Status
 *  Colors extracted from tablet app screenshot:
 *  In Progress  → cornflower blue  (#E8F2FF bg, #93C5FD border, #1D4ED8 text)
 *  Completed    → soft mint green  (#D4F7E8 bg, #6EE7B7 border, #047857 text)
 *  Not Started  → neutral slate    (unchanged)
 * ─────────────────────────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<EvalStatus, { bg: string; color: string; borderColor: string }> = {
  "Not Started": { bg: "rgba(100,116,139,0.08)",  color: "#64748b", borderColor: "rgba(100,116,139,0.28)" },
  "In Progress": { bg: "#E8F2FF",                  color: "#1D4ED8", borderColor: "#93C5FD" },
  "Completed":   { bg: "#D4F7E8",                  color: "#047857", borderColor: "#6EE7B7" },
};

function StatusIcon({ status }: { status: EvalStatus }) {
  const p = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (status === "Completed")   return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  if (status === "In Progress") return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

const StatusBadge = forwardRef<HTMLButtonElement, { status: EvalStatus } & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ status, ...props }, ref) => {
    const s = STATUS_STYLES[status];
    return (
      <button ref={ref} {...props}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.borderColor}`, cursor: "pointer", whiteSpace: "nowrap" }}
        title="Click to change status">
        <StatusIcon status={status} />{status}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

/* ─── Intake pills
 *  Colors extracted from tablet app screenshot:
 *  Base Damage → golden amber (#FEF3C7 bg, #FCD34D border, #92400E text)
 *  NPX tags    → neutral slate (unchanged)
 * ─────────────────────────────────────────────────────────────────────────────── */
function FlagIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

function IntakePills({ category, tags }: { category: IntakeCategory; tags: IntakeTag[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>{category}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {tags.map((tag) => {
          const isDamage = tag === "Base Damage";
          return (
            <span key={tag} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
              background: isDamage ? "#FEF3C7" : "rgba(100,116,139,0.08)",
              color:      isDamage ? "#92400E" : "#64748b",
              border:     isDamage ? "1px solid #FCD34D" : "1px solid rgba(100,116,139,0.22)",
            }}>
              {isDamage ? <FlagIcon /> : tag === "NPX: Rewind" ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                </svg>
              ) : tag === "NPX: Repair" ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              )}
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Warehouse tooltip ──────────────────────────────────────────────────────── */
function WarehouseTooltip({ warehouse }: { warehouse: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", marginLeft: 4, verticalAlign: "middle" }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ width: 15, height: 15, borderRadius: "50%", background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", fontSize: 9, fontWeight: 700, cursor: "help", color: "hsl(var(--muted-foreground))", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
        ?
      </button>
      {visible && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "hsl(var(--foreground))", color: "hsl(var(--background))", padding: "5px 10px", borderRadius: 7, fontSize: 11, whiteSpace: "nowrap", zIndex: 500, pointerEvents: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
          {warehouse}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid hsl(var(--foreground))" }} />
        </div>
      )}
    </span>
  );
}

/* ─── Active user lock pill ──────────────────────────────────────────────────── */
function ActiveUserPill({ user }: { user: ActiveUser }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, padding: "3px 8px 3px 5px", borderRadius: 20, background: "#F0F8FF", border: "1px solid #C7DFFE", fontSize: 11, fontWeight: 500, color: "#2563EB", whiteSpace: "nowrap" }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: user.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
        {user.initials}
      </div>
      <span>{user.name}</span>
    </div>
  );
}

/* ─── Column picker ──────────────────────────────────────────────────────────── */
function ColumnPicker({ visibility, onChange, onClose, onReset }: { visibility: ColVisibility; onChange: (key: ColKey, val: boolean) => void; onClose: () => void; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 300, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 210, overflow: "hidden", padding: "6px 0" }}>
      <div style={{ padding: "8px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))" }}>Columns</span>
        <button onClick={onReset} style={{ fontSize: 11, fontWeight: 600, color: "#0047BB", background: "none", border: "none", cursor: "pointer", padding: "1px 4px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(0,71,187,0.08)"; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "none"; }}>
          Reset
        </button>
      </div>
      {COL_DEFS.map(({ key, label }) => (
        <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "hsl(var(--foreground))" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.background = "hsl(var(--muted))"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.background = "transparent"; }}>
          <input type="checkbox" checked={visibility[key]} onChange={(e) => onChange(key, e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "#0047BB", cursor: "pointer", flexShrink: 0 }} />
          {label}
        </label>
      ))}
    </div>
  );
}

/* ─── Comment modal — shows comment history + new comment form ───────────────── */
function CommentModal({ unit, onClose }: { unit: EvaluationUnit; onClose: () => void }) {
  const [localComments, setLocalComments] = useState<UnitComment[]>(unit.comments);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (!newText.trim() || submitting) return;
    setSubmitting(true);
    const comment: UnitComment = {
      id: Date.now().toString(),
      author: "James Mitchell", authorInitials: "JM", authorColor: "#0047BB",
      timestamp: new Date().toISOString(), text: newText.trim(),
    };
    setTimeout(() => {
      setLocalComments((prev) => [...prev, comment]);
      setNewText(""); setSubmitting(false);
      setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, 50);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 14, width: "100%", maxWidth: 500, margin: "0 16px", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "0 20px 48px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid hsl(var(--border))", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--foreground))" }}>Comments</h2>
              {localComments.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#0047BB", color: "#fff", borderRadius: 99, padding: "1px 7px" }}>{localComments.length}</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Unit {unit.icNumber} · {unit.mfgSerial}</p>
          </div>
          <button onClick={onClose} style={{ color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {localComments.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              No comments yet. Be the first to leave one.
            </div>
          ) : localComments.map((comment, idx) => (
            <div key={comment.id} style={{ display: "flex", gap: 10, padding: "14px 0", borderBottom: idx < localComments.length - 1 ? "1px solid hsl(var(--border))" : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: comment.authorColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 1 }}>
                {comment.authorInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))" }}>{comment.author}</span>
                  <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{formatTimestamp(comment.timestamp)}</span>
                </div>
                <p style={{ fontSize: 13, color: "hsl(var(--foreground))", lineHeight: 1.55, margin: 0 }}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* New comment form */}
        <div style={{ padding: "14px 20px 18px", borderTop: "1px solid hsl(var(--border))", flexShrink: 0 }}>
          <textarea
            autoFocus value={newText} onChange={(e) => setNewText(e.target.value)}
            placeholder="Leave a comment…" rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            style={{ width: "100%", resize: "none", padding: "10px 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 13, outline: "none", lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.15s", fontFamily: "inherit" }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#0047BB"; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "hsl(var(--border))"; }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>⌘↵ to submit</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!newText.trim() || submitting}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: newText.trim() ? "#182557" : "hsl(var(--muted))", color: newText.trim() ? "#fff" : "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 600, cursor: newText.trim() ? "pointer" : "default", transition: "background 0.15s", fontFamily: "inherit" }}>
                {submitting ? "Posting…" : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function EvaluationsHistoryPage() {
  const { setCurrentPage, setSelectedUnit } = useDemoContext();
  const [visibleCount, setVisibleCount]     = useState(0);
  const [started, setStarted]               = useState(false);
  const [statuses, setStatuses]             = useState<Record<string, EvalStatus>>({});
  const [commentUnitId, setCommentUnitId]   = useState<string | null>(null);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [spinning, setSpinning]             = useState(false);
  const [showFilters, setShowFilters]       = useState(true);
  const [filters, setFilters]               = useState<Filters>(EMPTY_FILTERS);
  const [colVisibility, setColVisibility]   = useState<ColVisibility>(DEFAULT_COL_VISIBILITY);
  const [showColPicker, setShowColPicker]   = useState(false);
  const [loadSort, setLoadSort]             = useState<"asc" | "desc" | null>(null);

  const startPopulation = useCallback(() => {
    setVisibleCount(0); setStarted(false);
    const t = setTimeout(() => setStarted(true), 1200);
    return t;
  }, []);

  useEffect(() => { const t = startPopulation(); return () => clearTimeout(t); }, [refreshKey, startPopulation]);
  useEffect(() => {
    if (!started || visibleCount >= SEED_UNITS.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), ROW_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [started, visibleCount]);

  const handleRefresh = () => {
    setSpinning(true); setStatuses({}); setOpenDropdownId(null);
    setFilters(EMPTY_FILTERS); setRefreshKey((k) => k + 1);
    setTimeout(() => setSpinning(false), 800);
  };

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const STATUS_ORDER: Record<EvalStatus, number> = { "Not Started": 0, "In Progress": 1, "Completed": 2 };

  const filteredRows = SEED_UNITS.slice(0, visibleCount).filter((unit) => {
    const status: EvalStatus = statuses[unit.id] ?? unit.status;
    return (
      (!filters.dateFrom          || unit.dateReceived >= filters.dateFrom) &&
      (!filters.dateTo            || unit.dateReceived <= filters.dateTo) &&
      (!filters.icNumber          || unit.icNumber.includes(filters.icNumber)) &&
      (!filters.loadNumber        || String(unit.loadNumber).includes(filters.loadNumber)) &&
      (!filters.manufacturer.length || filters.manufacturer.includes(unit.manufacturer)) &&
      (!filters.kva.length        || filters.kva.includes(String(unit.kva))) &&
      (!filters.warehouse.length  || filters.warehouse.includes(unit.warehouse)) &&
      (!filters.intakeCategory.length || filters.intakeCategory.includes(unit.intakeCategory)) &&
      (!filters.status.length     || filters.status.includes(status)) &&
      (!filters.site.length       || filters.site.includes(unit.site))
    );
  });

  const sortedRows = loadSort
    ? [...filteredRows].sort((a, b) => loadSort === "asc" ? a.loadNumber - b.loadNumber : b.loadNumber - a.loadNumber)
    : [...filteredRows].sort((a, b) => {
        const aStatus = statuses[a.id] ?? a.status;
        const bStatus = statuses[b.id] ?? b.status;
        const diff = STATUS_ORDER[aStatus] - STATUS_ORDER[bStatus];
        return diff !== 0 ? diff : a.dateReceived.localeCompare(b.dateReceived);
      });

  const activeFilterCount = countActiveFilters(filters);
  const commentUnit = SEED_UNITS.find((u) => u.id === commentUnitId);
  const show = colVisibility;

  const thBase: React.CSSProperties = {
    color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap",
    position: "sticky", top: 0, background: "hsl(var(--card))", zIndex: 10,
    borderBottom: "1px solid hsl(var(--border))", padding: "0 16px", height: 41,
    textAlign: "left", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.07em",
  };

  const filterBtnStyle: React.CSSProperties = showFilters
    ? { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #0047BB", background: "#0047BB", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }
    : { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer" };

  const actionBtnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
    border: "1px solid hsl(var(--border))", background: "transparent",
    color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <PortalHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── 1. Header card ── */}
          <div style={CARD}>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>Evaluation History</h1>
                <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Transformer units received for evaluation — pending first, completed history below</p>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button onClick={() => setFilters(EMPTY_FILTERS)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                    onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "hsl(var(--muted))"; b.style.color = "hsl(var(--foreground))"; }}
                    onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "hsl(var(--muted-foreground))"; }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Clear Filters
                  </button>
                )}

                <button onClick={() => { setShowFilters((v) => !v); if (showFilters) setFilters(EMPTY_FILTERS); }} style={filterBtnStyle}
                  onMouseEnter={(e) => { if (!showFilters) (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={(e) => { if (!showFilters) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: showFilters ? "rgba(255,255,255,0.25)" : "#0047BB", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowColPicker((v) => !v)} style={actionBtnStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Columns
                  </button>
                  {showColPicker && (
                    <ColumnPicker visibility={colVisibility} onChange={(key, val) => setColVisibility((prev) => ({ ...prev, [key]: val }))} onClose={() => setShowColPicker(false)} onReset={() => setColVisibility(DEFAULT_COL_VISIBILITY)} />
                  )}
                </div>

                <button onClick={handleRefresh} title="Refresh" style={actionBtnStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--muted))"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "transform 0.6s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.04-6.5"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* ── 2. Filter card ── */}
          {showFilters && (
            <div style={CARD}>
              {/* Row 1: Date · IC# · Manufacturer · Type · KVA */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "16px 20px 12px" }}>
                <div style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Date Received</span>
                  <DateRangePicker
                    from={filters.dateFrom}
                    to={filters.dateTo}
                    onChange={(f, t) => { setFilter("dateFrom", f); setFilter("dateTo", t); }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>IC #</span>
                  <FInput value={filters.icNumber} onChange={(v) => setFilter("icNumber", v)} placeholder="Search IC number…" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Manufacturer</span>
                  <MultiSelect value={filters.manufacturer} onChange={(v) => setFilter("manufacturer", v)} options={MANUFACTURERS} placeholder="All" style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Type</span>
                  <div style={{ position: "relative" }}>
                    <Input
                      readOnly disabled value="Three-Phase Pad"
                      className="h-[34px] text-[13px] rounded-[7px] font-sans w-full pr-7 bg-muted text-muted-foreground cursor-not-allowed disabled:opacity-100 shadow-none"
                    />
                    <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1l4 4 4-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>KVA</span>
                  <MultiSelect value={filters.kva} onChange={(v) => setFilter("kva", v)} options={KVA_VALUES} placeholder="All" style={{ width: "100%" }} />
                </div>
              </div>
              {/* Row 2: Intake Type · Load # · Warehouse · Status · Site */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "12px 20px 16px", borderTop: "1px solid hsl(var(--border))" }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Intake Type</span>
                  <MultiSelect value={filters.intakeCategory} onChange={(v) => setFilter("intakeCategory", v)} options={ALL_CATEGORIES} placeholder="All" style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Load #</span>
                  <FInput value={filters.loadNumber} onChange={(v) => setFilter("loadNumber", v)} placeholder="Search load number…" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Warehouse</span>
                  <MultiSelect value={filters.warehouse} onChange={(v) => setFilter("warehouse", v)} options={WAREHOUSES} placeholder="All" style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Status</span>
                  <MultiSelect value={filters.status} onChange={(v) => setFilter("status", v)} options={ALL_STATUSES} placeholder="All" style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={LABEL}>Site</span>
                  <MultiSelect value={filters.site} onChange={(v) => setFilter("site", v)} options={SITES} placeholder="All Sites" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Table card ── */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {visibleCount === 0 ? <EmptyState /> : (
              <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
                <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 1100 }}>
                  <thead>
                    <tr>
                      {show.date        && <th style={thBase}>Date & Time Received</th>}
                      {show.mfgSerial   && <th style={thBase}>MFG S#</th>}
                      {show.icNumber    && <th style={thBase}>IC#</th>}
                      {show.mfr         && <th style={thBase}>MFR</th>}
                      {show.type        && <th style={thBase}>Type</th>}
                      {show.kva         && <th style={thBase}>KVA</th>}
                      {show.intake      && <th style={thBase}>Intake Type</th>}
                      {show.load && (
                        <th style={{ ...thBase, cursor: "pointer", userSelect: "none" }}
                          onClick={() => setLoadSort((s) => s === "asc" ? "desc" : s === "desc" ? null : "asc")}
                          title="Sort by Load #">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            Load #
                            <span style={{ display: "inline-flex", flexDirection: "column", gap: 1, lineHeight: 1 }}>
                              <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                                <path d="M4 0L7.5 5H0.5L4 0Z" fill={loadSort === "asc" ? "hsl(var(--foreground))" : "hsl(var(--border))"} />
                              </svg>
                              <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                                <path d="M4 5L0.5 0H7.5L4 5Z" fill={loadSort === "desc" ? "hsl(var(--foreground))" : "hsl(var(--border))"} />
                              </svg>
                            </span>
                          </span>
                        </th>
                      )}
                      {show.whs         && <th style={thBase}>WHS</th>}
                      {show.status      && <th style={thBase}>Status</th>}
                      {show.site        && <th style={thBase}>Site</th>}
                      {show.completedOn && <th style={thBase}>Completed On</th>}
                      {show.completedBy && <th style={thBase}>Completed By</th>}
                      <th style={{ ...thBase, padding: "0 16px 0 8px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.length === 0 ? (
                      <tr><td colSpan={99}>
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.5 }}>
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>No results match the active filters.</p>
                          <button onClick={() => setFilters(EMPTY_FILTERS)} style={{ marginTop: 8, fontSize: 12, color: "#0047BB", background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>
                        </div>
                      </td></tr>
                    ) : sortedRows.map((unit, idx) => {
                      const status: EvalStatus = statuses[unit.id] ?? unit.status;
                      const { date, time } = formatDateTime(unit.dateReceived, unit.timeReceived);
                      const site = unit.site;
                      const hasComments = unit.comments.length > 0;
                      const isUnread = unit.hasUnreadComment;
                      return (
                        <tr key={unit.id}
                          style={{ borderBottom: idx < sortedRows.length - 1 ? "1px solid hsl(var(--border))" : undefined, animation: "fadeSlideIn 0.4s ease-out" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "hsl(var(--muted) / 0.4)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>

                          {show.date && (
                            <td className="px-4 py-3" style={{ whiteSpace: "nowrap" }}>
                              <div style={{ fontSize: 13, color: "hsl(var(--foreground))" }}>{date}</div>
                              <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>{time}</div>
                            </td>
                          )}
                          {show.mfgSerial  && <td className="px-4 py-3 whitespace-nowrap font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{unit.mfgSerial}</td>}
                          {show.icNumber   && <td className="px-4 py-3 whitespace-nowrap" style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{unit.icNumber}</td>}
                          {show.mfr        && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{unit.manufacturer}</td>}
                          {show.type       && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.transformerType}</td>}
                          {show.kva        && <td className="px-4 py-3 font-medium" style={{ color: "hsl(var(--foreground))", whiteSpace: "nowrap", fontSize: 13 }}>{unit.kva.toLocaleString()}</td>}
                          {show.intake     && <td className="px-4 py-3"><IntakePills category={unit.intakeCategory} tags={unit.intakeTags} /></td>}
                          {show.load       && <td className="px-4 py-3 whitespace-nowrap" style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{unit.loadNumber}</td>}

                          {show.whs && (
                            <td className="px-4 py-3" style={{ whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: 13, color: "hsl(var(--foreground))" }}>{unit.warehouseNumber}</span>
                              <WarehouseTooltip warehouse={unit.warehouse} />
                            </td>
                          )}

                          {show.status && (
                            <td className="px-4 py-3" style={{ position: "relative" }}>
                              {/* Status badge + comment button side by side */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <StatusBadge status={status} />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="min-w-[160px]">
                                    {ALL_STATUSES.map((s) => {
                                      const st = STATUS_STYLES[s];
                                      return (
                                        <DropdownMenuItem key={s}
                                          onClick={() => setStatuses((prev) => ({ ...prev, [unit.id]: s }))}
                                          className={cn("text-[13px] cursor-pointer gap-2", s === status ? "font-semibold" : "font-normal")}
                                          style={{ color: s === status ? st.color : undefined }}>
                                          <span style={{ color: st.color }}><StatusIcon status={s} /></span>
                                          {s}
                                          {s === status && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: "auto", color: st.color }}><polyline points="20 6 9 17 4 12" /></svg>}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {/* Comment button — orange if unread */}
                                <button onClick={() => setCommentUnitId(unit.id)} title={isUnread ? "Unread comment" : hasComments ? "View comments" : "Add comment"}
                                  style={{ position: "relative", width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s, color 0.15s",
                                    border: isUnread ? "1px solid rgba(234,88,12,0.4)" : "1px solid hsl(var(--border))",
                                    background: isUnread ? "rgba(234,88,12,0.08)" : "transparent",
                                    color: isUnread ? "#ea580c" : "hsl(var(--muted-foreground))",
                                  }}
                                  onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!isUnread) { b.style.color = "hsl(var(--foreground))"; b.style.background = "hsl(var(--muted))"; } }}
                                  onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!isUnread) { b.style.color = "hsl(var(--muted-foreground))"; b.style.background = "transparent"; } }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg>
                                  {hasComments && (
                                    <span style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: isUnread ? "#ea580c" : "#64748b", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {unit.comments.length}
                                    </span>
                                  )}
                                </button>
                              </div>
                              {/* Active user pill below */}
                              {unit.activeUser && status === "In Progress" && (
                                <div><ActiveUserPill user={unit.activeUser} /></div>
                              )}
                            </td>
                          )}

                          {show.site        && <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))", fontSize: 13, whiteSpace: "nowrap" }}>{site}</td>}
                          {show.completedOn && (
                            <td className="px-4 py-3" style={{ color: unit.completedOn ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontSize: 13, whiteSpace: "nowrap" }}>
                              {unit.completedOn ? formatDate(unit.completedOn) : "—"}
                            </td>
                          )}
                          {show.completedBy && (
                            <td className="px-4 py-3" style={{ color: unit.completedBy ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontSize: 13, whiteSpace: "nowrap" }}>
                              {unit.completedBy ?? "—"}
                            </td>
                          )}

                          {/* Open / Locked button */}
                          <td className="px-3 py-3" style={{ whiteSpace: "nowrap" }}>
                            {unit.activeUser && status === "In Progress" ? (
                              <span title={`Locked — ${unit.activeUser.name} is working on this evaluation`}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1px solid hsl(var(--border))", background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500, cursor: "not-allowed", userSelect: "none" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                Locked
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUnit({
                                    id: unit.id,
                                    manufacturer: unit.manufacturer,
                                    icNumber: unit.icNumber,
                                    mfgSerial: unit.mfgSerial,
                                    kva: unit.kva,
                                    site: unit.site,
                                    hasBaseDamage: unit.intakeTags.includes("Base Damage"),
                                    loadNumber: String(unit.loadNumber),
                                    transformerType: unit.transformerType,
                                    intakeTags: unit.intakeTags.filter((t: string) => !t.includes("Base Damage")),
                                  });
                                  setCurrentPage("nameplate");
                                }}
                                style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #0047BB", background: "transparent", color: "#0047BB", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
                                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#0047BB"; b.style.color = "#fff"; }}
                                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "#0047BB"; }}>
                                Open
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {commentUnitId && commentUnit && (
        <CommentModal unit={commentUnit} onClose={() => setCommentUnitId(null)} />
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center" style={{ minHeight: 280 }}>
      <div className="rounded-full flex items-center justify-center mb-4" style={{ width: 52, height: 52, background: "hsl(var(--muted))" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <p className="font-medium mb-1" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>No units currently awaiting evaluation.</p>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>Units will appear here as they are received for evaluation.</p>
    </div>
  );
}
