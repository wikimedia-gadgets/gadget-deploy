interface GadgetConfiguration {
	name: string
	branch: string
	branchUrl: string
	instructions?: string[]
	credentialsFilePath: string
	buildCommand?: string
	deployCommand: string
	wikis: Array<keyof typeof wikiConfigurations>
}
interface WikiConfiguration {
	name: string
	apiUrl: string
}

export const gadgetConfigurations: Record<string, GadgetConfiguration> = {
	'twinkle': {
		name: 'Twinkle',
		branch: 'master',
		branchUrl: 'https://github.com/wikimedia-gadgets/twinkle/commits/master',
		instructions: [],
		credentialsFilePath: 'scripts/credentials.json',
		deployCommand: 'npm run deploy:cd',
		wikis: [ 'testwiki', 'enwiki' ],
	},
	'afc-helper': {
		name: 'AfC helper',
		branch: 'master',
		branchUrl: 'https://github.com/wikimedia-gadgets/afc-helper/commits/master',
		instructions: [],
		credentialsFilePath: 'scripts/credentials.json',
		deployCommand: 'npm run deploy',
		wikis: [ 'testwiki', 'enwiki' ],
	},
	'c-helper': {
		name: 'c-helper',
		branch: 'main',
		branchUrl: 'https://gitlab.wikimedia.org/spartanarbinger/c-helper-codex-version/-/tree/main',
		instructions: [],
		credentialsFilePath: 'scripts/credentials.json',
		deployCommand: 'npm run deploy:cd',
		wikis: [ 'testwiki', 'enwiki','frwiki'],
	},
}

export const wikiConfigurations: Record<string, WikiConfiguration> = {
	'testwiki': {
		name: 'Test Wikipedia',
		apiUrl: 'https://test.wikipedia.org/w/api.php',
	},
	'enwiki': {
		name: 'English Wikipedia',
		apiUrl: 'https://en.wikipedia.org/w/api.php',
	},'frwiki': {
		name: 'french Wikipedia',
		apiUrl: 'https://fr.wikipedia.org/w/api.php',
	},
	'localhost': {
		name: 'Localhost',
		apiUrl: 'http://localhost:4000/api.php',
	},
}
