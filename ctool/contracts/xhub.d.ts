export type Surface = 'module' | 'view' | 'window' | 'drawer';
export type ModelSelection = {mode:'default'} | {mode:'explicit'; ref:string};
export type ModelConfigurationStatus = 'configured'|'disabled'|'incomplete';
export type ModelVerificationStatus = 'verified'|'unverified'|'stale';
export type ModelCapabilityStatus = 'supported'|'unsupported'|'unknown';
export interface ModelInfo {
  ref:string; providerId:string; providerName:string; modelName:string; isDefault:boolean;
  configurationStatus:ModelConfigurationStatus; verificationStatus:ModelVerificationStatus; connectionVersion:number;
  capabilities:{text:ModelCapabilityStatus; streaming:ModelCapabilityStatus; tools:ModelCapabilityStatus;
    toolsInRequests:'unsupported'; images:'unsupported'; audio:'unsupported'; scope:'host-adapter'; parameters:ModelParameterName[]};
}
export interface ModelCatalog {models:ModelInfo[]; defaultRef:string|null}
export interface ModelMessage {role:'system'|'user'|'assistant'; content:string}
export type ModelParameterName = 'temperature'|'topP'|'maxOutputTokens'|'stop'|'thinkingEnabled';
export interface ModelParameters {temperature?:number; topP?:number; maxOutputTokens?:number; stop?:string[]; thinkingEnabled?:boolean}
export interface ModelRequest {model?:ModelSelection; messages:ModelMessage[]; parameters?:ModelParameters; timeoutMs?:number}
export interface ModelUsage {inputTokens:number|null; outputTokens:number|null; cachedInputTokens:number|null; reasoningTokens:number|null; invalid:boolean}
export type ModelCallStatus = 'prepared'|'queued'|'running'|'completed'|'failed'|'cancelled'|'timed_out'|'unknown';
export interface ModelFailure {code:string; message:string}
export interface ModelCallSnapshot {
  callId:string; status:ModelCallStatus; execution:'not_sent'|'possibly_sent'|'completed'|'unknown'; text:string;
  model:ModelInfo|null; usage:ModelUsage|null; finishReason:string|null; truncated:boolean; error:ModelFailure|null;
}
export interface ModelResult extends ModelCallSnapshot {status:'completed'; model:ModelInfo; error:null}
export type ModelEvent =
  | {type:'delta'; callId:string; sequence?:number; text:string}
  | {type:'status'; callId:string; sequence?:number; status:ModelCallStatus; model:ModelInfo|null}
  | {type:'completed'; callId:string; sequence?:number; result:ModelResult}
  | {type:'failed'|'cancelled'|'timed_out'|'unknown'; callId:string; sequence?:number; result:ModelCallSnapshot};
export interface ModelCall {callId:string; events:AsyncIterable<ModelEvent>; result:Promise<ModelResult>; cancel():Promise<ModelCallSnapshot>}
export interface ModelCallOptions {signal?:AbortSignal}
export interface ModelsApi {
  list():Promise<ModelCatalog>;
  generate(request:ModelRequest, options?:ModelCallOptions):Promise<ModelResult>;
  stream(request:ModelRequest, options?:ModelCallOptions):Promise<ModelCall>;
  status(callId:string):Promise<ModelCallSnapshot>;
  cancel(callId:string):Promise<ModelCallSnapshot>;
}
export interface ModelError extends Error {
  code:string; callId?:string; status?:ModelCallStatus; httpStatus?:number; execution?:ModelCallSnapshot['execution']; partialText?:string; result?:ModelCallSnapshot;
}
export interface Xhub {
  models:ModelsApi;
  runtime: {info(): Promise<{id: string; version: string; surface: Surface; capabilities: string[]}>; open(surface: Surface): Promise<void>};
  tools: {list(): Promise<unknown[]>; call<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>};
  service: {request<T = unknown>(path: string, options?: {method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'; body?: unknown}): Promise<T>};
  storage: {get<T = unknown>(key: string): Promise<T | null>; set(key: string, value: unknown): Promise<void>; remove(key: string): Promise<void>};
  config: {get<T = unknown>(key: string): Promise<T | null>; set(key: string, value: unknown): Promise<void>};
  theme: {get(): Promise<Record<string,string>>; onChange(callback: (theme: Record<string,string>) => void): () => void};
  openExternal(url: string): Promise<void>;
}
declare global {interface Window {readonly xhub: Xhub}}
