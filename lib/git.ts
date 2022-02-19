/*
** This module provides functionality to interact with Git.
*/

import * as exec from "@actions/exec";
import { createEncryptionKey, getCredentialHelperCommandLine, saveGitCredentials } from "./cli";

export async function configureGitAuthentication(username: string, password: string, stackName: string)
{
	console.log(`Configuring Git authentication for stack '${stackName}'...`);

	// Save Git credentials locally encrypted with a unique encryption key:
	const encryptionKey = await createEncryptionKey(stackName);
	await saveGitCredentials(username, password, encryptionKey, stackName);

	// Add OrgFlow as a Git credential helper:
	const orgFlowCredentialHelper = getCredentialHelperCommandLine(encryptionKey, stackName);
	await addCredentialHelper(`!${orgFlowCredentialHelper}`); // prefix with '!' to indicate execution as a shell command, see https://git-scm.com/docs/git-config#Documentation/git-config.txt-alias

	// Add a 24-hour credential helper cache to reduce the amount of calls into OrgFlow:
	await addCredentialHelper("cache --timeout=86400");

	console.log(`Git authentication was configured successfully for stack '${stackName}'.`);
}

export async function setCommitterName(committerName: string)
{
	console.log(`Setting Git committer name globally as '${committerName}'...`);
	await execGit("config", "--global", "user.name", `"${committerName}"`);
	console.log("Git committer name was set successfully.");
}

export async function setCommitterEmail(committerEmail: string)
{
	console.log(`Setting Git committer email globally as '${committerEmail}'...`);
	await execGit("config", "--global", "user.email", `"${committerEmail}"`);
	console.log("Git committer email was set successfully.");
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