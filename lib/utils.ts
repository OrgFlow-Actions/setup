import { arch, platform } from "os";

export function getRuntimeId()
{
	let os: string;
	switch (platform())
	{
		case "linux":
			os = "linux";
			break;
		case "darwin":
			os = "osx";
			break;
		case "win32":
			os = "win";
			break;
		default:
			throw new Error(`Unsupported platform '${platform()}'; OrgFlow supports only 'linux', 'darwin' and 'win32'.`);
	}

	let cpuArchitecture: string;
	switch (arch())
	{
		case "x64":
			cpuArchitecture = "x64";
			break;
		case "x32":
			cpuArchitecture = "x86";
			break;
		default:
			throw new Error(`Unsupported CPU architecture '${platform()}'; OrgFlow supports only 'x64' and 'x32'.`);
	}

	return `${os}-${cpuArchitecture}`;
}