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
3. Configure diagnostic logging
4. Validate and save your license key
5. Save Salesforce credentials
6. Configure Git authentication and committer signature
7. Set default stack
8. Upload diagnostic log files and bundles as artifacts during post-job processing

Running this action at the start of your workflow job allows you to run any OrgFlow commands with minimal hassle in subsequent steps of your job, without having to provide any of the above configuration again.

See also:

- Our [`demo`](https://github.com/OrgFlow-Actions/demo) template repository that contains a set of basic sample workflows that show how to use OrgFlow in GitHub Actions
- Our [`result-to-comment`](https://github.com/OrgFlow-Actions/result-to-comment) action which allows you to post the results of an OrgFlow command as a comment on a GitHub issue or pull request

## Supported platforms

This action works on:

- GitHub-hosted runners and self-hosted runners
- Ubuntu, macOS and Windows
- With or without a container (also works with the `orgflow/cli` Docker image)

Git version 2.25 or later is required. When running on GitHub-hosted runners or on our Docker images, all requirements are met.

## Inputs

| Name                   | Required? | Default                                                    | Description                                                                                                                                                                       |
| ---------------------- | :-------: | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`              |           |                                                            | Version of OrgFlow to install. Can be specified as major '1', minor '1.1' or patch '1.1.1'; latest matching version will be installed (omit to install latest available version). |
| `include-prerelease`   |           | `false`                                                    | Set to 'true' to include prerelease versions when determining latest available version.                                                                                           |
| `skip-install`         |           | `false`                                                    | Don't download and install OrgFlow (i.e. assume OrgFlow is already installed).                                                                                                    |
| `license-key`          |  **Yes**  |                                                            | Your OrgFlow license key (you can get one at https://www.orgflow.io/trial if you do not already have one).                                                                        |
| `salesforce-username`  |           |                                                            | Save username for connecting to production Salesforce org (stored on runner in encrypted form).                                                                                   |
| `salesforce-password`  |           |                                                            | Save password for connecting to production Salesforce org (stored on runner in encrypted form).                                                                                   |
| `git-username`         |           |                                                            | Save username for connecting to remote Git repository (not needed if connecting to a GitHub repository).                                                                          |
| `git-password`         |           |                                                            | Save access token or password for connecting to remote Git repository (use `secrets.GITHUB_TOKEN` if connecting to the current repository).                                       |
| `git-committer-name`   |           | `OrgFlow Default Committer`                                | Set name to use in committer signature when committing changes to Git repository.                                                                                                 |
| `git-committer-email`  |           | `defaultcommitter@orgflow.io`                              | Set email address to use in committer signature when committing changes to Git repository.                                                                                        |
| `stack-name`           |           |                                                            | Name of OrgFlow stack to save credentials for (required when saving Salesforce or Git credentials).                                                                               |
| `encryption-key`       |           |                                                            | Encryption key to use when encrypting and decrypting Salesforce and/or Git credentials (omit to generate a new encryption key).                                                   |
| `log-file-name`        |           | `{C}-{T:yyyyMMdd-HHmmss-FFF}.log`                          | Name (optionally tokenized) of OrgFlow diagnostic log files.                                                                                                                      |
| `log-level`            |           | `verbose`                                                  | Verbosity level for OrgFlow diagnostic log files (verbose, debug, information, warning, error or fatal).                                                                          |
| `upload-diag-artifact` |           | `true`                                                     | Set to 'false' to disable uploading of all OrgFlow diagnostic log files and bundles during post-job processing.                                                                   |
| `diag-artifact-name`   |           | `orgflow_diag_${{ github.job }}_${{ github.run_attempt }}` | Name to use for the artifact when uploading OrgFlow diagnostic log files and bundles.                                                                                             |

## Outputs

| Name             | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| `version`        | Exact version of OrgFlow that was installed and/or configured. |
| `encryption-key` | Encryption key that was saved.                                 |

## Examples

See our [demo repository](https://github.com/OrgFlow-Actions/demo) for a set of complete sample workflows using this action. There you will also find a guided tutorial on how to set up a working end-to-end Salesforce DevOps pipeline using GitHub Actions.

Below are some very basic examples.

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

Install latest 2.0.x version, save Salesforce credentials and flow metadata changes from one sandbox environment to another:

```yaml
jobs:
  orgflow_job:
    runs-on: ubuntu-latest
    steps:
      # Download and install latest 2.0.x version
      - uses: orgflow-actions/setup@v1
        with:
          version: "2.0"
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
steps:
  - uses: orgflow-actions/setup@v1
    with:
      # Store Salesforce credentials encrypted on the runner:
      salesforce-username: ${{ secrets.SALESFORCE_USERNAME }}
      salesforce-password: ${{ secrets.SALESFORCE_PASSWORD }}
      stack-name: SomeStack
  # OrgFlow can now authenticate to Salesforce transparently:
  - run: orgflow env:flowin --environment=SomeEnvironment
```

### 2. Store Salesforce credentials in OrgFlow's state store

This option is slighly more advanced and flexible, and can be useful if you want to use the stored Salesforce credentials both in CI/CD pipelines and during manual use in local terminal sessions, particularly across many different client devices and/or different users.

To use this option, use the [`auth:salesforce:save`](https://docs.orgflow.io/reference/commands/auth-salesforce-save.html) command in a local terminal session to encrypt and store your Salesforce credentials in the state store. Be sure to make note of the encryption key so that you can make it available as a secret to your workflows.

With this option, you do not use the `salesforce-username` and `salesforce-password` with this action, but instead you provide your existing encryption key using the `encryption-key` input. This key is then saved on the runner, allowing subsequent OrgFlow commands in your workflow to fetch and decrypt Salesforce credentials from the state store and authenticate with your Salesforce environments transparently. Example:

```yaml
steps:
  - uses: orgflow-actions/setup@v1
    with:
      # Provide your own encryption key:
      encryption-key: ${{ secrets.ORGFLOW_ENCRYPTIONKEY }}
      stack-name: SomeStack
  # OrgFlow can now authenticate to Salesforce transparently:
  - run: orgflow env:flowin --environment=SomeEnvironment
```

**Remember to use secrets to store any Salesforce credentials or encryption keys!**

## Git authentication

OrgFlow uses a Git repository in order to store your Salesforce metadata, create branches, commit and push metadata changes, etc. While it's common (and recommended) to keep the workflows that drive your Salesforce DevOps pipeline in the same repository as your actual Salesforce metadata, this is not a requirement. You can use any standard Git repository for this purpose, as long as it is reachable by the runner.

You configure which Git repository URL to use for metadata version control when you create your stack using the [`stack:create`](https://docs.orgflow.io/reference/commands/stack-create.html) command, which you normally run in a local terminal session as a one-time setup before building out your GitHub Actions based DevOps pipeline.

**If your workflow runs in the same GitHub repository where you keep your Salesforce metadata, you do not have to specify any Git credentials yourself.** This action will default to using the `GITHUB_TOKEN` secret automatically provided by GitHub to set up authentication against the repository. The access level granted by this token is subject to the security configuration of your repository.

However, if your Salesforce metadata is kept in a different Git repository, then you can use the following inputs to this action to save the Git credentials in encrypted form locally on the runner so that subsequent OrgFlow commands can authenticate with your remote Git repository transparently:

```yaml
steps:
  - uses: orgflow-actions/setup@v1
    with:
      # Provide credentials for your Git repo:
      git-username: ${{ secrets.GIT_USERNAME }}
      git-password: ${{ secrets.GIT_PASSWORD }}
      stack-name: SomeStack
  # OrgFlow can now authenticate to Git transparently:
  - run: orgflow env:flowin --environment=SomeEnvironment
```

For most public Git services such as GitHub, Azure Repos, BitBucket etc., you would issue a _personal access token_ (PAT) and use this as the `git-password` input while omitting the `git-username` input.

**Remember to use secrets to store your Git credentials!**

## Versioning

All of our `orgflow-actions/*` actions are semantically versioned. Breaking changes will cause a major version bump.

All releases are tagged with a full version number, e.g. `v1.1.0`. You can use these tags to pin your workflow to a specific release, e.g. `@v1.1.0`.

We also maintain branches for each major version of our actions, and you can reference branch names to ensure that you are using the most up to date version of this action for a specific major version. For example `@v1` would cause your workflow to automatically use the most up to date `v1.x.x` version of this action.

## Troubleshooting

### Workflow logs

To enable more detailed log output from this action, enable **step debug logs** for your workflow by adding the secret `ACTIONS_STEP_DEBUG` with the value `true`. You can also enable **runner debug logs** by adding the secret `ACTIONS_RUNNER_DEBUG` with the value `true`.

More information here:
https://github.com/actions/toolkit/blob/main/docs/action-debugging.md

## OrgFlow diagnostic logs

This action enables and configures OrgFlow diagnostic logging, both for this action and for all subsequent OrgFlow commands you run in your job. By default the log level is set to `verbose`, and a separate log file is written for each OrgFlow command executed throughout your job, based on the command name and time using the log file name pattern `"{C}-{T:yyyyMMdd-HHmmss-FFF}.log"`. The exception is log output collected during the setup action itself, which is instead written to `"setup.log"`.

You can override the naming of diagnostic log files using the `log-file-name` and `log-level` inputs. The `log-file-name` input supports several tokens you can use to base log file names on values only known at runtime. Please refer to the [logging section in our documentation](https://docs.orgflow.io/troubleshooting/logging.html) for more information about specifying log file names and log level.

This action also contains a post-job step that collects all OrgFlow diagnostic log files and bundles written throughout your whole job, and uploads them as an artifact on your workflow run named `orgflow_diag_<job>_<attempt>`. This can be very useful during troubleshooting. You can change the artifact name using the input `diag-artifact-name`. If you wish to disable the uploading of this artifact for any reason, you can do so by specifying `upload-diag-artifact: "false"` as an input to this action.
