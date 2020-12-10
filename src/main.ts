import * as core from '@actions/core'
import * as installer from './installer'

async function run(): Promise<void> {
  try {
    const version: string = core.getInput('version')
    const checkLatest: boolean =
      core.getInput('checkLatest').toLowerCase() == 'true'
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
