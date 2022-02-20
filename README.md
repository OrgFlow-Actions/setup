# OrgFlow: Salesforce DevOps for GitHub

<p><img src="logo.svg" alt="OrgFlow Logo" width="200"/></p>

OrgFlow is a cross-platform DevOps tool that opens the Salesforce platform up to modern software development, version control, deployment and automation techniques.

More information about OrgFlow:

- Website: https://www.orgflow.io
- Documentation: https://docs.orgflow.io
- Blog: https://medium.com/orgflow

This action installs and configures OrgFlow on a GitHub Actions runner so that OrgFlow commands can be executed as normal shell script commands in subsequent steps. This allows you to use OrgFlow from GitHub Actions to build your Salesforce DevOps pipeline and manage your deployments from GitHub.

The following configuration steps can be performed by this action:

1. Download OrgFlow
2. Install OrgFlow and add it to `PATH`
3. Validate and save your license key
4. Save Salesforce credentials
5. Configure Git authentication and committer signature
6. Set default stack

Running this action at the start of your workflow job allows you to run any OrgFlow commands with minimal hassle in subsequent steps of your job, without having to provide any of the above configuration again.

## Supported platforms

This action works on:

- GitHub-hosted runners and self-hosted runners
- Ubuntu, macOS and Windows
- The `orgflow/cli` Docker image, or your own Docker image

For self-hosted runners and third-party Docker containers, Git version 2.25 or later is required. When running on GitHub-hosted runners or our Docker images, all requirements are already met.

## Inputs

| Name                  | Required? | Default                         | Description                                                                                                                                                                      |
| --------------------- | --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`             |           |                                 | Version of OrgFlow to install. Can be specified as major '1', minor '1.1' or patch '1.1.1'; latest matching version will be installed. Omit to install latest available version. |
| `include-prerelease`  |           | `"false"`                       | Include prerelease versions when determining latest available version.                                                                                                           |
| `skip-install`        |           | `"false"`                       | Don't download and install OrgFlow (i.e. assume OrgFlow is already installed).                                                                                                   |
| `license-key`         | Yes       |                                 | Your OrgFlow license key (you can get one at https://www.orgflow.io/trial if you do not already have one).                                                                       |
| `salesforce-username` |           |                                 | Save username for connecting to production Salesforce org (stored on runner in encrypted form).                                                                                  |
| `salesforce-password` |           |                                 | Save password for connecting to production Salesforce org (stored on runner in encrypted form).                                                                                  |
| `git-username`        |           |                                 | Save username for connecting to remote Git repository (not needed if connecting to a GitHub repository).                                                                         |
| `git-password`        |           |                                 | Save access token or password for connecting to remote Git repository (use 'secrets.GITHUB_TOKEN' if connecting to the current repository).                                      |
| `git-committer-name`  |           | `"OrgFlow Default Committer"`   | Set name to use in committer signature when committing changes to Git repository.                                                                                                |
| `git-committer-email` |           | `"defaultcommitter@orgflow.io"` | Set email address to use in committer signature when committing changes to Git repository.                                                                                       |
| `stack-name`          |           |                                 | Name of OrgFlow stack to save credentials for (required when saving Salesforce or Git credentials).                                                                              |

## Outputs

| Name             | Description                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| `version`        | Exact version of OrgFlow that was installed and/or configured.                       |
| `encryption-key` | Encryption key that was created and used to encrypt Salesforce credentials (if set). |

## Examples

Install latest version and run a simple command to list all the current stacks in your OrgFlow account:

```yaml
jobs:
  orgflow_job:
    runs-on: ubuntu-latest
    steps:
      # Download and install latest version
      - uses: orgflow-actions/setup@v1
        with:
          license-key: ${{ secrets.ORGFLOW_LICENSEKEY }}
        env:
          ORGFLOW_ACCEPTEULA: "true"
      # Run command to list stacks in your account
      - run: orgflow stack:list
