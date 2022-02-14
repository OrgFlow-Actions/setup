import * as core from "@actions/core";
import * as cache from "@actions/tool-cache";
import * as io from "@actions/io";
import * as exec from "@actions/exec";
import axios from "axios";
import { FileInfo } from "./types";
import { getRuntimeId } from "./utils";

const productId = "cli"; // Download service product identifier
const toolName = "orgflow"; // GHA tool cache key

export async function install(versionSpec: string | null, includePrerelease: boolean, skipInstall: boolean)
{
	console.log("Checking installed version...");
	let installedVersion = await getInstalledVersion();
	if (installedVersion)
	{
		console.log(`Version '${installedVersion}' is installed.`);
	}
	else
	{
		console.log("No installed version was detected.");
	}

	if (skipInstall)
	{
		console.log("skipInstall=true; skipping install.");
		return installedVersion;
	}

	const latestZipFileInfo = await getLatestZipFileInfo(versionSpec, includePrerelease);

	if (installedVersion === latestZipFileInfo.versionString)
	{
		console.log(`Version '${installedVersion}' is already installed; skipping installation.`);
		return installedVersion;
	}

	const allVersions = cache.findAllVersions(toolName);
	console.log(`Versions in tool cache: ${allVersions}`);

	let cliDirPath = cache.find(toolName, latestZipFileInfo.versionString);

	if (!cliDirPath)
	{
		console.log(`Version ${latestZipFileInfo.versionString} not available in tool cache; downloading from service...`);
		const tempZipFilePath = await cache.downloadTool(latestZipFileInfo.downloadUrl);
		const tempCliDirPath = await cache.extractZip(tempZipFilePath);
		console.log(`Version ${latestZipFileInfo.versionString} was successfully downloaded and extracted to '${tempCliDirPath}'.`);
		cliDirPath = await cache.cacheDir(tempCliDirPath, toolName, latestZipFileInfo.versionString);
		console.log(`Version ${latestZipFileInfo.versionString} was added to tool cache.`);
	}
	else
	{
		console.log(`Using version in tool cache at '${cliDirPath}'.`);
	}

	core.addPath(cliDirPath);
	const cliPath = await io.which("orgflow");
	console.log(`CLI on PATH: '${cliPath}'.`);

	// Re-check installed version after installation:
	installedVersion = await getInstalledVersion();

	if (installedVersion !== latestZipFileInfo.versionString)
	{
		throw new Error(`Detected installed version '${installedVersion}' but expected '${latestZipFileInfo.versionString}'; CLI was likely not installed correctly.`);
	}

	return installedVersion;
}

async function getInstalledVersion()
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
			let stdout: string = "";
			let stderr: string = "";

			const exitCode = await exec.exec("orgflow", ["--version"], {
				ignoreReturnCode: true,
				listeners: {
					stdout: data => stdout += data.toString().trim(),
					stderr: data => stderr += data.toString().trim(),
				}
			});

			if (exitCode !== 0)
			{
				console.log(`'orgflow --version' failed with exit code ${exitCode}; CLI is likely not installed correctly. STDERR: ${stderr}`);
				return null;
			}

			console.log(`'orgflow --version' returned '${stdout}'.`);

			installedVersion = stdout;
		}
		catch (error)
		{
			console.log("Error while running 'orgflow --version'; CLI is likely not installed correctly.");
			console.log(error);
			return null;
		}
	}

	return installedVersion;
}

async function getLatestZipFileInfo(versionSpec: string, includePrerelease: boolean)
{
	console.log("Checking service for latest available version...");

	const runtimeId = getRuntimeId();
	const latestZipFileInfoUrl = new URL(`https://orgflow-dv2-apim.azure-api.net/download/v2/${productId}/${runtimeId}/latest/zip`);
	//let latestZipFileInfoUrl = `https://prod.orgflow.app/download/v2/${productId}/${runtimeId}/latest/zip`;

	if (versionSpec)
	{
		console.log(`Using version filter '${versionSpec}'.`);
		latestZipFileInfoUrl.searchParams.append("versionFilter", versionSpec);
	}

	if (includePrerelease)
	{
		console.log("Including prerelease versions in search.");
		latestZipFileInfoUrl.searchParams.append("includePrerelease", "true");
	}

	const response = await axios.get<FileInfo>(latestZipFileInfoUrl.href);
	const latestZipFileInfo = response.data;
	console.log(`Latest available version: ${latestZipFileInfo.versionString}`);

	return latestZipFileInfo;
}