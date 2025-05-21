import { spawn } from 'node:child_process'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { download } from '@vscode/test-electron'
import * as execa from 'execa'

import { run } from '../src/main'

vi.useFakeTimers()
vi.mock('node:child_process', () => ({
  spawn: vi.fn().mockReturnValue({ on: vi.fn() }),
}))
vi.mock('@vscode/test-electron', () => ({
  download: vi.fn().mockReturnValue('/path/to/code'),
}))
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ exitCode: 0 }),
}))

const processExit = process.exit.bind(process)
const globalSetTimeout = globalThis.setTimeout
beforeEach(() => {
  vi.mocked(spawn).mockClear()
  vi.mocked(download).mockClear()
  vi.mocked(execa.execa).mockClear()
  // @ts-expect-error - Mocking process.exit
  process.exit = vi.fn()
  // @ts-expect-error mock setTimeout
  globalThis.setTimeout = vi.fn((cb) => cb())
})

test('should continue build if timeout is reached', async () => {
  const execPromise = run()
  expect(download).toBeCalledTimes(1)
  expect(await execPromise).toBe(undefined)

  const calls = vi.mocked(execa.execa).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  expect(calls[0][1]?.[0]).toBe('--help')
  expect(process.exit).toBeCalledWith(0)
})

test('start server if machine gets authorised', async () => {
  vi.mocked(spawn).mockReturnValue({
    on: (_eventName: string, cb: (exitCode: number) => void) => cb(0),
  } as unknown as ReturnType<typeof spawn>)
  vi.mocked(globalThis.setTimeout).mockImplementation(
    (() => {}) as unknown as typeof setTimeout,
  )
  const execPromise = run()
  expect(download).toBeCalledTimes(1)
  await execPromise

  const calls = vi.mocked(execa.execa).mock.calls
  expect(calls.length).toBeGreaterThan(1)
  expect(calls[1][1]?.[0]).toBe('tunnel')
})

afterEach(() => {
  process.exit = processExit
  globalThis.setTimeout = globalSetTimeout
})
