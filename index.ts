import * as core from "@actions/core";
import { install, setLicenseKey } from "./lib/setup";

export async function run()
{
	try
	{
		const versionSpec = core.getInput("version");
		const includePrerelease =
			core.getInput("include-prerelease") ? // getBooleanInput() will throw if input is not present, so guard against that
				core.getBooleanInput("include-prerelease") :
				false;
		const skipInstall =
			core.getInput("skip-install") ? // getBooleanInput() will throw if input is not present, so guard against that
				core.getBooleanInput("skip-install") :
				false;

		const installedVersion = await install(versionSpec, includePrerelease, skipInstall);

		core.setOutput("version", installedVersion);

		const licenseKey = core.getInput("license-key");
		if (!licenseKey)
		{
			throw new Error("Input value 'license-key' is required.");
		}

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