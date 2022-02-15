/*
** This module provides functionality to interact with the download service.
*/

import axios from "axios";
import { FileInfo } from "./types";
import { getRuntimeId } from "./utils";

const productId = "cli"; // Download service product identifier

export async function getLatestZipFileInfo(versionSpec: string, includePrerelease: boolean)
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

	const response = await axios.get<FileInfo>(latestZipFileInfoUrl.href, { validateStatus: status => status == 200 || status == 404 });
	if (response.status == 404)
	{
		throw new Error(`No available version matching version spec '${versionSpec}' was found in download service.`);
	}

	const latestZipFileInfo = response.data;
	console.log(`Latest available version: ${latestZipFileInfo.versionString}`);

	return latestZipFileInfo;
}