```

Install latest 1.3.x version, save Salesforce credentials and flow metadata changes from one sandbox environment to another:

```yaml
jobs:
  orgflow_job:
    runs-on: ubuntu-latest
    steps:
      # Download and install latest 1.3.x version
      - uses: orgflow-actions/setup@v1
        with:
          version: "1.3"
          license-key: ${{ secrets.ORGFLOW_LICENSEKEY }}
          salesforce-username: ${{ secrets.SALESFORCE_USERNAME }}
          salesforce-password: ${{ secrets.SALESFORCE_PASSWORD }}
          stack-name: MyStack
        env:
          ORGFLOW_ACCEPTEULA: "true"
      # Run command to flow changes from Dev sandbox into QA sandbox
      - run: orgflow env:flowmerge --from=Dev --into=QA
```

Please refer to the [command reference page](https://docs.orgflow.io/reference/commands/help.html) in our docs for a complete list of available OrgFlow commands that you can use in your workflow.

## License key

Your license key acts as your OrgFlow authentication mechanism, and allows your GitHub Actions workflows to access your OrgFlow account containing all the information about your stacks and environments and their current state. Your license key also validates your right to use the product for as many stacks and Salesforce orgs as are included in your license.

**You can try OrgFlow completely free for 2 months** - no limits, no strings attached, and no credit card required. To obtain a free trial license key, simply visit https://www.orgflow.io/trial and enter your email address, and a trial license key for 2 months of unlimited use will be sent to you in email.

A license key is required for all OrgFlow operations. By providing your license key to this action using the `license-key` input, your license key is validated and then saved locally on the runner so that you do not need to provide it on subsequent steps.

Alternatively, you are prompted to request a trial license the first time you run OrgFlow from a local interactive terminal session.

**Please use a secret to store your license key!**

## Environment variables

The environment variable `ORGFLOW_ACCEPTEULA` is required to be present with the value `true` when running this action. Setting this environment variable constitutes your acceptance of our End-User License Agreement (EULA) which is available in full at https://www.orgflow.io/eula/cli. You do not need to provide this environment variable in subsequent steps.

OrgFlow also supports several other environment variables for advanced configuration scenarios. Please refer to the [configuration reference page](https://docs.orgflow.io/reference/configuration.html) in our docs for more information.

## Skipping download and installation

You can use the input `skip-install: "true"` to bypass downloading and installing OrgFlow on the runner.

This can be useful in scenarios where you know that the correct version of OrgFlow is already installed, such as:

- When running your job on our `orgflow/cli` Docker image
- When running your job on a self-hosted runner where you have already installed OrgFlow

## Salesforce authentication

OrgFlow needs a Salesforce username and password to interact with your Salesforce environment (e.g. to retrieve and deploy metadata, create and delete sandboxes, etc). In most cases, OrgFlow needs only the username and password for your **production** org, and can infer the correct credentials for any sandbox based on that.

There are two ways to manage Salesforce authentication for your GitHub Actions workflows:

### 1. Store Salesforce credentials as secrets in GitHub Actions

This is the simpler option, and is recommended if you intend to drive your DevOps pipeline primarily from GitHub.

Use the following inputs to this action to save the Salesforce credentials in encrypted form locally on the runner so that subsequent OrgFlow commands can authenticate with your Salesforce environments transparently:

```yaml
with:
  salesforce-username: ${{ secrets.SALESFORCE_USERNAME }}
  salesforce-password: ${{ secrets.SALESFORCE_PASSWORD }}
  stack-name: SomeStack
