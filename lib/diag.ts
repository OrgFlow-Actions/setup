/*
** This module provides functionality related to OrgFlow diagnostic bundles and logs.
*/

import * as core from "@actions/core";
import * as io from "@actions/io";
import * as artifact from "@actions/artifact";
import * as path from "path";

const tempDirPath = process.env.RUNNER_TEMP || process.env.TMPDIR;
const artifactRootPath = path.join(tempDirPath, "OrgFlow");
const artifactName = "OrgFlowDiagnostics";

if (!tempDirPath)
{
	throw new Error("No temp directory path was found in RUNNER_TEMP or TMPDIR env variables.");
}

const logDirPath = path.join(artifactRootPath, "logs");
const bundleDirPath = path.join(artifactRootPath, "bundles")

console.log(`Diagnostic log directory: ${logDirPath}`);
console.log(`Diagnostic bundle directory: ${bundleDirPath}`);

export function setDiagnostics(logFileName: string, logLevel: string)
{
	io.mkdirP(logDirPath);
	io.mkdirP(bundleDirPath);

	core.exportVariable("ORGFLOW_DIAGNOSTICBUNDLEMODE", "always");
	core.exportVariable("ORGFLOW_DIAGNOSTICSFILEDIRECTORYPATH", bundleDirPath);
	const logFilePath = path.join(logDirPath, logFileName);
	core.exportVariable("ORGFLOW_LOGFILEPATH", logFilePath);
	core.exportVariable("ORGFLOW_LOGLEVEL", logLevel);
}

export async function uploadDiagnosticsArtifact()
{
	const client = artifact.create();
	await client.uploadArtifact(artifactName, [bundleDirPath, logDirPath], artifactRootPath, { continueOnError: true });
}