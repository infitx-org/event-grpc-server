'use strict'

const Config = require('../../lib/config')
const SQSConfig = Config.AWS_SQS_CONFIG
const AWS = require('aws-sdk')

// Set the region
AWS.config.update({ region: SQSConfig.REGION })

// Create an SQS service object
const sqs = new AWS.SQS({ apiVersion: SQSConfig.SQS_API_VERSION })

AWS.config.getCredentials(function (err) {
  if (err) console.log("Error loading credentials", err.stack)
  else console.log("Access key:", AWS.config.credentials.accessKeyId)
})

const produceGeneralMessage = async (functionality, message, key) => {
  const params = {
    // Remove DelaySeconds parameter and value for FIFO queues
    DelaySeconds: 10,
    MessageAttributes: {
      Functionality: {
        DataType: 'String',
        StringValue: functionality,
      },
      Key: {
        DataType: 'String',
        StringValue: key,
      },
    },
    MessageBody: JSON.stringify(message),
    // MessageDeduplicationId: 'TheWhistler',  // Required for FIFO queues
    // MessageGroupId: 'Group1',  // Required for FIFO queues
    QueueUrl: SQSConfig.SQS_QUEUE_URL,
  }
  
  sqs.sendMessage(params, function (err, data) {
    if (err) {
      console.log('Error', err)
      throw new Error('Error sending message to SQS')
    } else {
      console.log('Success', data.MessageId)
      return true
    }
  })
}

module.exports = {
  produceGeneralMessage
}
