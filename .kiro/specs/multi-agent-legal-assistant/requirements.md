# Requirements Document

## Introduction

The Multi-Agent Legal Assistant is a coordinated team of specialized AI agents that replaces single-prompt LLM interactions in BriefVault. When a user uploads a legal document or asks a question, an Orchestrator routes work across ten specialized agents (Document, Legal Analysis, Research, Compliance, Risk, Client Impact, Drafting, Evidence, Comparison, Report). Agents collaborate through a shared memory layer that carries context across documents, prior reports, and prior chats within an organization, and can invoke registered tools (vector search, database, external connectors) through a Model Context Protocol (MCP) compatible interface.

The feature builds on Phase 1 (AI foundation: OCR, cleaning, chunking, embeddings) and Phase 2 (analysis engine: the 19 module registry). It reuses the existing provider-agnostic LLM layer, Prisma schema, vector store, and RAG retrieval. It introduces new abstractions for agents, an orchestrator, a shared memory service, a tool registry, and observability specific to multi-agent runs.

## Glossary

- **AI_Orchestrator**: The routing component that decomposes a user request into an ordered plan of agent invocations and combines their outputs.
- **Agent**: A specialized AI unit with a single responsibility (e.g. Document_Agent, Risk_Agent). Each Agent has a defined input schema, output schema, prompt template, list of allowed tools, and typed result.
- **Document_Agent**: The Agent that detects document type, extracts metadata, runs OCR, detects language, and validates chunk integrity for a given document.
- **Legal_Analysis_Agent**: The Agent that produces executive summary, issues, arguments, decision, and ratio decidendi for a legal document.
- **Research_Agent**: The Agent that searches uploaded documents, prior judgments, and the organization's knowledge base to surface similar cases, precedents, and related notifications.
- **Compliance_Agent**: The Agent that extracts deadlines, filings, penalties, and obligations, and produces a checklist.
- **Risk_Agent**: The Agent that classifies and explains tax risk, compliance risk, litigation risk, and financial risk for a document or scenario.
- **Client_Impact_Agent**: The Agent that identifies which client segments (banks, companies, importers, exporters, startups, etc.) are affected by a document and lists specific affected clients in the Organization when data is available.
- **Drafting_Agent**: The Agent that generates draft artifacts — legal opinion, client email, reply notice, board note — from prior agent outputs.
- **Evidence_Agent**: The Agent that returns pinpoint citations (page, paragraph, highlighted text, confidence score) supporting any factual claim produced by another Agent.
- **Comparison_Agent**: The Agent that compares two or more documents (judgments, contracts, notifications, RBI circulars) and returns added, removed, modified, and impact deltas.
- **Report_Agent**: The Agent that assembles final structured outputs — Executive Report, Client Report, Compliance Report, Legal Opinion — from other agents' results.
- **Agent_Run**: A single invocation of an Agent within an Orchestration_Run, with typed input, output, tool calls, tokens, latency, cost, and status.
- **Orchestration_Run**: A single top-level request handled by the AI_Orchestrator, containing an ordered plan and the resulting Agent_Runs.
- **Shared_Memory_Service**: The component that stores and retrieves cross-request context — prior uploads, prior reports, prior AI answers, client information, and organization knowledge — scoped to an Organization.
- **Tool_Registry**: The component that registers callable tools (vector search, database read, external connector) with a JSON schema for arguments and returns.
- **Tool_Call**: A single tool invocation made by an Agent during an Agent_Run, recorded with name, arguments, response, latency, and status.
- **Organization**: The tenant boundary derived from the authenticated user's `User.organization`; all memory, retrieval, and tool calls are scoped to this boundary.
- **Plan**: An ordered list of Agent invocations produced by the AI_Orchestrator for a given request, expressed as a directed acyclic graph of steps.
- **Citation**: A reference of the form `{ chunkId, page, paragraph, quote, confidence }` produced by the Evidence_Agent or by any Agent that quotes source material.
- **Confidence_Score**: A numeric value in `[0, 1]` attached to any Agent output indicating grounded certainty.
- **Streaming_Event**: An incremental update emitted during an Orchestration_Run — one of `plan`, `agent_started`, `agent_progress`, `tool_call`, `agent_completed`, `agent_failed`, `run_completed`, `run_failed`.

## Requirements

### Requirement 1: Orchestrator Plan Generation

**User Story:** As a legal professional, I want the AI_Orchestrator to plan which agents to run for my request, so that I get a coordinated legal-team-style response instead of a single generic answer.

#### Acceptance Criteria

