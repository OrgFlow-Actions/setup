/*
** This module provides logic to download and install the CLI on the local machine.
*/

import * as core from "@actions/core";
import * as cache from "@actions/tool-cache";
import * as io from "@actions/io";
import { getInstalledVersion } from "./cli";
import { getLatestZipFileInfo } from "./download";

const toolName = "orgflow"; // GHA tool cache key

export async function install(versionSpec: string | null, includePrerelease: boolean, skipInstall: boolean)
{
	core.debug("Checking installed version...");
	let installedVersion = await getInstalledVersion();
	if (installedVersion)
	{
		core.debug(`Version '${installedVersion}' is installed.`);
	}
	else
	{
		core.debug("No installed version was detected.");
	}

	if (skipInstall)
	{
		core.debug("skipInstall=true; skipping install.");
		return installedVersion;
	}

	const latestZipFileInfo = await getLatestZipFileInfo(versionSpec, includePrerelease);

	if (installedVersion === latestZipFileInfo.versionString)
	{
		core.notice(`Version '${installedVersion}' is already installed; skipping installation.`);
		return installedVersion;
	}

	const allVersions = cache.findAllVersions(toolName);
	core.debug(`Versions in tool cache: ${allVersions}`);

	let cliDirPath = cache.find(toolName, latestZipFileInfo.versionString);

	if (!cliDirPath)
	{
		core.debug(`Version ${latestZipFileInfo.versionString} not available in tool cache; downloading from service...`);
		const tempZipFilePath = await cache.downloadTool(latestZipFileInfo.downloadUrl);
		const tempCliDirPath = await cache.extractZip(tempZipFilePath);
		core.notice(`Version ${latestZipFileInfo.versionString} was successfully downloaded and extracted to '${tempCliDirPath}'.`);
		cliDirPath = await cache.cacheDir(tempCliDirPath, toolName, latestZipFileInfo.versionString);
		core.debug(`Version ${latestZipFileInfo.versionString} was added to tool cache.`);
	}
	else
	{
		core.notice(`Using version in tool cache at '${cliDirPath}'.`);
	}

	core.addPath(cliDirPath);
	const cliPath = await io.which("orgflow");
	core.debug(`CLI on PATH: '${cliPath}'.`);

	// Re-check installed version after installation:
	installedVersion = await getInstalledVersion();

	if (installedVersion !== latestZipFileInfo.versionString)
	{
		throw new Error(`Detected installed version '${installedVersion}' but expected '${latestZipFileInfo.versionString}'; CLI was likely not installed correctly.`);
	}

	return installedVersion;
}