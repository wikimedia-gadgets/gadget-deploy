import type { gadgetConfigurations, wikiConfigurations } from "../../gadget-conf";

export type GadgetId = keyof typeof gadgetConfigurations;
export type WikiId = keyof typeof wikiConfigurations;

export interface DeployProps {
	wiki: WikiId;
	gadget: GadgetId;
}
