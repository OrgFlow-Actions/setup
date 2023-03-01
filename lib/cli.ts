/*
** This module provides functionality to interact with the locally installed CLI.
*/

import * as core from "@actions/core";
import * as io from "@actions/io";
import * as exec from "@actions/exec";
// Saved for possible future use:
// import { createWriteStream } from "fs";
// import { devNull } from "os";

export async function getInstalledVersion()
{
	core.debug("Running 'orgflow --version' to get current installed version...");

	let installedVersion: string = null;

	if (!await io.which("orgflow"))
	{
		core.debug("Executable 'orgflow' could not be found; no installed version.");
	}
	else
	{
		try
		{
			installedVersion = await execOrgFlow("--version");
			core.debug(`'orgflow --version' returned '${installedVersion}'.`);
		}
		catch (error)
		{
			core.warning("Error while running 'orgflow --version'; CLI is likely not installed correctly.");
			core.warning(error);
		}
	}

	return installedVersion;
}

export async function setLicenseKey(licenseKey: string)
{
	core.debug("Validating license key...");

	// Use the stack:list command to set license key (somewhat arbitrary, we currently don't have a better way).
	await execOrgFlow("stack:list", `--licenseKey=${licenseKey}`);

	core.debug("License key was successfully validated and saved.");
}

export async function createEncryptionKey()
{
	core.debug("Creating new encryption key...");

	const encryptionKey = await execOrgFlow("auth:key:create");

	core.debug("New encryption key was successfully created.");

	return encryptionKey;
}

export async function saveEncryptionKey(encryptionKey: string, stackName: string)
{
	core.debug(`Saving encryption key locally for stack '${stackName}'...`);

	await execOrgFlow("auth:key:save",
		`--encryptionKey=${encryptionKey}`,
		`--stack="${stackName}"`);

	core.debug(`Encryption key was saved successfully for stack '${stackName}'.`);
}

export async function saveSalesforceCredentials(username: string, password: string, stackName: string)
{
	core.debug(`Saving Salesforce credentials locally for stack '${stackName}'...`);

	await execOrgFlow("auth:salesforce:save",
		`--username="${username}"`,
		`--password="${password}"`,
		`--stack="${stackName}"`,
		"--location=local");

	core.debug(`Salesforce credentials were saved successfully for stack '${stackName}'.`);
}

export async function saveGitCredentials(username: string, password: string, encryptionKey: string, stackName: string)
{
	core.debug(`Saving Git credentials locally for stack '${stackName}'...`);

	await execOrgFlow("auth:git:save",
		`--username="${username}"`,
		`--password="${password}"`,
		`--encryptionKey=${encryptionKey}`,
		`--stack="${stackName}"`,
		"--location=local");

	core.debug(`Git credentials were saved successfully for stack '${stackName}'.`);
}

export function getCredentialHelperCommandLine(encryptionKey: string, stackName: string)
{
	return `orgflow auth:git:credentialhelper --encryptionKey=${encryptionKey} --stack="${stackName}"`;
}

export async function setDefaultStack(stackName: string)
{
	core.debug(`Setting default stack '${stackName}'...`);

	await execOrgFlow("stack:setdefault", `--name="${stackName}"`);

	core.debug(`Stack '${stackName}' was sucessfully set as default.`);
}

async function execOrgFlow(commandName: string, ...args: string[])
{
	let stdout: string = "";
	let stderr: string = "";

	const exitCode = await exec.exec("orgflow",
		[
			commandName,
			...args
		],
		{
			ignoreReturnCode: true,
			// Saved for possible future use:
			//silent: true,
			//outStream: createWriteStream(devNull),
			listeners: {
				stdout: data => stdout += data.toString().trim(),
				stderr: data => stderr += data.toString().trim(),
			}
		});

	if (exitCode !== 0)
	{
		throw new Error(`'orgflow ${commandName}' failed with exit code ${exitCode}. STDERR: ${stderr}`);
	}

	return stdout;
}