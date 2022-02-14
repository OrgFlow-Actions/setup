import * as core from "@actions/core";
import { install } from "./lib/setup";

export async function run()
{
	try
	{
		const versionSpec = core.getInput("version");
		const includePrerelease =
			core.getInput("include-prerelease") ? // getBooleanInput() will throw if input is not present, so guard against that
				core.getBooleanInput("include-prerelease") :
				false;

		const installedVersion = await install(versionSpec, includePrerelease);

		core.setOutput("version", installedVersion);

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