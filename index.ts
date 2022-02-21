/*
** This module is the action's main entry point.
*/

import * as core from "@actions/core";
import * as artifact from "@actions/artifact";
import { install } from "./lib/install";
import { createEncryptionKey, saveEncryptionKey, saveSalesforceCredentials, setDefaultStack, setLicenseKey } from "./lib/cli";
import { setCommitterEmail, setCommitterName, configureGitAuthentication } from "./lib/git";

const logDirPath = "/tmp/OrgFlow";
const logFilePath = `${logDirPath}/setup.log`;

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

		const gitUsername = core.getInput("git-username");
		const gitPassword = core.getInput("git-password");
		const gitCommitterName = core.getInput("git-committer-name");
		const gitCommitterEmail = core.getInput("git-committer-email");
		if (gitUsername && !gitPassword)
		{
			throw new Error("Input value 'git-username' must only be used when also using 'git-password'.");
		}

		const stackName = core.getInput("stack-name");
		if (!stackName && salesforcePassword)
		{
			throw new Error("Input value 'stack-name' is required when saving Salesforce credentials.");
		}
		if (!stackName && gitPassword)
		{
			throw new Error("Input value 'stack-name' is required when saving Git credentials.");
		}

		const encryptionKeyInput = core.getInput("encryption-key");
		if (encryptionKeyInput && encryptionKeyInput.length !== 64)
		{
			throw new Error("Input value 'encryption-key' must consist of 64 hexadecimal characters if specified.");
		}

		// Configure logging:

		core.exportVariable("ORGFLOW_LOGFILEPATH", logFilePath);
		core.exportVariable("ORGFLOW_LOGLEVEL", "Verbose");

		// Download and install:

		const installedVersion = await core.group("Install", () => install(versionSpec, includePrerelease, skipInstall));

		core.setOutput("version", installedVersion);

		// Validate and save license key:

		await core.group("Set license key", () => setLicenseKey(licenseKey));

		// Create (if needed) and save encryption key:

		const encryptionKey = await core.group("Save encryption key", async () =>
		{
			const encryptionKey = encryptionKeyInput ?? await createEncryptionKey();

			core.setSecret(encryptionKey); // Mask encryption key in logs
			core.setOutput("encryption-key", encryptionKey);

			if (stackName)
			{
				await saveEncryptionKey(encryptionKey, stackName);
			}

			return encryptionKey;
		});

		// Save Salesforce credentials:

		if (salesforcePassword)
		{
			await core.group("Save Salesforce credentials", () => saveSalesforceCredentials(salesforceUsername, salesforcePassword, stackName));
		}

		// Configure Git authentication and committer signature:

		if (gitPassword)
		{
			await core.group("Configure Git authentication", () => configureGitAuthentication(gitUsername, gitPassword, encryptionKey, stackName));
		}

		if (gitCommitterName || gitCommitterEmail)
		{
			await core.group("Configure Git committer", async () =>
			{
				if (gitCommitterName)
				{
					await setCommitterName(gitCommitterName);
				}

				if (gitCommitterEmail)
				{
					await setCommitterEmail(gitCommitterEmail);
				}
			});
		}

		// Set default stack:

		if (stackName)
		{
			await core.group("Set default stack", () => setDefaultStack(stackName));
		}
	}
	catch (error)
	{
		core.setFailed(error.message);

		// Upload CLI log file as artifact on failure to aid troubleshooting:
		const client = artifact.create();
		await client.uploadArtifact("OrgFlowLog", [logFilePath], logDirPath, { continueOnError: true });
	}
}

run();