/*
** This module provides functionality to interact with Git.
*/

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { getCredentialHelperCommandLine, saveGitCredentials } from "./cli";

export async function configureGitAuthentication(username: string, password: string, encryptionKey: string, stackName: string)
{
	core.debug(`Configuring Git authentication for stack '${stackName}'...`);

	// Save Git credentials locally:
	await saveGitCredentials(username, password, encryptionKey, stackName);

	// Add OrgFlow as a Git credential helper:
	const orgFlowCredentialHelper = getCredentialHelperCommandLine(encryptionKey, stackName);
	await addCredentialHelper(`!${orgFlowCredentialHelper}`); // prefix with '!' to indicate execution as a shell command, see https://git-scm.com/docs/git-config#Documentation/git-config.txt-alias

	// Add a 24-hour credential helper cache to reduce the amount of calls into OrgFlow:
	await addCredentialHelper("cache --timeout=86400");

	core.debug(`Git authentication was configured successfully for stack '${stackName}'.`);
}

export async function setCommitterName(committerName: string)
{
	core.debug(`Setting Git committer name globally as '${committerName}'...`);

	await execGit("config", "--global", "user.name", `"${committerName}"`);

	core.debug("Git committer name was set successfully.");
}

export async function setCommitterEmail(committerEmail: string)
{
	core.debug(`Setting Git committer email globally as '${committerEmail}'...`);

	await execGit("config", "--global", "user.email", `"${committerEmail}"`);

	core.debug("Git committer email was set successfully.");
}

async function addCredentialHelper(credentialHelper: string)
{
	await execGit("config", "--global", "--add", "credential.helper", `"${credentialHelper}"`);
}

async function execGit(commandName: string, ...args: string[])
{
	let stdout: string = "";
	let stderr: string = "";

	const exitCode = await exec.exec("git",
		[
			commandName,
			...args
		],
		{
			ignoreReturnCode: true,
			listeners: {
				stdout: data => stdout += data.toString().trim(),
				stderr: data => stderr += data.toString().trim(),
			}
		});

	if (exitCode !== 0)
	{
		throw new Error(`'git ${commandName}' failed with exit code ${exitCode}. STDERR: ${stderr}`);
	}

	return stdout;
}