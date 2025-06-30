import path from "node:path";
import {spawn} from "node:child_process";
import express from "express";
import fs from "fs-extra";
import ansiHtml from "ansi-html";
import {logger} from "./logger.ts";
import conf from "../conf.ts";
import { gadgetConfigurations, wikiConfigurations } from "../../gadget-conf.ts";
import { PassThrough } from 'stream';
import readline from 'readline';

const router = express.Router();

router.get('/stream', async (req, res) => {
	const {code, gadget, wiki} = req.query as { code: string, gadget: string, wiki: string };

	res.writeHead(200, {
		"Connection": "keep-alive",
		"Cache-Control": "no-cache",
		"Content-Type": "text/event-stream",
	});

	res.on('close', () => {
		logger.info(`Client closed the connection`);
		res.end();
	});

	// Set up PassThrough stream and readline interface
	const pass = new PassThrough();
	const rl = readline.createInterface({ input: pass });

	rl.on('line', (line) => {
		// Use ansiHtml to convert ANSI escape codes used for terminal coloring to HTML styles.
		// Note: ansiHtml does not support all chalk colors or options.
		res.write(`data: ${btoa(ansiHtml(line))}\n\n`);
	});
	rl.on('close', () => {
		res.end();
	});

	function output(content) {
		pass.write(content.toString());
	}
	function outputSuccess() {
		output('\nend:success\n');
		pass.end();
	}
	function outputFailure(content) {
		output(content);
		output('\nend:failure\n');
		pass.end();
	}

	const gadgetConf = gadgetConfigurations[gadget];
	const wikiConf = wikiConfigurations[wiki];
	if (!gadgetConf) {
		return outputFailure('ERROR: Unknown gadget. Deployment not supported.');
	}
	if (!wikiConf) {
		return outputFailure('ERROR: Unknown wiki. Deployment not supported');
	}
	if (!gadgetConf.wikis.includes(wiki)) {
		return outputFailure(`ERROR: Deployment of ${gadget} to ${wikiConf.name} is not supported.`);
	}

	const repoPath = path.resolve(import.meta.dirname, '../../repos', gadget);
	if (!await fs.exists(repoPath)) {
		return outputFailure(`ERROR: Could not find repo in internal storage. Please check if ~/www/js/repos/${gadget} exists.`);
	}

	let tokenResponse;
	try {
		tokenResponse = await fetch(conf.restApiUrl + '/oauth2/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: conf.clientId,
				client_secret: conf.clientSecret,
				code: code,
				redirect_uri: conf.redirectUrl,
			}).toString(),
		});
		if (!tokenResponse.ok) {
			outputFailure(`ERROR: Failed to fetch access token. Status: ${tokenResponse.status}: ${tokenResponse.statusText}`);
			logger.error('Error in access_token fetch: ', await tokenResponse.json());
			return;
		}
	} catch (err) {
		outputFailure(`ERROR: Network error while fetching access token: ${err.message}`);
		logger.error('Network error while fetching access token');
		logger.error(err.stack);
		return;
	}
	const tokenData = await tokenResponse.json();
	if (!tokenData.access_token) {
		logger.error(`No access_token in response: ${JSON.stringify(tokenData)}`);
		return outputFailure(`ERROR: No access_token in response: ${JSON.stringify(tokenData)}`);
	}

	try {
		await fs.writeJson(path.join(repoPath, gadgetConf.credentialsFilePath), {
			'site': wikiConf.apiUrl,
			'accessToken': tokenData.access_token,
		});
	} catch (e) {
		return outputFailure(`ERROR: Failed to write credentials.json: ${e.message}`);
	}

	const env = {
		...process.env,
		// For colorized logging
		FORCE_COLOR: 'true',
		// Use the node.js version from home directory, instead of the container default which is too outdated
		PATH: `${process.env.HOME}/bin:${process.env.PATH}`
	};

	async function runCommand(cmd, args, label, cwd) {
		return new Promise<void>((resolve, reject) => {
			const proc = spawn(cmd, args, { cwd, env });
			output(`\n${'='.repeat(80)}\n$ ${cmd} ${args.join(' ')}\n`);
			proc.stdout.on('data', data => output(data));
			proc.stderr.on('data', data => output(data));
			proc.on('close', code => {
				if (code !== 0) {
					output(`ERROR: ${label} failed with exit code ${code}\n`);
					reject(new Error(`${label} failed`));
				} else {
					resolve();
				}
			});
			proc.on('error', err => {
				output(`ERROR: ${label} process error: ${err.message}\n`);
				reject(err);
			});
		});
	}

	try {
		if (!process.env.DEPLOY_CURRENT_BRANCH) {
			await runCommand('git', ['checkout', gadgetConf.branch], 'git checkout', repoPath);
		}
		await runCommand('git', ['pull', '--ff-only', 'origin', gadgetConf.branch], 'git pull', repoPath);
		await runCommand('npm', ['install'], 'npm install', repoPath);

		if (gadgetConf.buildCommand) {
			const [program, ...args] = gadgetConf.buildCommand.split(' ');
			await runCommand(program, args, 'build script', repoPath);
		}
		
		const [program, ...args] = gadgetConf.deployCommand.split(' ');
		await runCommand(program, args, 'deploy script', repoPath);
		outputSuccess();
	} catch (e) {
		outputFailure(`Aborted: ${e.message}`);
	}
});

export default router;
