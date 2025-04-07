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
 * Shashikant Hirugade <shashikant.hirugade@modusbox.com>
 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 * Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

'use strict'

const Sinon = require('sinon')
const Test = require('ava')
const Mustache = require('mustache')
const Uuid = require('uuid4')
const KafkaProducer = require('@mojaloop/central-services-stream').Kafka.Producer
const Proxyquire = require('proxyquire')
const Utility = require('../../../../src/lib/kafka/util')

const EVENT = 'event'
const PRODUCER = 'PRODUCER'
const KEY = 'key'
const generalTopic = 'topic-event'

const transfer = {
  transferId: 'b51ec534-ee48-4575-b6a9-ead2955b8999',
  payerFsp: 'dfsp1',
  payeeFsp: 'dfsp2',
  amount: {
    currency: 'USD',
    amount: '433.88'
  },
  ilpPacket: 'AYIBgQAAAAAAAASwNGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpLMHlGTFGCAUBQU0svMS4wCk5vbmNlOiB1SXlweUYzY3pYSXBFdzVVc05TYWh3CkVuY3J5cHRpb246IG5vbmUKUGF5bWVudC1JZDogMTMyMzZhM2ItOGZhOC00MTYzLTg0NDctNGMzZWQzZGE5OGE3CgpDb250ZW50LUxlbmd0aDogMTM1CkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvbgpTZW5kZXItSWRlbnRpZmllcjogOTI4MDYzOTEKCiJ7XCJmZWVcIjowLFwidHJhbnNmZXJDb2RlXCI6XCJpbnZvaWNlXCIsXCJkZWJpdE5hbWVcIjpcImFsaWNlIGNvb3BlclwiLFwiY3JlZGl0TmFtZVwiOlwibWVyIGNoYW50XCIsXCJkZWJpdElkZW50aWZpZXJcIjpcIjkyODA2MzkxXCJ9IgA',
  condition: 'YlK5TZyhflbXaDRPtR5zhCu8FrbgvrQwwmzuH0iQ0AI',
  expiration: '2016-05-24T08:38:08.699-04:00',
  extensionList: {
    extension: [
      {
        key: 'key1',
        value: 'value1'
      },
      {
        key: 'key2',
        value: 'value2'
      }
    ]
  }
}

const messageProtocol = {
  id: transfer.transferId,
  from: transfer.payerFsp,
  to: transfer.payeeFsp,
  type: 'application/json',
  content: {
    header: {},
    payload: transfer
  },
  metadata: {
    event: {
      id: Uuid(),
      type: 'prepare',
      action: 'commit',
      createdAt: new Date(),
      state: {
        status: 'success',
        code: 0,
        description: 'action successful'
      }
    }
  },
  pp: ''
}

let sandbox

Test.serial.beforeEach(() => {
  sandbox = Sinon.createSandbox()
  sandbox.stub(KafkaProducer.prototype, 'constructor').returns(Promise.resolve())
  sandbox.stub(KafkaProducer.prototype, 'connect').returns(Promise.resolve())
  sandbox.stub(KafkaProducer.prototype, 'sendMessage').returns(Promise.resolve())
  sandbox.stub(KafkaProducer.prototype, 'disconnect').returns(Promise.resolve())
})

Test.serial.afterEach(() => {
  sandbox.restore()
})

Test.serial('createGeneralTopicConf should return a general topic conf object', test => {
  const response = Utility.createGeneralTopicConf(EVENT, 0)
  test.is(response.topicName, generalTopic)
  test.is(response.key, 0)
  test.is(response.partition, null)
  test.is(response.opaqueKey, null)
})

Test.serial('createGeneralTopicConf should return a general topic conf object using topicMap', test => {
  const ModuleProxy = Proxyquire('../../../../src/lib/kafka/util', {
    '../../lib/enum': {
      topicMap: {
        event: {
          functionality: 'event'
        }
      }
    }
  })
  const response = ModuleProxy.createGeneralTopicConf(EVENT, 0)
  test.is(response.topicName, generalTopic)
  test.is(response.key, 0)
  test.is(response.partition, null)
  test.is(response.opaqueKey, null)
})

Test.serial('createGeneralTopicConf should throw error when Mustache cannot find config', test => {
  try {
    Sinon.stub(Mustache, 'render').throws(new Error())
    Utility.createGeneralTopicConf(EVENT)
    test.fail('No Error thrown')
    Mustache.render.restore()
  } catch (e) {
    test.pass('Error thrown')
    Mustache.render.restore()
  }
})

Test.serial('getKafkaConfig should return the Kafka config from the default.json', test => {
  const config = Utility.getKafkaConfig(PRODUCER, EVENT.toUpperCase())
  test.pass(config.rdkafkaConf !== undefined)
  test.pass(config.options !== undefined)
})

Test.serial('getKafkaConfig should throw and error if Kafka config not in default.json', test => {
  try {
    Utility.getKafkaConfig(PRODUCER, EVENT)
    test.fail('Error not thrown')
  } catch (e) {
    test.pass('Error thrown')
  }
})

Test.serial('produceGeneralMessage should produce a general message', async (test) => {
  const result = await Utility.produceGeneralMessage(EVENT, messageProtocol, KEY)
  test.is(result, true)
})

Test.serial('produceGeneralMessage should produce a general message using topicMap', async (test) => {
  const ModuleProxy = Proxyquire('../../../../src/lib/kafka/util', {
    '../../lib/enum': {
      topicMap: {
        transfer: {
          prepare: {
            functionality: 'transfer',
            action: 'prepare'
          }
        }
      }
    }
  })
  const result = await ModuleProxy.produceGeneralMessage(EVENT, messageProtocol, KEY)
  test.is(result, true)
})

// Test.serial('produceGeneralMessage should produce a general message', async (test) => {
//   try {
//     await Utility.produceGeneralMessage(EVENT, messageProtocol, KEY, PARTITION)
//   } catch (e) {
//     test.pass(e instanceof Error)
//   }
// })
