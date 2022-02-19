/*
** This module provides functionality to interact with the locally installed CLI.
*/

import * as io from "@actions/io";
import * as exec from "@actions/exec";
// import { createWriteStream } from "fs";
// import { devNull } from "os";

export async function getInstalledVersion()
{
	console.log("Running 'orgflow --version' to get current installed version...");

	let installedVersion: string = null;

	if (!await io.which("orgflow"))
	{
		console.log("Executable 'orgflow' could not be found; no installed version.");
	}
	else
	{
		try
		{
			installedVersion = await execOrgFlow("--version");
			console.log(`'orgflow --version' returned '${installedVersion}'.`);
		}
		catch (error)
		{
			console.log("Error while running 'orgflow --version'; CLI is likely not installed correctly.");
			console.log(error);
		}
	}

	return installedVersion;
}

export async function setLicenseKey(licenseKey: string)
{
	console.log("Validating license key...");

	// Use the stack:list command to set license key (somewhat arbitrary, we currently don't have a better way).
	await execOrgFlow("stack:list", `--licenseKey=${licenseKey}`);

	console.log("License key was successfully validated and saved.");
}

export async function createEncryptionKey(stackName: string)
{
	console.log("Creating new encryption key...");

	const encryptionKey = await execOrgFlow("auth:key:create", "--output=flat");

	console.log("New encryption key was successfully created.");

	return encryptionKey;
}

export async function saveEncryptionKey(encryptionKey: string, stackName: string)
{
	console.log(`Saving encryption key locally for stack '${stackName}'...`);

	await execOrgFlow("auth:key:save",
		`--encryptionKey=${encryptionKey}`,
		`--stack="${stackName}"`);

	console.log(`Encryption key was saved successfully for stack '${stackName}'.`);
}

export async function saveSalesforceCredentials(username: string, password: string, stackName: string)
{
	console.log(`Saving Salesforce credentials locally for stack '${stackName}'...`);

	await execOrgFlow("auth:salesforce:save",
		`--username="${username}"`,
		`--password="${password}"`,
		`--stack="${stackName}"`,
		"--location=local");

	console.log(`Salesforce credentials were saved successfully for stack '${stackName}'.`);
}

export async function saveGitCredentials(username: string, password: string, encryptionKey: string, stackName: string)
{
	console.log(`Saving Git credentials locally for stack '${stackName}'...`);

	await execOrgFlow("auth:git:save",
		`--username="${username}"`,
		`--password="${password}"`,
		`--encryptionKey=${encryptionKey}`,
		`--stack="${stackName}"`,
		"--location=local");

	console.log(`Git credentials were saved successfully for stack '${stackName}'.`);
}

export function getCredentialHelperCommandLine(encryptionKey: string, stackName: string)
{
	return `orgflow auth:git:credentialhelper --encryptionKey=${encryptionKey} --stack="${stackName}"`;
}

export async function setDefaultStack(stackName: string)
{
	console.log(`Setting default stack '${stackName}'...`);

	await execOrgFlow("stack:setdefault", `--name="${stackName}"`);

	console.log(`Stack '${stackName}' was sucessfully set as default.`);
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
			silent: true,
			//outStream: createWriteStream(devNull), // Output from command may reveal sensitive info and should not end up in logs
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