1. WHEN a user submits a request with a document identifier and an optional user prompt, THE AI_Orchestrator SHALL produce a Plan containing between 1 and 10 Agent steps.
2. THE AI_Orchestrator SHALL express each Plan step as `{ stepId, agentName, dependsOn, inputSpec }` where `dependsOn` references zero or more earlier `stepId` values in the same Plan.
3. WHEN the request type is "analyze new document", THE AI_Orchestrator SHALL include Document_Agent as the first step and Report_Agent as the final step of the Plan.
4. WHEN the request type is "compare documents" and two or more document identifiers are supplied, THE AI_Orchestrator SHALL include Comparison_Agent in the Plan.
5. WHEN the request type is "answer question" and no document identifier is supplied, THE AI_Orchestrator SHALL include Research_Agent as the first step of the Plan.
6. IF the generated Plan contains a cycle in its `dependsOn` graph, THEN THE AI_Orchestrator SHALL reject the Plan and produce a new acyclic Plan.
7. THE AI_Orchestrator SHALL persist the generated Plan as part of the Orchestration_Run record before executing any Agent step.

### Requirement 2: Orchestrator Execution

**User Story:** As a legal professional, I want the AI_Orchestrator to execute agents in the right order and combine their results, so that later agents can use earlier findings.

#### Acceptance Criteria

1. WHEN an Orchestration_Run starts, THE AI_Orchestrator SHALL execute Plan steps in topological order of their `dependsOn` graph.
2. WHERE two Plan steps have no dependency between them, THE AI_Orchestrator SHALL execute those steps concurrently up to a configured concurrency limit of 4.
3. THE AI_Orchestrator SHALL pass the outputs of all `dependsOn` steps as typed inputs to each downstream Agent_Run.
4. WHEN an Agent_Run completes successfully, THE AI_Orchestrator SHALL persist the Agent_Run's typed output before scheduling any dependent step.
5. IF an Agent_Run fails after all configured retries, THEN THE AI_Orchestrator SHALL mark dependent steps as `SKIPPED` and continue executing any independent steps.
6. WHEN all Plan steps reach a terminal state (`SUCCEEDED`, `FAILED`, or `SKIPPED`), THE AI_Orchestrator SHALL mark the Orchestration_Run as `SUCCEEDED` if at least one Report_Agent step succeeded, and `PARTIAL` otherwise.
7. IF every Plan step fails, THEN THE AI_Orchestrator SHALL mark the Orchestration_Run as `FAILED` and return an error envelope to the caller.

### Requirement 3: Document Agent

**User Story:** As a legal professional, I want the Document_Agent to identify what my uploaded file is and extract its metadata, so that downstream agents know they are working with a judgment, notification, circular, or contract.

#### Acceptance Criteria

1. WHEN Document_Agent receives a `documentId` for a document in status `UPLOADED` or `READY`, THE Document_Agent SHALL return `{ documentType, language, pageCount, metadata, chunkCoverage }`.
2. THE Document_Agent SHALL classify `documentType` as one of `JUDGMENT`, `CIRCULAR`, `NOTIFICATION`, `CONTRACT`, `OPINION`, `STATUTE`, `LETTER`, or `UNKNOWN`.
3. WHERE the source document is a scanned PDF or image, THE Document_Agent SHALL invoke the existing OCR extractor before classification.
4. THE Document_Agent SHALL attach a Confidence_Score to `documentType` and to each extracted metadata field.
5. IF the document has fewer than 20 characters of extracted text, THEN THE Document_Agent SHALL return `documentType = "UNKNOWN"` and set `errorHint = "insufficient text"`.
6. THE Document_Agent SHALL compute `chunkCoverage` as the ratio of chunked characters to total cleaned text and include it in the result.

### Requirement 4: Legal Analysis Agent

**User Story:** As a legal professional, I want the Legal_Analysis_Agent to produce case-level analysis with citations, so that I have an executive summary, the issues, arguments, decision, and ratio decidendi in one grounded output.

#### Acceptance Criteria

1. WHEN Legal_Analysis_Agent runs on a document whose `documentType` is `JUDGMENT`, THE Legal_Analysis_Agent SHALL return `{ executiveSummary, issues, arguments, decision, ratioDecidendi }`.
2. WHEN Legal_Analysis_Agent runs on a document whose `documentType` is not `JUDGMENT`, THE Legal_Analysis_Agent SHALL return `{ executiveSummary, keyPoints }` and omit litigation-specific fields.
3. THE Legal_Analysis_Agent SHALL attach at least one Citation to every field whose value references specific document content.
4. IF the RAG retrieval returns fewer than 1 chunk for a section, THEN THE Legal_Analysis_Agent SHALL set that section to `{ notFound: true }` and SHALL NOT invent content.
5. THE Legal_Analysis_Agent SHALL reuse the existing prompt templates and analysis modules from `src/lib/ai/analysis/registry.ts` where a matching `AiResultKind` already exists.

