import type { JobSource } from "../core/types.ts";
import type { JobSourceConnector } from "../core/source-interface.ts";
import { GreenhouseConnector } from "./greenhouse.ts";
import { LeverConnector } from "./lever.ts";
import { AshbyConnector } from "./ashby.ts";
import { WorkableConnector } from "./workable.ts";
import { SmartRecruitersConnector } from "./smartrecruiters.ts";

const connectorRegistry = new Map<JobSource, JobSourceConnector>();

// Register Greenhouse connector
const greenhouse = new GreenhouseConnector();
connectorRegistry.set("greenhouse", greenhouse);

// Register Lever connector
const lever = new LeverConnector();
connectorRegistry.set("lever", lever);

// Register Ashby connector
const ashby = new AshbyConnector();
connectorRegistry.set("ashby", ashby);

// Register Workable connector
const workable = new WorkableConnector();
connectorRegistry.set("workable", workable);

// Register SmartRecruiters connector
const smartrecruiters = new SmartRecruitersConnector();
connectorRegistry.set("smartrecruiters", smartrecruiters);

/**
 * Registers an ATS connector instance.
 */
export function registerConnector(connector: JobSourceConnector): void {
  connectorRegistry.set(connector.getSourceName(), connector);
}

/**
 * Retrieves a registered connector by source name.
 */
export function getConnector(source: JobSource): JobSourceConnector | null {
  return connectorRegistry.get(source) || null;
}

/**
 * Returns all currently registered connector names.
 */
export function getAvailableSources(): JobSource[] {
  return Array.from(connectorRegistry.keys());
}
