// const initJaegerTracer = require('jaeger-client').initTracer
// const Logger = require('@mojaloop/central-services-logger')

// function initTracer(serviceName) {
//   let config = {
//     serviceName: serviceName,
//     sampler: {
//       type: 'const',
//       param: 1,
//     },
//     reporter: {
//       logSpans: true,
//     },
//   }
//   let options = {
//     logger: {
//       info: function logInfo(msg) {
//         Logger.isInfoEnabled && Logger.info(msg)
//       },
//       error: function logError(msg) {
//         Logger.isErrorEnabled && Logger.error(msg)
//       },
//     }
//   }
//   return initJaegerTracer(config, options)
// }

// module.exports = {
//   initTracer
// }
