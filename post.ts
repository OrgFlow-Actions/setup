/*
** This module is the action's post-job entry point.
*/

import * as core from "@actions/core";
import { uploadDiagnosticsArtifact } from "./lib/diag";

export async function run()
{
	try
	{
		const uploadArtifact =
			core.getInput("upload-diag-artifact") ? // getBooleanInput() will throw if input is not present, so guard against that
				core.getBooleanInput("upload-diag-artifact") :
				true;

		const artifactName = core.getInput("diag-artifact-name");

		if (uploadArtifact)
		{
			await uploadDiagnosticsArtifact(artifactName);
		}
	}
	catch (error)
	{
		core.setFailed(error.message);
	}
}

run();