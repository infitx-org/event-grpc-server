'use strict'

const Hapi = require('@hapi/hapi')
const HapiOpenAPI = require('hapi-openapi')
const Path = require('path')
const Config = require('./lib/config.js')
const Logger = require('@mojaloop/central-services-logger')
const Plugins = require('./plugins')
const RequestLogger = require('./lib/requestLogger')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const eventHandler = require('./domain/event/handler')

const PROTO_PATH = Path.join(__dirname, 'event_logger.proto')

const openAPIOptions = {
  api: Path.resolve(__dirname, './interface/swagger.json'),
  handlers: Path.resolve(__dirname, './handlers')
}

function decodeProtoBufAnyJson(any) {
  if (any.type_url === 'application/json' && any.value) {
    const buffer = Buffer.from(any.value)
    const jsonString = buffer.toString('utf-8')
    try {
      return JSON.parse(jsonString)
    } catch (err) {
      console.error('Failed to parse JSON from Any.value buffer:', err)
      return null
    }
  } else {
    console.warn('Unsupported type_url or missing value')
    return null
  }
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})
const proto = grpc.loadPackageDefinition(packageDefinition)

/**
 * @function createServer
 *
 * @description Create HTTP Server
 *
 * @param {number} port Port to register the Server against
 * @returns {Promise<Server>} Returns the Server object
 */
const createServer = async (port) => {
  const server = await new Hapi.Server({
    port
  })
  await Plugins.registerPlugins(server)
  await server.register([
    {
      plugin: HapiOpenAPI,
      options: openAPIOptions
    }
  ])
  await server.ext([
    {
      type: 'onPreHandler',
      method: (request, h) => {
        RequestLogger.logResponse(request)
        return h.continue
      }
    },
    {
      type: 'onPreResponse',
      method: (request, h) => {
        if (!request.response.isBoom) {
          RequestLogger.logResponse(request.response)
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
  await server.start()
  return server
}

const createRPCServer = async () => {
  const grpcServer = new grpc.Server()

  // Adjust path based on console.log output
  grpcServer.addService(proto.mojaloop.events.EventLoggerService.service, {
    Log: logHandler
  })

  const address = `${Config.EVENT_LOGGER_GRPC_HOST}:${Config.EVENT_LOGGER_GRPC_PORT}`
  grpcServer.bindAsync(address, grpc.ServerCredentials.createInsecure(), () => {
    Logger.isInfoEnabled && Logger.info(`GRPC Server started at host: ${Config.EVENT_LOGGER_GRPC_HOST}, port: ${Config.EVENT_LOGGER_GRPC_PORT}`)
  })

  return grpcServer
}

const logHandler = async (call, callback) => {
  const eventMessage = call.request

  if (!eventMessage.metadata && eventMessage.content && eventMessage.content.trace && eventMessage.content) {
    eventMessage.metadata = eventMessage.content
  }

  const decodedContent = decodeProtoBufAnyJson(eventMessage.content)
  if (decodedContent) {
    eventMessage.content = decodedContent
  }
  try {
    await eventHandler.logEvent(eventMessage)
    return callback(null, {
      status: 'accepted'
    })
  } catch (err) {
    Logger.isErrorEnabled && Logger.error(`Error while logging event: ${err.message}`, err)
    return callback({
      code: grpc.status.INTERNAL,
      details: err.message
    })
  }
}

const initialize = async (port = Config.PORT) => {
  const grpcServer = await createRPCServer()
  const server = await createServer(port)
  server.plugins.openapi.setHost(server.info.host + ':' + server.info.port)
  Logger.isInfoEnabled && Logger.info(`HTTP Server running on ${server.info.host}:${server.info.port}`)
  return {
    server,
    grpcServer
  }
}

module.exports = {
  initialize
}
