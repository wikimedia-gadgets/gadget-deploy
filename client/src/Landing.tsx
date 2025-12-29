import {useState} from "react";
import { gadgetConfigurations, wikiConfigurations } from "../../gadget-conf.ts";
import './index.css';
import type { DeployProps, GadgetId } from "./types.ts";

export function Landing() {
	const [gadget, setGadget] = useState<GadgetId>(Object.keys(gadgetConfigurations)[0] as GadgetId);
	const options = Object.entries(gadgetConfigurations).map(([code, {name}]) => (
		<option key={code} value={code}>{name}</option>
	))
	const buttons = gadgetConfigurations[gadget].wikis.map(wiki => (
		<Button key={wiki + ':' + gadget} wiki={wiki} gadget={gadget} />
	))
	return (
		<>
			<h2>Wikimedia Gadget Deployer</h2>
			
			<label htmlFor="selector">Select gadget: </label>
			<select
				id="selector"
				style={{ fontSize: '1.1rem', padding: '0.2rem', minWidth: '200px' }}
				onChange={(e) => setGadget(e.target.value as GadgetId)} 
				value={gadget}
			>
				{options}
			</select>
			
			<Instructions gadget={gadget} />
			
			<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
				{buttons}
			</div>

			<footer>
        		Issues? Contact <a href="https://en.wikipedia.org/wiki/User:SD0001">SD0001</a> or <a href="https://github.com/wikimedia-gadgets/gadget-deploy">file an issue</a>!
    		</footer>
		</>
	)
}

function Instructions({ gadget }: { gadget: GadgetId }) {
	const configuration = gadgetConfigurations[gadget];
	const items = <>
		<li>
			Please review the <a href={configuration.branchUrl} target="_blank">commits in {configuration.branch} branch</a> before deploying!
		</li>
		<li>
			It is recommended to deploy to Test Wikipedia first before proceeding to English Wikipedia.
		</li>
		<li>
			For security, this tool does not store OAuth tokens. You'll be prompted to re-authorize the application via metawiki for each usage.
		</li>
		{(configuration.instructions || []).map((instruction, i) => {
			return <li dangerouslySetInnerHTML={{__html: instruction}} key={i}></li>
		})}
	</>
	return <ul>{items}</ul>;
}

function Button({ gadget, wiki }: DeployProps) {
	return (
		<a className="deploy"
			href={
				'/initiate' +
				'?gadget=' + gadget +
				'&wiki=' + wiki
			}
		>
			<button>
				Deploy to {wikiConfigurations[wiki].name}
			</button>
		</a>
	)
}
