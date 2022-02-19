/*
** This module is the action's main entry point.
*/

import * as core from "@actions/core";
import { install } from "./lib/install";
import { createEncryptionKey, saveEncryptionKey, saveSalesforceCredentials, setDefaultStack, setLicenseKey } from "./lib/cli";

export async function run()
{
	try
	{
		// Gather and validate input:

		const versionSpec = core.getInput("version");

		const includePrerelease =
			core.getInput("include-prerelease") ? // getBooleanInput() will throw if input is not present, so guard against that
				core.getBooleanInput("include-prerelease") :
				false;

		const skipInstall =
			core.getInput("skip-install") ? // getBooleanInput() will throw if input is not present, so guard against that
				core.getBooleanInput("skip-install") :
				false;

		const licenseKey = core.getInput("license-key");
		if (!licenseKey)
		{
			throw new Error("Input value 'license-key' is required.");
		}

		const salesforceUsername = core.getInput("salesforce-username");
		const salesforcePassword = core.getInput("salesforce-password");
		if (!!salesforceUsername !== !!salesforcePassword)
		{
			throw new Error("Either both or neither of inputs 'salesforce-username' and 'salesforce-password' must have a value.");
		}

		const stackName = core.getInput("stack-name")
		if (!stackName && !!salesforcePassword)
		{
			throw new Error("Input value 'stack-name' is required when saving Salesforce credentials.");
		}

		const installedVersion = await install(versionSpec, includePrerelease, skipInstall);

		core.setOutput("version", installedVersion);

		await setLicenseKey(licenseKey);

		if (salesforcePassword)
		{
			const encryptionKey = await createEncryptionKey(stackName);
			await saveEncryptionKey(encryptionKey, stackName);
			await saveSalesforceCredentials(salesforceUsername, salesforcePassword, stackName);

			core.setSecret(encryptionKey); // Mask encryption key in logs
			core.setOutput("encryption-key", encryptionKey);
		}

		if (stackName)
		{
			await setDefaultStack(stackName);
		}

		// TODO:
		// Set up Git configuration if instructed
	}
	catch (error)
	{
		core.setFailed(error.message);
	}
}

run();