# Event-GRPC-Server

This is a gRPC server which is an extension to `event-sidecar` service from mojaloop.

This service doesn't need to be run as a sidecar, it can be run as a standalone service.

The difference between `mojaloop/event-sidecar` and this is ...
1. Error handling is properly implemented. A mojaloop service sending events to this service will be notified with the event propagation status. Mojaloop service continues its execution only after the event is propagated to the target system.
2. AWS SQS support is added.

```
aws iam list-mfa-devices --user-name <USERNAME>

aws sts get-session-token \
  --serial-number <SNO> \
  --token-code <TOKEN>
```