# Event-GRPC-Server

__Note: This is experimental and design decision is not taken about this service yet.__

This is a gRPC server which is based on `event-sidecar` service from mojaloop.

This service doesn't need to be run as a sidecar, it can be run as a standalone service.

The difference between `mojaloop/event-sidecar` and this is ...
1. Error handling is properly implemented. A mojaloop service sending events to this service will be notified with the event propagation status. Mojaloop service continues its execution only after the event is propagated to the target system.
2. AWS SQS support is added.

By using this service, we can decouple the audit message propagation from the core services.
This is an abstraction layer between mojaloop services and the target system.
It avoids the need to have client libraries in the mojaloop services to send audit messages to the target system.

### To configure mojaloop services to send audit events to this service
You can supply a configuration file override named `.EVENT_SDKrc` with the following content
```
{
  "AUDIT": "sidecar",
  "EVENT_LOGGER_SIDECAR_DISABLED": false,
  "SERVER_HOST": "<grpc_server_host>",
  "SERVER_PORT": 50057,
  "LOG": "off",
  "TRACE": "off"
}
```


### Useful commands

```
aws iam list-mfa-devices --user-name <USERNAME>

aws sts get-session-token \
  --serial-number <SNO> \
  --token-code <TOKEN>
```


