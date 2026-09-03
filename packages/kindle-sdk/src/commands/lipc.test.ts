import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'
import {
  enterScreensaver,
  getBatteryCharging,
  getBatteryLevel,
  listDocuments,
  openBook,
  setPreventScreenSaver,
  shellQuote,
} from './lipc.js'

describe('lipc commands', () => {
  it.effect('shellQuote handles numbers and strings with single quotes', () =>
    Effect.gen(function* () {
      assert.strictEqual(shellQuote(42), '42')
      assert.strictEqual(shellQuote("it's"), "'it'\\''s'")
    }))

  it.effect('setPreventScreenSaver toggles the flag', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        setPreventScreenSaver(true),
        'lipc-set-prop com.lab126.powerd preventScreenSaver 1'
      )
      assert.strictEqual(
        setPreventScreenSaver(false),
        'lipc-set-prop com.lab126.powerd preventScreenSaver 0'
      )
    }))

  it.effect('getBatteryLevel returns the correct command', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        getBatteryLevel(),
        'lipc-get-prop -i com.lab126.powerd battLevel'
      )
    }))

  it.effect('getBatteryCharging returns the correct command', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        getBatteryCharging(),
        'lipc-get-prop -i com.lab126.powerd isCharging'
      )
    }))

  it.effect('enterScreensaver returns the combined command', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        enterScreensaver(),
        'lipc-set-prop com.lab126.powerd serverToActive 1 && lipc-set-prop com.lab126.powerd preventScreenSaver 0'
      )
    }))

  it.effect('openBook quotes the book path', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        openBook('/mnt/us/documents/foo.epub'),
        "lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.kindle?param='/mnt/us/documents/foo.epub'"
      )
    }))

  it.effect('listDocuments quotes the folder and filters extensions', () =>
    Effect.gen(function* () {
      assert.strictEqual(
        listDocuments('/mnt/us/documents'),
        "find '/mnt/us/documents' -maxdepth 1 -type f \\( -name '*.azw' -o -name '*.azw3' -o -name '*.mobi' -o -name '*.epub' -o -name '*.pdf' \\) -print"
      )
    }))
})
