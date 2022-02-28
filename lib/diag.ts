/*
** This module provides functionality related to OrgFlow diagnostic bundles and logs.
*/

import * as core from "@actions/core";
import * as io from "@actions/io";
import * as artifact from "@actions/artifact";
import * as exec from "@actions/exec";
import * as path from "path";
import { readdir } from "fs/promises";

const tempDirPath = process.env.RUNNER_TEMP || process.env.TMPDIR;
const artifactRootPath = path.join(tempDirPath, "OrgFlow");
const artifactName = "OrgFlowDiagnostics";

if (!tempDirPath)
{
	throw new Error("No temp directory path was found in RUNNER_TEMP or TMPDIR env variables.");
}

const logDirPath = path.join(artifactRootPath, "logs");
const bundleDirPath = path.join(artifactRootPath, "bundles")

core.debug(`Diagnostic log directory: ${logDirPath}`);
core.debug(`Diagnostic bundle directory: ${bundleDirPath}`);

export function setDiagnostics(logFileName: string, logLevel: string)
{
	io.mkdirP(logDirPath);
	io.mkdirP(bundleDirPath);

	const logFilePath = path.join(logDirPath, logFileName);

	core.debug(`Setting ORGFLOW_DIAGNOSTICSFILEDIRECTORYPATH=${bundleDirPath}`);
	core.debug(`Setting ORGFLOW_LOGFILEPATH=${logFilePath}`);

	core.exportVariable("ORGFLOW_DIAGNOSTICBUNDLEMODE", "always");
	core.exportVariable("ORGFLOW_DIAGNOSTICSFILEDIRECTORYPATH", bundleDirPath);
	core.exportVariable("ORGFLOW_LOGFILEPATH", logFilePath);
	core.exportVariable("ORGFLOW_LOGLEVEL", logLevel);
}

export async function uploadDiagnosticsArtifact()
{
	const { stdout } = await exec.getExecOutput("ls", ["-R", artifactRootPath], { silent: true });

	core.debug(`Recursive contents of artifact root path '${artifactRootPath}':`);
	core.debug(stdout);

	const artifactFiles = [...await readdir(bundleDirPath), ...await readdir(logDirPath)];

	if (artifactFiles.length)
	{
		core.debug(`Uploading ${artifactFiles.length} artifact files: ${artifactFiles.join(", ")}`);
		const client = artifact.create();
		await client.uploadArtifact(artifactName, artifactFiles, artifactRootPath, { continueOnError: true });
	}
	else
	{
		core.debug("No artifact files no upload.");
	}
}