### Requirement 5: Research Agent

**User Story:** As a legal professional, I want the Research_Agent to find similar cases, precedents, and related notifications from my organization's uploads and knowledge base, so that I can see the wider legal context.

#### Acceptance Criteria

1. WHEN Research_Agent receives a document or query, THE Research_Agent SHALL search across three sources: current Organization's `DocumentEmbedding` vectors, prior `Report` records for the Organization, and any configured external legal databases.
2. THE Research_Agent SHALL return a ranked list of `{ sourceType, sourceId, title, relevanceScore, matchedExcerpt }` items with `relevanceScore` in `[0, 1]`.
3. THE Research_Agent SHALL limit each source's results to a configurable maximum of 10 items per source and 25 items total.
4. WHERE the Organization has no data in a given source, THE Research_Agent SHALL omit that source and include a note in `sourcesQueried`.
5. IF the vector search returns zero matches above the configured minimum relevance threshold of 0.5, THEN THE Research_Agent SHALL return `{ results: [], reason: "no matches above threshold" }`.
6. THE Research_Agent SHALL restrict every search to documents and reports belonging to the caller's Organization.

### Requirement 6: Compliance Agent

**User Story:** As a legal professional, I want the Compliance_Agent to extract deadlines, filings, penalties, and obligations into a checklist, so that my team knows what actions are due and by when.

#### Acceptance Criteria

1. WHEN Compliance_Agent runs on a document, THE Compliance_Agent SHALL return `{ deadlines, filings, penalties, obligations, checklist }`.
2. THE Compliance_Agent SHALL represent each `deadline` as `{ description, dueDate, sourceCitation, confidence }` where `dueDate` is either an ISO-8601 date or a relative duration string such as `"30 days from notice"`.
3. THE Compliance_Agent SHALL represent each `checklist` item as `{ id, title, description, dueDate, priority, sourceCitation }` where `priority` is one of `HIGH`, `MEDIUM`, or `LOW`.
4. WHEN a document contains no deadlines or obligations, THE Compliance_Agent SHALL return the corresponding arrays as empty and set `notFound = true` for each affected section.
5. IF a monetary penalty is stated with a range, THEN THE Compliance_Agent SHALL capture both `minAmount` and `maxAmount` with the currency code.

### Requirement 7: Risk Agent

**User Story:** As a legal professional, I want the Risk_Agent to score and explain tax, compliance, litigation, and financial risk, so that I can prioritize action.

#### Acceptance Criteria

1. WHEN Risk_Agent runs on a document, THE Risk_Agent SHALL return four risk entries — `taxRisk`, `complianceRisk`, `litigationRisk`, `financialRisk` — each as `{ level, score, explanation, drivers, citations }`.
2. THE Risk_Agent SHALL classify each `level` as one of `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` and set `score` to a numeric value in `[0, 1]` consistent with `level`.
3. THE Risk_Agent SHALL include at least one Citation for every risk whose `level` is `MEDIUM` or higher.
4. WHERE a risk category is not applicable to the document, THE Risk_Agent SHALL set `level = "LOW"`, `score = 0`, and include `notApplicable = true` in the entry.
5. THE Risk_Agent SHALL compute an overall `combinedRisk` field as the highest `level` across the four risks.

### Requirement 8: Client Impact Agent

**User Story:** As a legal professional, I want the Client_Impact_Agent to tell me who is affected by a document, so that I can quickly notify the right clients and segments.

#### Acceptance Criteria

1. WHEN Client_Impact_Agent runs on a document, THE Client_Impact_Agent SHALL return `{ affectedSegments, affectedClients, impactSummary }`.
2. THE Client_Impact_Agent SHALL express each `affectedSegment` as `{ segment, reason, citations }` where `segment` is one of `BANKS`, `NBFCs`, `COMPANIES`, `IMPORTERS`, `EXPORTERS`, `STARTUPS`, `INDIVIDUALS`, `GOVERNMENT`, or `OTHER`.
3. WHERE the Shared_Memory_Service exposes client records for the Organization, THE Client_Impact_Agent SHALL list matching clients in `affectedClients` as `{ clientId, name, matchReason }`.
4. WHERE no client records are available for the Organization, THE Client_Impact_Agent SHALL return `affectedClients = []` and set `clientDataAvailable = false`.
5. THE Client_Impact_Agent SHALL NOT return clients belonging to any other Organization.

