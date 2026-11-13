export type ConnectionState='not_configured'|'disabled'|'launch_only'|'healthy'|'configuration_error'|'redirect_blocked'|'authentication_required'|'http_error'|'invalid_response'|'contract_mismatch'|'timeout'|'unreachable';
export type Connection={id:string;name:string;enabled:boolean;webUrl:string;apiUrl:string;healthPath:string;auth:string;sourceVerified:boolean;state:ConnectionState;message:string;checkedAt:string;latencyMs:number|null;httpStatus:number|null;version:string|null};
export type ConnectionSnapshot={schemaVersion:number;checkedAt:string;connections:Connection[]};
