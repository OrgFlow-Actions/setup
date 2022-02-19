/*
** This module provides functionality to interact with Git.
*/

import * as exec from "@actions/exec";

export async function setCommitterName(committerName: string)
{
	console.log(`Setting Git committer name globally as '${committerName}'...`);
	await execGit("config", "--global", "user.name", committerName);
	console.log("Git committer name was set successfully.");
}

export async function setCommitterEmail(committerEmail: string)
{
	console.log(`Setting Git committer email globally as '${committerEmail}'...`);
	await execGit("config", "--global", "user.email", committerEmail);
	console.log("Git committer email was set successfully.");
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
			//outStream: createWriteStream(devNull), // Output from command may reveal lots of info and should not end up in workflow logs
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