### Requirement 9: Drafting Agent

**User Story:** As a legal professional, I want the Drafting_Agent to produce draft artifacts I can review and send, so that I do not start from a blank page.

#### Acceptance Criteria

1. WHEN Drafting_Agent receives a `draftType` of `LEGAL_OPINION`, `CLIENT_EMAIL`, `REPLY_NOTICE`, or `BOARD_NOTE`, THE Drafting_Agent SHALL return `{ draftType, subject, body, markdown, citations }`.
2. THE Drafting_Agent SHALL use outputs from Legal_Analysis_Agent, Risk_Agent, and Compliance_Agent as its grounded input when those Agent_Runs exist in the same Orchestration_Run.
3. THE Drafting_Agent SHALL include a `disclaimer` field stating the draft is AI-generated and requires human review before use.
4. IF the requested `draftType` is not supported, THEN THE Drafting_Agent SHALL return an error result with `code = "UNSUPPORTED_DRAFT_TYPE"`.
5. THE Drafting_Agent SHALL keep the generated `body` within a configurable length ceiling of 4000 tokens.

### Requirement 10: Evidence Agent

**User Story:** As a legal professional, I want the Evidence_Agent to return pinpoint citations for every claim, so that I can verify any AI-produced statement against the source.

#### Acceptance Criteria

1. WHEN Evidence_Agent receives a claim string and a `documentId`, THE Evidence_Agent SHALL return a list of Citations, each with `{ chunkId, page, paragraph, highlightedText, confidence }`.
2. THE Evidence_Agent SHALL rank citations by descending `confidence` and return at most 5 citations per claim.
3. IF Evidence_Agent finds no chunk supporting the claim above a configured minimum confidence of 0.3, THEN THE Evidence_Agent SHALL return `{ citations: [], reason: "no supporting evidence" }`.
4. THE Evidence_Agent SHALL restrict `highlightedText` to a verbatim substring of the source chunk's `content` field.
5. WHEN invoked by another Agent as a post-processing step, THE Evidence_Agent SHALL attach citations to each factual claim in the invoking Agent's output before persistence.

### Requirement 11: Comparison Agent

**User Story:** As a legal professional, I want the Comparison_Agent to explain what changed between two documents, so that I can quickly see additions, removals, modifications, and their impact.

#### Acceptance Criteria

