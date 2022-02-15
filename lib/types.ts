/*
** This module provides reusable types.
*/

export interface FileInfo
{
	fullName: string,
	downloadUrl: string,
	productId: string,
	versionString: string,
	version: {
		major: number,
		minor: number,
		patch: number,
		prerelease: string,
		build: string
	},
	runtimeId: string;
	format: string;
}