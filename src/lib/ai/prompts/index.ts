/**
 * Prompt registry. Each AI module owns a prompt file here; services import from
 * this barrel so prompts stay decoupled from business logic.
 */
export {
  EXECUTIVE_SUMMARY_SYSTEM,
  EXECUTIVE_SUMMARY_SCHEMA_HINT,
  buildExecutiveSummaryUser,
} from "./executive-summary";
export { ASK_SYSTEM, buildAskUser } from "./ask";