1. WHEN Comparison_Agent receives two or more `documentId` values, THE Comparison_Agent SHALL return `{ added, removed, modified, impact }` where `added`, `removed`, and `modified` are lists of `{ topic, description, citations }` items.
2. THE Comparison_Agent SHALL populate `impact` as `{ summary, severity, affectedSegments }` where `severity` is one of `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
3. WHERE the two documents share fewer than 20 percent of their key terms, THE Comparison_Agent SHALL set `comparabilityWarning = true` in the result.
4. IF only one `documentId` is supplied, THEN THE Comparison_Agent SHALL return an error result with `code = "INSUFFICIENT_INPUTS"`.
5. THE Comparison_Agent SHALL reuse the existing `compare-service` retrieval logic for candidate alignment.

### Requirement 12: Report Agent

**User Story:** As a legal professional, I want the Report_Agent to assemble a final structured report, so that I have one deliverable that combines all agent findings.

#### Acceptance Criteria

1. WHEN Report_Agent runs at the end of an Orchestration_Run, THE Report_Agent SHALL produce a `Report` record with `type` set to one of `EXECUTIVE`, `CLIENT`, `COMPLIANCE`, or `LEGAL_OPINION`.
2. THE Report_Agent SHALL populate the `sections` field as an ordered list of `{ heading, body, sourceAgents, citations }` items covering at least: overview, key findings, risks, compliance actions, and next steps.
3. THE Report_Agent SHALL render `markdown` from the same section data so preview and export stay in sync with `sections`.
4. THE Report_Agent SHALL reference every source Agent_Run's `agentRunId` in the `sourceAgents` list for the sections it contributed to.
5. IF no upstream Agent_Run produced content for a required section, THEN THE Report_Agent SHALL include the section with body `"Not available"` and omit citations.
6. THE Report_Agent SHALL write the resulting `Report` row using the existing `Report` model without altering its columns.

### Requirement 13: Shared Memory — Write

**User Story:** As a legal professional, I want the Shared_Memory_Service to remember prior uploads, reports, and answers, so that follow-up questions and future documents are context-aware.

#### Acceptance Criteria

1. WHEN an Orchestration_Run completes with status `SUCCEEDED` or `PARTIAL`, THE Shared_Memory_Service SHALL persist a summary record `{ organizationId, userId, runId, kind, title, summary, sourceIds, createdAt }`.
2. THE Shared_Memory_Service SHALL classify `kind` as one of `DOCUMENT_ANALYSIS`, `RESEARCH_ANSWER`, `COMPARISON`, `DRAFT`, or `REPORT`.
3. THE Shared_Memory_Service SHALL embed the `summary` text using the configured embedding provider and store the vector alongside the memory record.
4. THE Shared_Memory_Service SHALL scope every stored record to the caller's `organizationId`.
5. IF embedding generation fails, THEN THE Shared_Memory_Service SHALL still persist the memory record with `embeddingStatus = "PENDING"` and enqueue a retry job.

### Requirement 14: Shared Memory — Read

**User Story:** As a legal professional, I want new agent runs to use my organization's prior work as context, so that repeated topics and clients are recognized without me re-explaining them.

#### Acceptance Criteria

1. WHEN the AI_Orchestrator builds a Plan for a request, THE AI_Orchestrator SHALL query the Shared_Memory_Service for at most 10 relevant prior memory records for the caller's Organization.
2. THE Shared_Memory_Service SHALL retrieve memory records by vector similarity against the current request text and filter by `organizationId` equal to the caller's Organization.
3. THE Shared_Memory_Service SHALL return retrieved records ordered by descending similarity with `relevanceScore` in `[0, 1]`.
4. THE AI_Orchestrator SHALL include the retrieved memory records in the input to each Agent_Run under a dedicated `sharedMemory` field.
5. IF the Shared_Memory_Service read operation fails, THEN THE AI_Orchestrator SHALL proceed with `sharedMemory = []` and record a warning in the Orchestration_Run.

### Requirement 15: Tool Registry

**User Story:** As a platform maintainer, I want agents to call registered tools through a single interface, so that we can add Google Drive, SharePoint, and court databases without changing agent code.

#### Acceptance Criteria

1. THE Tool_Registry SHALL expose a `registerTool({ name, description, argsSchema, resultSchema, handler, scopes })` function.
2. THE Tool_Registry SHALL reject a registration whose `name` is already registered.
3. THE Tool_Registry SHALL validate `argsSchema` and `resultSchema` as valid JSON Schema documents before accepting the registration.
4. WHEN an Agent invokes `callTool(name, args)`, THE Tool_Registry SHALL validate `args` against `argsSchema` and reject the call with `code = "INVALID_ARGS"` on failure.
5. WHEN an Agent invokes `callTool(name, args)`, THE Tool_Registry SHALL validate the tool's return value against `resultSchema` and reject the result with `code = "INVALID_RESULT"` on failure.
6. THE Tool_Registry SHALL restrict each Agent to calling only tools whose `scopes` include one of the Agent's declared scopes.

### Requirement 16: Built-in Tools

**User Story:** As a legal professional, I want the core tools (vector search, database read, prior documents) available to agents on day one, so that agents can act without extra setup.

#### Acceptance Criteria

1. THE Tool_Registry SHALL register a `vector_search` tool that accepts `{ query, topK, organizationId }` and returns matching chunks with citations.
2. THE Tool_Registry SHALL register a `db_read_documents` tool that accepts `{ organizationId, filters }` and returns document summaries scoped to that Organization.
3. THE Tool_Registry SHALL register a `db_read_reports` tool that accepts `{ organizationId, filters }` and returns prior reports scoped to that Organization.
4. THE Tool_Registry SHALL register a `memory_search` tool that accepts `{ organizationId, query, topK }` and returns Shared_Memory_Service records.
5. WHERE the environment configures external connectors (`GDRIVE_ENABLED=true`, `SHAREPOINT_ENABLED=true`), THE Tool_Registry SHALL register the corresponding tools; otherwise the Tool_Registry SHALL NOT register them.
6. THE Tool_Registry SHALL define built-in tools using JSON Schemas that comply with the MCP tool descriptor format.

### Requirement 17: Tool Invocation Recording

**User Story:** As a platform operator, I want every tool call recorded, so that I can debug agent behavior and audit external data access.

#### Acceptance Criteria

1. WHEN an Agent invokes a tool, THE Tool_Registry SHALL persist a Tool_Call record `{ agentRunId, toolName, args, result, latencyMs, status, error }`.
2. THE Tool_Registry SHALL redact any field named `apiKey`, `token`, `password`, or `secret` from the persisted `args` and `result`.
3. IF a tool call exceeds a configurable timeout of 30 seconds, THEN THE Tool_Registry SHALL abort the call, record status `TIMEOUT`, and return an error to the Agent.
4. THE Tool_Registry SHALL cap the number of tool calls per Agent_Run to a configurable maximum of 10.
5. IF an Agent exceeds the tool call cap, THEN THE Tool_Registry SHALL reject additional calls with `code = "TOOL_CALL_LIMIT_EXCEEDED"`.

### Requirement 18: Streaming Progress

**User Story:** As a user, I want to see live progress as agents run, so that a long orchestration feels responsive.

#### Acceptance Criteria

1. WHEN a client requests an Orchestration_Run via the streaming endpoint, THE AI_Orchestrator SHALL emit Streaming_Events as Server-Sent Events on the same HTTP response.
2. THE AI_Orchestrator SHALL emit a `plan` event containing the full Plan within 2 seconds of run start.
3. THE AI_Orchestrator SHALL emit `agent_started`, `agent_completed`, and `agent_failed` events for every Plan step.
4. THE AI_Orchestrator SHALL emit a `tool_call` event for every tool invocation with tool name and duration, and SHALL NOT include tool arguments or results in the event payload.
5. WHEN the Orchestration_Run reaches a terminal state, THE AI_Orchestrator SHALL emit a single `run_completed` or `run_failed` event and close the stream.
6. IF the client disconnects mid-stream, THEN THE AI_Orchestrator SHALL continue executing the Orchestration_Run to completion on the server.

### Requirement 19: Retries and Fallbacks

**User Story:** As a user, I want the system to recover from transient failures, so that a flaky provider does not fail my entire request.

#### Acceptance Criteria

1. WHEN an Agent_Run fails due to a transient LLM error, THE AI_Orchestrator SHALL retry the Agent_Run up to a configurable maximum of 3 attempts with exponential backoff starting at 1 second.
2. WHERE the configured LLM provider is unreachable across all retries, THE AI_Orchestrator SHALL fall back to the extractive offline provider for text-based Agents.
3. IF an Agent_Run returns invalid JSON that fails schema validation, THEN THE AI_Orchestrator SHALL re-prompt the Agent once with a repair instruction before marking the run as failed.
4. WHEN a Tool_Call fails with a retryable error, THE Tool_Registry SHALL retry the call up to 2 times with a 500 millisecond delay.
5. THE AI_Orchestrator SHALL treat authentication errors, quota-exceeded errors, and schema validation failures as non-retryable.

### Requirement 20: Observability

**User Story:** As a platform operator, I want to see tokens, latency, cost, and confidence per agent per run, so that I can monitor and optimize the multi-agent system.

#### Acceptance Criteria

1. WHEN an Agent_Run completes, THE AI_Orchestrator SHALL record `{ runId, agentRunId, agentName, provider, model, tokensUsed, latencyMs, costUsd, confidence, status }` in the existing `AiRequestLog` table.
2. THE AI_Orchestrator SHALL record an Orchestration_Run summary containing total tokens, total cost, total latency, agent count, and tool-call count.
3. THE AI_Orchestrator SHALL expose a `GET /api/orchestrations/:id` endpoint that returns the Plan, per-step status, per-step timings, and aggregate metrics for the caller's Organization only.
4. THE AI_Orchestrator SHALL expose a `GET /api/orchestrations` endpoint that lists recent Orchestration_Runs scoped to the caller's Organization with cursor-based pagination.
5. IF a caller requests an Orchestration_Run belonging to a different Organization, THEN THE AI_Orchestrator SHALL return a 404 response.

### Requirement 21: Authentication and Organization Isolation

**User Story:** As a security-conscious operator, I want every multi-agent action to be authenticated and scoped to the caller's organization, so that no data leaks across tenants.

#### Acceptance Criteria

1. WHEN a request arrives at any multi-agent API endpoint, THE AI_Orchestrator SHALL validate the session cookie using the existing session module.
2. IF the session is invalid or expired, THEN THE AI_Orchestrator SHALL return a 401 response and SHALL NOT create an Orchestration_Run.
3. THE AI_Orchestrator SHALL derive `organizationId` from the authenticated user and attach it to every Agent_Run, Tool_Call, Shared_Memory read, and Shared_Memory write.
4. THE Shared_Memory_Service SHALL reject any read or write where the provided `organizationId` does not match the authenticated user's Organization.
5. THE Tool_Registry SHALL reject any tool invocation whose `organizationId` argument does not match the authenticated user's Organization.

### Requirement 22: API Surface

**User Story:** As a frontend developer, I want a small, stable API for running orchestrations and reading their outputs, so that the UI can integrate without churn.

#### Acceptance Criteria

1. THE AI_Orchestrator SHALL expose `POST /api/orchestrations` that accepts `{ requestType, documentIds?, query?, options? }` and returns `{ runId, status }`.
2. THE AI_Orchestrator SHALL expose `POST /api/orchestrations/stream` with the same request body that returns a Server-Sent Events stream of Streaming_Events.
3. THE AI_Orchestrator SHALL expose `GET /api/orchestrations/:id` that returns Plan, Agent_Runs, aggregate metrics, and the associated `Report` reference when present.
4. THE AI_Orchestrator SHALL expose `GET /api/orchestrations/:id/report` that returns the final `Report` payload if one exists.
5. IF the request body fails validation, THEN THE AI_Orchestrator SHALL return a 400 response with an error envelope describing the failed fields.
6. THE AI_Orchestrator SHALL return responses using the existing `{ success, message, data, meta }` envelope defined in `src/lib/api/response.ts`.

### Requirement 23: Cost and Budget Controls

**User Story:** As a platform operator, I want per-run and per-organization budget limits, so that multi-agent runs cannot generate runaway AI cost.

#### Acceptance Criteria

1. THE AI_Orchestrator SHALL enforce a configurable per-run token ceiling of 200000 total tokens across all Agent_Runs.
2. IF an Orchestration_Run's cumulative tokens exceed the per-run ceiling, THEN THE AI_Orchestrator SHALL cancel pending Plan steps and mark the run as `PARTIAL`.
3. THE AI_Orchestrator SHALL enforce a configurable per-Organization daily token ceiling of 5000000 total tokens across all runs.
4. IF an Organization's daily tokens exceed the daily ceiling, THEN THE AI_Orchestrator SHALL reject new Orchestration_Runs with a 429 response until the next UTC day.
5. THE AI_Orchestrator SHALL record the token ceiling values on the Orchestration_Run record at run start.

### Requirement 24: Provider Agnosticism

**User Story:** As a platform maintainer, I want to swap LLM providers per-agent without code changes, so that we can use cheaper models for simple agents and stronger models for complex ones.

#### Acceptance Criteria

1. THE AI_Orchestrator SHALL resolve the LLM provider and model for each Agent through configuration keys of the form `AI_AGENT_{AGENT_NAME}_PROVIDER` and `AI_AGENT_{AGENT_NAME}_MODEL`.
2. WHERE no agent-specific override is configured, THE AI_Orchestrator SHALL use the global `AI_LLM_PROVIDER` and `AI_LLM_MODEL` values.
3. THE AI_Orchestrator SHALL reuse the existing `LlmProvider` factory from `src/lib/ai/providers/llm` for all providers.
4. THE AI_Orchestrator SHALL NOT reference any provider SDK directly outside the provider layer.

### Requirement 25: Persistence Schema

**User Story:** As a platform maintainer, I want new tables that model orchestrations, agent runs, tool calls, and memory, so that the multi-agent state is first-class in the database.

#### Acceptance Criteria

1. THE AI_Orchestrator SHALL introduce new Prisma models `OrchestrationRun`, `AgentRun`, `ToolCall`, and `SharedMemoryRecord` in `prisma/schema.prisma`.
2. THE `OrchestrationRun` model SHALL include `{ id, userId, organizationId, requestType, plan, status, tokensUsed, costUsd, startedAt, finishedAt, errorMessage }`.
3. THE `AgentRun` model SHALL include `{ id, orchestrationRunId, agentName, status, input, output, tokensUsed, latencyMs, confidence, error, startedAt, finishedAt }`.
4. THE `ToolCall` model SHALL include `{ id, agentRunId, toolName, args, result, status, latencyMs, error, createdAt }`.
5. THE `SharedMemoryRecord` model SHALL include `{ id, organizationId, userId, runId, kind, title, summary, sourceIds, embeddingStatus, embeddingProvider, embeddingModel, vector, createdAt }`.
6. THE new Prisma models SHALL NOT alter the columns of the existing `Document`, `DocumentMetadata`, `DocumentChunk`, `DocumentEmbedding`, `AiResult`, `ProcessingJob`, `Report`, `User`, or `Session` tables.

### Requirement 26: Compatibility with Existing Analysis Engine

**User Story:** As a legal professional, I want the multi-agent system to reuse the existing 19 analysis modules, so that I do not lose the prior investment and I get consistent outputs.

#### Acceptance Criteria

1. WHEN an Agent produces output that maps to an existing `AiResultKind`, THE AI_Orchestrator SHALL upsert an `AiResult` row for the document using the existing `AiResult` schema.
2. THE Legal_Analysis_Agent SHALL reuse the prompts and modules under `src/lib/ai/analysis` for `EXECUTIVE_SUMMARY`, `CASE_FACTS`, `ARGUMENTS`, `FINAL_DECISION`, and `RATIO_DECIDENDI`.
3. THE Compliance_Agent SHALL reuse the modules for `COMPLIANCE_CHECKLIST`, `DEADLINES`, `ACTION_ITEMS`, and `MONETARY_INFO`.
4. THE Risk_Agent SHALL reuse the `RISK_ANALYSIS` module.
5. WHERE an existing analysis module is reused, THE AI_Orchestrator SHALL not re-run the module if the corresponding `AiResult` row exists and is younger than a configurable freshness window of 24 hours, unless the caller passes `options.force = true`.

### Requirement 27: Round-Trip Serialization

**User Story:** As a platform maintainer, I want Plans and Agent inputs and outputs to survive database round-trips exactly, so that we can replay and debug orchestrations.

#### Acceptance Criteria

1. THE AI_Orchestrator SHALL define TypeScript types and Zod schemas for `Plan`, `AgentInput`, `AgentOutput`, and `ToolCall`.
2. FOR ALL valid `Plan` values, serializing the Plan to the `OrchestrationRun.plan` JSON column and reading it back SHALL produce an equivalent Plan value (round-trip property).
3. FOR ALL valid `AgentOutput` values, serializing to the `AgentRun.output` JSON column and reading it back SHALL produce an equivalent value (round-trip property).
4. IF a stored `Plan`, `AgentInput`, `AgentOutput`, or `ToolCall` value fails schema validation on read, THEN THE AI_Orchestrator SHALL log a `SCHEMA_DRIFT` warning and return a typed error to the caller.
5. THE AI_Orchestrator SHALL version each schema with a `schemaVersion` field so future migrations remain observable.

### Requirement 28: Idempotence

**User Story:** As a user, I want to safely retry an orchestration without generating duplicate work, so that clicking twice does not double my cost or produce two reports.

#### Acceptance Criteria

1. WHEN a client submits an Orchestration_Run request with an `idempotencyKey`, THE AI_Orchestrator SHALL return the existing Orchestration_Run for that key if one is currently `RUNNING` or `SUCCEEDED`.
2. THE AI_Orchestrator SHALL scope `idempotencyKey` uniqueness to `(organizationId, idempotencyKey)`.
3. IF the same `idempotencyKey` is used for a previously `FAILED` Orchestration_Run, THEN THE AI_Orchestrator SHALL create a new Orchestration_Run and reuse the same key.
4. WHEN a caller reruns the same request without an `idempotencyKey`, THE AI_Orchestrator SHALL create a fresh Orchestration_Run.

### Requirement 29: PII and Secrets Redaction in Logs

**User Story:** As a security-conscious operator, I want sensitive fields redacted from persisted agent inputs and outputs, so that logs and databases do not accumulate secrets.

#### Acceptance Criteria

1. WHEN persisting `AgentRun.input`, `AgentRun.output`, or `ToolCall.args`, THE AI_Orchestrator SHALL redact fields matching a configured set of secret patterns including `apiKey`, `token`, `password`, `secret`, and `authorization`.
2. THE AI_Orchestrator SHALL replace redacted values with the string `"[REDACTED]"` and preserve the surrounding structure.
3. THE AI_Orchestrator SHALL apply redaction before writing to the database and before emitting Streaming_Events.
4. WHERE a document contains phone numbers or email addresses, THE AI_Orchestrator SHALL NOT redact them from Agent outputs intended for the report, but SHALL redact them from persisted debug logs when `AI_REDACT_PII_IN_LOGS = true`.

### Requirement 30: MCP Compatibility

**User Story:** As a platform maintainer, I want the Tool_Registry to speak Model Context Protocol, so that we can plug in external MCP tool servers without a custom adapter later.

#### Acceptance Criteria

1. THE Tool_Registry SHALL expose an MCP-compatible tool listing endpoint at `GET /api/mcp/tools` that returns tools in MCP tool descriptor format.
2. THE Tool_Registry SHALL expose an MCP-compatible tool invocation endpoint at `POST /api/mcp/tools/call` that accepts `{ name, arguments }` and returns `{ content, isError }` per the MCP contract.
3. WHERE the environment sets `MCP_SERVERS` to a list of MCP server URLs, THE Tool_Registry SHALL import each server's tools at startup and register them under a namespaced name (`{serverName}.{toolName}`).
4. IF an external MCP server is unreachable at startup, THEN THE Tool_Registry SHALL log a warning and continue without failing the process.
5. THE MCP endpoints SHALL require the same session authentication as other multi-agent endpoints.
