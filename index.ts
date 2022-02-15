/*
** This module is the action's main entry point and drives the process to set up and
** configure OrgFlow locally on a runner in a GitHub Actions context.
*/

import * as core from "@actions/core";
import { install } from "./lib/install";
import { setLicenseKey } from "./lib/cli";

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

		const installedVersion = await install(versionSpec, includePrerelease, skipInstall);

		core.setOutput("version", installedVersion);

		await setLicenseKey(licenseKey);

		// TODO:
		// Set up Git configuration if instructed
		// Set up SFDC auth if instructed
	}
	catch (error)
	{
		core.setFailed(error.message);
	}
}

run();