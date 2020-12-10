import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as semver from 'semver';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
const cmp = require('semver-compare');

export async function getTfxCli(versionSpec: string, checkLatest: boolean) {
    if (isExplicitVersion(versionSpec)) {
        checkLatest = false;
    }
    // check for node
    const any_node_verion: string[] = tc.findAllVersions('node');
    if (any_node_verion.length == 0) {
        throw new Error('Unable to find Node! Please use actions/setup-node before colling this action.');
    }

    let toolPath: string;
    if (!checkLatest) {
        toolPath = tc.find('tfx', versionSpec)
    }

    if (!toolPath) {
        let version: string;
        if (isExplicitVersion(versionSpec)) {
            version = versionSpec;
        }
        else {
            version = await queryLatestMatch(versionSpec);
            if (!version) {
                throw new Error(`Unable to find Tfx version '${versionSpec}'`);
            }

            toolPath = tc.find('tfx', version);
        }

        if (!toolPath) {
            toolPath = await acquireTfx(version);
        }
    }
    if (os.platform() !== 'win32') {
        const probePaths = [toolPath, path.join(toolPath, '/bin'), path.join(toolPath, '/node_modules/.bin/')];
        toolPath = probePaths.find((probePath) => {
            return exist(path.join(probePath, '/tfx'));
        });
    }
    core.exportVariable('__tfxpath', toolPath);
}

function isExplicitVersion(versionSpec: string) {
    let c = semver.clean(versionSpec);
    core.debug('isExplicit: ' + c);

    let valid = semver.valid(versionSpec);
    core.debug('explicit? ' + valid);

    return valid;
}

async function queryLatestMatch(versionSpec: string): Promise<string> {
    let npmOutput = '';
    let npmError = '';

    const options: exec.ExecOptions = {};
    options.listeners = {
        stdout: (data: Buffer) => {
            npmOutput += data.toString();
        },

        stderr: (data: Buffer) => {
            npmError += data.toString();
        }
    };


    const result = await exec.exec('npm', ['show', 'tfx-cli', 'versions', '--json'], options);
    if (result === 0) {
        const versions: string[] = JSON.parse(npmOutput.trim());
        const version: string = evaluateVersions(versions, versionSpec);
        return version;
    }
    return "";
}

function evaluateVersions(versions: string[], versionSpec: string): string {
    let version: string;
    core.debug('evaluating ' + versions.length + ' versions');
    versions = versions.sort(cmp);
    for (let i = versions.length - 1; i >= 0; i--) {
        let potential: string = versions[i];
        let satisfied: boolean = semver.satisfies(potential, versionSpec);
        if (satisfied) {
            version = potential;
            break;
        }
    }

    if (version) {
        core.debug('matched: ' + version)
    }
    else {
        core.debug('match not found');
    }

    return version;
}

async function acquireTfx(version: string): Promise<string> {
    try {
        version = semver.clean(version);

        let extPath: string;
        extPath = process.env['RUNNER_TEMP'];
        if (!extPath) {
            throw new Error('Expected RUNNER_TEMP to be set.');
        }
        extPath = path.join(extPath, 'tfx');

        io.mkdirP(path.join(extPath));

        const result = await exec.exec('npm', ['install', 'tfx-cli@' + version, '-g', '--prefix', extPath]);
        if (result === 0) {
            if (os.platform() === 'win32') {
                fs.unlinkSync(path.join(extPath, '/tfx'))
            }
            return await tc.cacheDir(extPath, 'tfx', version);
        }
    }
    catch {
        return Promise.reject(new Error('Failed to install tfx'));
    }
}

function exist(path: string): boolean {
    var exist = false;
    try {
        exist = !!(path && fs.statSync(path) != null);
    }
    catch (err) {
        if (err && err.code === 'ENOENT') {
            exist = false;
        } else {
            throw err;
        }
    }
    return exist;
}