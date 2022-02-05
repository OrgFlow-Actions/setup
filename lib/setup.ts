import * as core from "@actions/core";
import * as cache from "@actions/tool-cache";
import * as io from "@actions/io";
import * as exec from "@actions/exec";
import axios from "axios";
import { FileInfo } from "./types";
import { getRuntimeId } from "./utils";

const productId = "cli"; // Download service product identifier
const toolName = "orgflow"; // GHA tool cache key

export async function install(versionSpec: string | null, includePrerelease: boolean)
{
	const runtimeId = getRuntimeId();
	let latestZipFileInfoUrl = new URL(`https://orgflow-dv2-apim.azure-api.net/download/v2/${productId}/${runtimeId}/latest/zip`);
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

	console.log("Checking service for latest version...");
	const response = await axios.get<FileInfo>(latestZipFileInfoUrl.href);
	const latestZipFileInfo = response.data;
	console.log(`Latest available version: ${latestZipFileInfo.versionString}`);

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

	console.log("Running 'orgflow --version' to verify installation...");

	let stdout = "";
	let stderr = "";
	const exitCode = await exec.exec("orgflow", ["--version"], {
		listeners: {
			stdout: data => stdout += data.toString().trim(),
			stderr: data => stderr += data.toString().trim(),
		}
	});

	if (exitCode !== 0)
	{
		throw new Error(`'orgflow --version' failed with exit code ${exitCode}; CLI was likely not installed correctly. STDERR: ${stderr}`);
	}
	else
	{
		console.log(`'orgflow --version' returned '${stdout}'.`);

		if (stdout != latestZipFileInfo.versionString)
		{
			throw new Error(`'orgflow --version' returned '${stdout}' but we expected '${latestZipFileInfo.versionString}; CLI was likely not installed correctly. STDERR: ${stderr}`);
		}
	}

	return stdout;
}
