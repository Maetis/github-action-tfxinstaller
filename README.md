![build-test](https://github.com/Maetis/github-action-tfxinstaller/workflows/build-test/badge.svg)

# TfxInstaller for GitHub Actions

A simple port of the [TfxInstaller](https://github.com/microsoft/azure-devops-extension-tasks/tree/main/BuildTasks/TfxInstaller) task for Azure DevOps.

# Usage

See [action.yml](https://github.com/Maetis/github-action-tfxinstaller/blob/main/action.yml)

Basic:
```yaml
steps:
  - uses: actions/checkout@v2
  - uses: actions/setup-node@v1
  - uses: actions/TfxInstaller@v1
    with:
      version: 0.8.x
```
The `version` input allow to specify which tfx-cli version you want to use. Example: v0.8x, >=v0.5.x.

Check latest version:
```yaml
steps:
  - uses: actions/checkout@v2
  - uses: actions/setup-node@v1
  - uses: actions/TfxInstaller@v1
    with:
      version: 0.8.x
      checkLatest: true
```
`check-latest` flag automatically download the latest version of tfx-cli.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)