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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 * Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/
'use strict'

const src = '../../../../src'
const Sinon = require('sinon')
const rewire = require('rewire')
const Test = require('ava')
const KafkaProducer = require('@mojaloop/central-services-stream').Kafka.Producer
const Producer = require(`${src}/lib/kafka/producer`)
const Uuid = require('uuid4')
const Logger = require('@mojaloop/central-services-logger')

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
    header: '',
    payload: transfer
  },
  metadata: {
    event: {
      id: Uuid(),
      type: 'log',
      action: 'info',
      createdAt: new Date(),
      state: {
        status: 'success',
        code: 0
      }
    }
  },
  pp: ''
}

const topicConf = {
  topicName: 'topic-event',
  key: 'producerTest',
  partition: 0,
  opaqueKey: 0
}
let sandbox
const config = {}

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

Test.serial('return true', async test => {
  const result = await Producer.produceMessage(messageProtocol, topicConf, config)
  test.is(result, true)
  await Producer.disconnect(topicConf.topicName)
})

Test.serial('return true with logger levels disabled', async test => {
  sandbox.stub(Logger, 'isErrorEnabled').value(true)
  sandbox.stub(Logger, 'isDebugEnabled').value(true)
  sandbox.stub(Logger, 'isInfoEnabled').value(true)
  const result = await Producer.produceMessage(messageProtocol, topicConf, config)
  test.is(result, true)
  await Producer.disconnect(topicConf.topicName)
})

Test.serial('disconnect specific topic correctly', async test => {
  try {
    topicConf.topicName = 'someTopic'
    await Producer.produceMessage(messageProtocol, topicConf, config)
    await Producer.disconnect(topicConf.topicName)
    test.pass('Disconnect specific topic successfully')
  } catch (e) {
    test.fail('Error thrown')
  }
})

Test.serial('disconnect all topics correctly', async test => {
  try {
    topicConf.topicName = 'someTopic1'
    await Producer.produceMessage(messageProtocol, topicConf, config)
    topicConf.topicName = 'someTopic2'
    await Producer.produceMessage(messageProtocol, topicConf, config)
    await Producer.disconnect()
    test.pass('Disconnected all topics successfully')
  } catch (e) {
    test.fail('Error thrown')
  }
})

Test.serial('fetch a specific Producers', async test => {
  await Producer.produceMessage({}, { topicName: 'test' }, {})
  test.pass(Producer.getProducer('test'))
})

Test.serial('throw an exception for a specific Producers not found', async test => {
  try {
    test.pass(Producer.getProducer('undefined'))
    test.fail('Error not thrown!')
  } catch (e) {
    test.pass(e.toString() === 'Error: No producer found for topic undefined')
  }
})

Test.serial('disconnect from kafka', async test => {
  await Producer.produceMessage({}, { topicName: 'test' }, {})
  test.pass(Producer.disconnect('test'))
})

// Test.serial('disconnect specific topic correctly', async test => {
//   try {
//     const topicName = 'someTopic'
//     test.pass(await Producer.produceMessage({}, {topicName: topicName}, {}))
//     await Producer.disconnect(topicName)
//     test.pass('Disconnect specific topic successfully')
//
//   } catch (e) {
//     test.fail('Error thrown')
//
//   }
// })

// Test.serial('disconnect all topics correctly', async test => {
//   try {
//     let topicName = 'someTopic1'
//     test.pass(await Producer.produceMessage({}, {topicName: topicName}, {}))
//     await Producer.disconnect(topicName)
//     topicName = 'someTopic2'
//     test.pass(await Producer.produceMessage({}, {topicName: topicName}, {}))
//     await Producer.disconnect()
//     test.pass('Disconnected all topics successfully')
//   } catch (e) {
//     test.fail('Error thrown')
//
//   }
// })

Test.serial('throw error if failure to disconnect from kafka when disconnecting all Producers', async test => {
  let topicNameFailure
  const getProducerStub = sandbox.stub()
  try {
    // setup stubs for getProducer method
    const topicNameSuccess = 'topic1'
    topicNameFailure = 'topic2'
    getProducerStub.returns(new KafkaProducer({}))
    getProducerStub.withArgs(topicNameFailure).throws(`No producer found for topic ${topicNameFailure}`)
    // lets rewire the producer import
    const KafkaProducerProxy = rewire(`${src}/lib/kafka/producer`)
    // lets override the getProducer method within the import
    KafkaProducerProxy.__set__('getProducer', getProducerStub)
    await KafkaProducerProxy.produceMessage({}, { topicName: topicNameSuccess }, {})
    await KafkaProducerProxy.produceMessage({}, { topicName: topicNameFailure }, {})
    await KafkaProducerProxy.disconnect()
    test.fail()
  } catch (e) {
    test.pass(e instanceof Error)
    test.pass(e.toString() === `Error: The following Producers could not be disconnected: [{"topic":"${topicNameFailure}","error":"No producer found for topic ${topicNameFailure}"}]`)
  }
})

Test.serial('throw error if failure to disconnect from kafka if topic does not exist', async test => {
  try {
    const topicName = 'someTopic'
    await Producer.produceMessage({}, { topicName }, {})
    await Producer.disconnect('undefined')
  } catch (e) {
    test.pass(e instanceof Error)
  }
})

Test.serial('throw error when a non-string value is passed into disconnect', async (test) => {
  try {
    const badTopicName = {}
    await Producer.disconnect(badTopicName)
    test.fail('Error not thrown')
  } catch (e) {
    test.pass('Error Thrown')
  }
})

Test.serial('throw error when connect throws error', async test => {
  try {
    sandbox.restore()
    sandbox.stub(KafkaProducer.prototype, 'constructor').returns(Promise.resolve())
    sandbox.stub(KafkaProducer.prototype, 'connect').throws(new Error())
    sandbox.stub(KafkaProducer.prototype, 'sendMessage').returns(Promise.resolve())
    sandbox.stub(KafkaProducer.prototype, 'disconnect').throws(new Error())
    topicConf.topicName = 'invalidTopic'
    await Producer.produceMessage(messageProtocol, topicConf, config)
    test.fail('Error not thrown')
  } catch (e) {
    test.pass('Error thrown')
  }
})