```

### 2. Store Salesforce credentials in OrgFlow's state store

This option is slighly more advanced and flexible, and can be useful if you want to use the stored Salesforce credentials both in CI/CD pipelines and during manual use in local terminal sessions, particularly across many different client devices and/or different users.

To use this option, use the [`auth:salesforce:save`](https://docs.orgflow.io/reference/commands/auth-salesforce-save.html) command in a local terminal session to encrypt and store your Salesforce credentials in the state store. Be sure to make note of the encryption key so that you can make it available as a secret to your workflows.

With this option, you do not use the `salesforce-username` and `salesforce-password` with this action, but instead you must provide your encryption key as an argument to OrgFlow commands in your workflow to allow them to fetch and decrypt the Salesforce credentials from the state store and authenticate with your Salesforce environments transparently. Example:

```yaml
steps:
  - run: orgflow env:flowmerge --from=Dev --into=QA --encryptionKey=${{ secrets.ORGFLOW_ENCRYPTIONKEY }}
```

## Git authentication

OrgFlow uses a remote Git repository in order to store your Salesforce metadata, create branches, commit and push metadata changes, etc. While is common (and recommended) to keep the workflows that drive your Salesforce DevOps pipeline in the same repository as your actual Salesforce metadata, this is not a requirement. You can use any standard Git repository for this purpose, as long as it is reachable by the runner.

You configure which Git repository URL to use for metadata version control when you create your stack using the [`stack:create`](https://docs.orgflow.io/reference/commands/stack-create.html) command, which you normally run in a local terminal session as a one-time setup before building out your GitHub Actions based DevOps pipeline.

**If your workflow runs in the same GitHub repository where you keep your Salesforce metadata, then you do not have to take any additional steps to set up Git authentication.**

However, if your Salesforce metadata is kept in a different Git repository, then you can use the following inputs to this action to save the Git credentials in encrypted form locally on the runner so that subsequent OrgFlow commands can authenticate with your remote Git repository transparently:

```yaml
with:
  git-username: ${{ secrets.GIT_USERNAME }}
  git-password: ${{ secrets.GIT_PASSWORD }}
  stack-name: SomeStack
```

For most public Git services such as GitHub, Azure Repos, BitBucket etc., you would issue a _personal access token_ (PAT) and use this as the `git-password` input while omitting the `git-username` input.

**Please use secrets to store your Git credentials!**

## Other actions

We also maintain several other useful actions, which complement this one to provide deep first-class integration of OrgFlow into GitHub Actions:

- [`comment-env-flowout-result`](https://github.com/OrgFlow-Actions/comment-env-flowout-result)

## Versioning

All of our `orgflow-actions/*` actions are semantically versioned. Breaking changes will cause a major version bump.

All releases are tagged with a full version number, e.g. `v1.0.0`. You can use these tags to pin your workflow to a specific release, e.g. `@v1.0.0`.

We also maintain branches for each major version of our actions, and you can reference branch names to ensure that you are using the most up to date version of this action for a specific major version. For example `@v1` would cause your workflow to automatically use the most up to date `v1.x.x` version of this action.

## Troubleshooting

### Workflow logs

To enable more detailed log output from this action, enable **step debug logs** for your workflow by adding the secret `ACTIONS_STEP_DEBUG` with the value `true`. You can also enable **runner debug logs** by adding the secret `ACTIONS_RUNNER_DEBUG` with the value `true`.

More information here:
https://github.com/actions/toolkit/blob/main/docs/action-debugging.md

### OrgFlow log file

After downloading and installing OrgFlow, this action invokes the OrgFlow CLI several times to carry out different aspects of configuration, depending on the input values you specify. OrgFlow verbose logs are written to `/tmp/OrgFlow/setup.log` during these invocations. If this action fails with a non-zero exit code, this log file is uploaded and added as an artifact to your workflow run to aid in troubleshooting.

OrgFlow verbose logs are also written to the same path `/tmp/OrgFlow/setup.log` by any subsequent OrgFlow commands you run in your workflow job after running this action. To help diagnose issues in your workflow post-setup, you can use the `actions/upload-artifact@v2` action yourself to upload the OrgFlow verbose log file as an artifact that you can then download and inspect in order to troubleshoot your workflow.
