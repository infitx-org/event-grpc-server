/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * Georgi Georgiev <georgi.georgiev@modusbox.com>
 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 * Miguel de Barros <miguel.debarros@modusbox.com>
 --------------
 ******/

'use strict'

const Test = require('ava')
const Sinon = require('sinon')
const Logger = require('@mojaloop/central-services-logger')
const Util = require('util')
const RequestLogger = require('../../../src/lib/requestLogger')

let sandbox

Test.serial.beforeEach(() => {
  sandbox = Sinon.createSandbox()
  sandbox.stub(Logger, 'info')
  sandbox.stub(Logger, 'debug')
  sandbox.stub(Util, 'inspect')
})

Test.serial.afterEach(() => {
  sandbox.restore()
})

Test.serial('response should send info message to the serviceslogger', test => {
  const request = {
    headers: { traceid: '123456' },
    response: { source: 'this is the response', statusCode: '200' }
  }
  RequestLogger.logResponse(request)
  const args = Logger.isInfoEnabled && Logger.info.firstCall.args
  test.is(args[0], `Sidecar-Trace-Id=${request.headers.traceid} - Response: ${JSON.stringify(request.response.source)} Status: ${request.response.statusCode}`)
})

Test.serial('response should not send info message to the serviceslogger', test => {
  const request = {
    headers: { traceid: '123456' }
  }
  RequestLogger.logResponse(request)
  test.falsy(Logger.isInfoEnabled && Logger.info.called)
})

Test.serial('response should use util.inspect if JSON.stringify throws', test => {
  const request = {
    headers: { traceid: '123456' },
    response: { source: { body: 'this is the response' }, statusCode: '200' }
  }
  request.response.source.circular = request.response
  RequestLogger.logResponse(request)
  const args = Util.inspect.firstCall.args
  test.is(args[0], request.response.source)
})
