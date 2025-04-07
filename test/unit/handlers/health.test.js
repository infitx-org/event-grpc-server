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

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 --------------
 ******/

'use strict'

const Test = require('ava')
const Mockgen = require('../../util/mockgen.js')
const Handler = require('../../../src/domain/metadata/health')
const Sinon = require('sinon')
const Logger = require('@mojaloop/central-services-logger')
const ProxyHelper = require('../../util/proxyHelper')

let sandbox
let server
let ServerOnlyWithEventSDKProxy
let ServerProxy

Test.serial.beforeEach(async () => {
  try {
    sandbox = Sinon.createSandbox()

    ServerOnlyWithEventSDKProxy = ProxyHelper.createServerOnlyWithEventSDKProxy(sandbox)
    ServerProxy = ServerOnlyWithEventSDKProxy.ServerProxy

    const initResult = await ServerProxy.initialize()
    server = initResult.server
  } catch (err) {
    Logger.isErrorEnabled && Logger.error(`beforeEach failed with error - ${err}`)
    throw err
  }
})

Test.serial.afterEach(async () => {
  try {
    sandbox.restore()
    await server.stop()
    sandbox = null
    server = null
    ServerOnlyWithEventSDKProxy = null
    ServerProxy = null
  } catch (err) {
    Logger.isErrorEnabled && Logger.error(`afterEach failed with error - ${err}`)
    throw err
  }
})

/**
 * summary: Get Health
 * description: The HTTP request GET /health is used to get the status of the server
 * parameters: type, currency, accept, content-type, date
 * produces: application/json
 * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
 */
Test.serial('test Health get operation', async function (t) {
  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/health',
      operation: 'get'
    }, function (error, mock) {
      return error ? reject(error) : resolve(mock)
    })
  })

  const mock = await requests
  t.pass(mock)
  t.pass(mock.request)
  // Get the resolved path from mock request
  // Mock request Path templates({}) are resolved using path parameters
  const options = {
    method: 'get',
    url: mock.request.path
  }
  if (mock.request.body) {
    // Send the request body
    options.payload = mock.request.body
  } else if (mock.request.formData) {
    // Send the request form data
    options.payload = mock.request.formData
    // Set the Content-Type as application/x-www-form-urlencoded
    options.headers = options.headers || {}
  }
  // If headers are present, set the headers.
  if (mock.request.headers && mock.request.headers.length > 0) {
    options.headers = mock.request.headers
  }
  const response = await server.inject(options)

  t.is(response.statusCode, 200, 'Ok response status')
})

Test.serial('test Health throws and error', async function (t) {
  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/health',
      operation: 'get'
    }, function (error, mock) {
      return error ? reject(error) : resolve(mock)
    })
  })
  const mock = await requests
  t.pass(mock)
  t.pass(mock.request)
  // Get the resolved path from mock request
  // Mock request Path templates({}) are resolved using path parameters
  const options = {
    method: 'get',
    url: mock.request.path
  }
  if (mock.request.body) {
    // Send the request body
    options.payload = mock.request.body
  } else if (mock.request.formData) {
    // Send the request form data
    options.payload = mock.request.formData
    // Set the Content-Type as application/x-www-form-urlencoded
    options.headers = options.headers || {}
  }
  // If headers are present, set the headers.
  if (mock.request.headers && mock.request.headers.length > 0) {
    options.headers = mock.request.headers
  }
  sandbox.stub(Handler, 'getHealth').throws(new Error('Error'))
  const response = await server.inject(options)

  t.is(response.statusCode, 400, 'Bad request error thrown')
})
