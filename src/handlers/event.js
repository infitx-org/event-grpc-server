'use strict'

const Boom = require('@hapi/boom')
const handler = require('../domain/event/handler')
/**
 * Operations on /event
 */
module.exports = {
  /**
   * summary: Post Event
   * description: The HTTP request POST /event is a REST endpoint to add an event to a Kafka Topic.
   * parameters: body
   * produces: application/json
   * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
   */
  post: async function (request, h) {
    try {
      await handler.handleRestRequest(request.payload)
      return h.response().code(201)
    } catch (e) {
      return Boom.badRequest(e.message)
    }
  }
}
