'use strict'

const Test = require('ava')
const Sinon = require('sinon')
const Config = require('../../src/lib/config')
const Proxyquire = require('proxyquire')

let sandbox
let SetupStub

Test.beforeEach(() => {
  sandbox = Sinon.createSandbox()
  SetupStub = {
    initialize: sandbox.stub().returns(Promise.resolve())
  }
  process.argv = []
  Proxyquire.noPreserveCache() // enable no caching for module requires
})

Test.afterEach(() => {
  sandbox.restore()
  Proxyquire.preserveCache()
})

Test('Commander should start api Handler via api options', async test => {
  process.argv = [
    'node',
    'index.js',
    'server',
    '--api'
  ]
  const Index = Proxyquire('../../src/index', {
    './server': SetupStub
  })
  const initOptions = {
    port: Config.PORT,
    serviceName: 'ml-api'
  }
  test.pass(await Index)
  test.pass(SetupStub.initialize.calledWith(initOptions))
})

Test('Commander should start default Handler via default', async test => {
  process.argv = [
    'node',
    'index.js',
    'server'
  ]
  const Index = Proxyquire('../../src/index', {
    './server': SetupStub
  })
  const initOptions = {
    port: Config.PORT,
    serviceName: 'ml-api'
  }
  test.pass(await Index)
  test.pass(SetupStub.initialize.calledWith(initOptions))
})

Test('Commander should exit with invalid arg', async test => {
  // stub process.exit
  sandbox.stub(process, 'exit')

  const argv = [
    'node',
    'index.js'
  ]
  process.argv = argv
  const Index = Proxyquire('../../src/index', {
    './server': SetupStub
  })

  test.pass(await Index)
  test.falsy(SetupStub.initialize.called)
  test.pass(process.exit.called)
})

Test('Commander should exit with no args', async test => {
  // stub process.exit
  sandbox.stub(process, 'exit')

  const argv = []
  process.argv = argv
  const Index = Proxyquire('../../src/index', {
    './server': SetupStub
  })

  test.pass(await Index)
  test.falsy(SetupStub.initialize.called)
  test.pass(process.exit.called)
})
