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
 - Valentin Genev <valentin.genev@modusbox.com>
 --------------
 ******/

'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')
const Path = require('path')
const HapiOpenAPI = require('hapi-openapi')
const Mockgen = require('../../util/mockgen.js')
const KafkaUtil = require('../../../src/lib/kafka/util')
const eventHandler = require('../../../src/domain/event/handler')
const Sinon = require('sinon')
const Logger = require('@mojaloop/central-services-logger')
const Initialise = require('../../../src/server').initialize

const getPort = async () => (await import('get-port')).default()

const payload = {
  from: 'noresponsepayeefsp',
  to: 'payerfsp',
  id: 'aa398930-f210-4dcd-8af0-7c769cea1660',
  content: {
    headers: {
      'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
      date: '2019-05-28T16:34:41.000Z',
      'fspiop-source': 'noresponsepayeefsp',
      'fspiop-destination': 'payerfsp'
    },
    payload: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJmdWxmaWxtZW50IjogIlVObEo5OGhaVFlfZHN3MGNBcXc0aV9VTjN2NHV0dDdDWkZCNHlmTGJWRkEiLAogICJjb21wbGV0ZWRUaW1lc3RhbXAiOiAiMjAxOS0wNS0yOVQyMzoxODozMi44NTZaIiwKICAidHJhbnNmZXJTdGF0ZSI6ICJDT01NSVRURUQiCn0'
  },
  type: 'application/json',
  metadata: {
    event: {
      id: '3920382d-f78c-4023-adf9-0d7a4a2a3a2f',
      type: 'trace',
      action: 'start',
      createdAt: '2019-05-29T23:18:32.935Z',
      state: {
        status: 'success',
        code: 0,
        description: 'action successful'
      },
      responseTo: '1a396c07-47ab-4d68-a7a0-7a1ea36f0012'
    },
    trace: {
      service: 'central-ledger-prepare-handler',
      traceId: 'bbd7b2c7-3978-408e-ae2e-a13012c47739',
      parentSpanId: '4e3ce424-d611-417b-a7b3-44ba9bbc5840',
      spanId: 'efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87',
      timestamp: '2015-08-29T11:22:09.815479Z'
    }
  }
}

/**
 * summary: POST Event
 * description: The HTTP request POST /event is used to get the status of the server
 * parameters: type, currency, accept, content-type, date
 * produces: application/json
 * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
 */
Test.serial('test Event throws and error', async function (t) {
  const sandbox = Sinon.createSandbox()
  const server = new Hapi.Server()
  await server.register({
    plugin: HapiOpenAPI,
    options: {
      api: Path.resolve(__dirname, '../../../src/interface/swagger.json'),
      handlers: Path.join(__dirname, '../../../src/handlers'),
      outputvalidation: false
    }
  })
  await server.ext([
    {
      type: 'onPreResponse',
      method: (request, h) => {
        if (!request.response.isBoom) {
          Logger.isInfoEnabled && Logger.info(request.response)
        } else {
          const error = request.response
          error.message = {
            errorInformation: {
              errorCode: error.statusCode,
              errorDescription: error.message,
              extensionList: [{
                key: '',
                value: ''
              }]
            }
          }
          error.reformat()
        }
        return h.continue
      }
    }
  ])
  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/event',
      operation: 'post'
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
    method: 'post',
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
  sandbox.stub(eventHandler, 'handleRestRequest').throws(new Error('Error'))
  const response = await server.inject(options)
  await server.stop()
  t.is(response.statusCode, 400, 'Bad request error thrown')
  sandbox.restore()
})

Test.serial('test Event processes correctly', async function (t) {
  const sandbox = Sinon.createSandbox()
  const server = new Hapi.Server()
  await server.register({
    plugin: HapiOpenAPI,
    options: {
      api: Path.resolve(__dirname, '../../../src/interface/swagger.json'),
      handlers: Path.join(__dirname, '../../../src/handlers'),
      outputvalidation: true
    }
  })
  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/event',
      operation: 'post'
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
    method: 'post',
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
  sandbox.stub(KafkaUtil, 'produceGeneralMessage').returns(Promise.resolve(true))
  const response = await server.inject(options)
  await server.stop()
  t.is(response.statusCode, 201, 'Success')
  sandbox.restore()
})

Test.serial('test Event throws error and is handled correctly', async function (t) {
  const sandbox = Sinon.createSandbox()

  const port = await getPort()
  const { server, grpcServer } = await Initialise(port)
  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/event',
      operation: 'post'
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
    method: 'post',
    url: '/event'
  }
  mock.request = {
    body: payload
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
  sandbox.stub(KafkaUtil, 'produceGeneralMessage').throwsException('Error')
  const response = await server.inject(options)
  await server.stop()
  grpcServer.server.forceShutdown()
  t.is(response.statusCode, 400, 'Error thrown')
  sandbox.restore()
})

Test.serial('test Event processes and response is logged correctly', async function (t) {
  const sandbox = Sinon.createSandbox()

  const port = await getPort()
  const { server, grpcServer } = await Initialise(port)
  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/event',
      operation: 'post'
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
    method: 'post',
    url: '/event'
  }
  mock.request = {
    body: payload
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
  sandbox.stub(KafkaUtil, 'produceGeneralMessage').returns(Promise.resolve(true))
  const response = await server.inject(options)
  await server.stop()
  grpcServer.server.forceShutdown()
  t.is(response.statusCode, 201, 'Success')
  sandbox.restore()
})
