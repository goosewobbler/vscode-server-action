import { resolve, dirname } from 'node:path'
import { platform } from 'node:os'
import { execa } from 'execa'

import { download } from '@vscode/test-electron'
import { getInput } from '@actions/core'

const nodePath = resolve(process.argv[1])

const getCodePath = async (): Promise<string> => {
  const electronPath = await download({ version: 'stable' })

  if (platform() === 'darwin') {
    return resolve(electronPath, '..', '..', 'Resources', 'app', 'bin', 'code')
  }

  if (platform() === 'win32') {
    return resolve(dirname(electronPath), 'bin', 'code.cmd')
  }

  return resolve(dirname(electronPath), 'bin', 'code')
}

export const run = async (): Promise<void> => {
  /**
   * name of the machine to access
   */
  const machineId = (
    getInput('machineName') ||
    process.env.GITHUB_RUN_ID ||
    `machine-${Date.now()}`
  ).slice(0, 20)

  /**
   * The time until the action continues the build of the machine
   * does not get authorised
   */
  const timeout = Number.parseInt(getInput('timeout'), 10) || 30 * 1000 // default 30s

  /**
   * download latest VS Code
   */
  const codePath = await getCodePath()

  /**
   * name the machine as an individual command so that we don't
   * get prompt when launching the server
   */
  console.log(
    'RUN',
    codePath,
    ['tunnel', '--accept-server-license-terms', 'rename', machineId].join(' '),
  )
  await execa(codePath, ['--help'])
  const startServer = await Promise.race([
    new Promise((resolve) => setTimeout(() => resolve(false), timeout)),
    execa(codePath, [
      'tunnel',
      '--accept-server-license-terms',
      'rename',
      machineId,
    ]).then(() => true),
  ])

  console.log(5)
  if (!startServer) {
    console.log('Timeout reached, continuing the build')
    return process.exit(0)
  }

  console.log(6)
  await execa(codePath, ['tunnel', '--accept-server-license-terms'], {
    stdio: [process.stdin, process.stdout, process.stderr],
  })
}

/**
 * only run action if module is called through Node
 */
if (nodePath.endsWith('index.js')) {
  await run()
}
