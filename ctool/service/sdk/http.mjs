import {createParser} from './vendor/eventsource-parser.mjs';
import {createModelsClient, ModelError} from './models.mjs';

export async function* readEvents(response, callId) {
  if (!response.ok || !response.headers.get('content-type')?.startsWith('text/event-stream') || !response.body) {
    throw new ModelError('model_stream_interrupted', '无法读取模型输出', {callId});
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal:true});
  const events = [];
  let parseError, terminal = false;
  const parser = createParser({onEvent:event => {
    try { events.push(JSON.parse(event.data)); } catch { parseError = new ModelError('model_stream_interrupted', '模型事件损坏', {callId}); }
  }, onError:error => { parseError = error; }, maxBufferSize:4 * 1024 * 1024});
  try {
    while (true) {
      const chunk = await reader.read();
      parser.feed(decoder.decode(chunk.value, {stream:!chunk.done}));
      if (parseError) throw parseError;
      for (const event of events.splice(0)) {
        if (event.callId !== callId) throw new ModelError('model_stream_interrupted', '调用编号不一致', {callId});
        terminal = ['completed','failed','cancelled','timed_out','unknown'].includes(event.type);
        yield event;
        if (terminal) return;
      }
      if (chunk.done) break;
    }
    if (!terminal) throw new ModelError('model_stream_interrupted', '模型连接提前结束，已生成内容已保留', {callId});
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export function createHttpTransport({baseUrl, headers = {}, fetch:fetcher = globalThis.fetch, request}) {
  const streams = new Map(), ids = new Set();
  let closed = false;
  async function json(path, method = 'GET', body) {
    if (request) return request(path, method, body);
    const response = await fetcher(baseUrl + path, {method, cache:'no-store', redirect:'error', signal:AbortSignal.timeout(15_000), headers:{...headers,Accept:'application/json',...(body === undefined ? {} : {'Content-Type':'application/json'})},...(body === undefined ? {} : {body:JSON.stringify(body)})});
    const value = await response.json();
    if (!response.ok) throw new ModelError(value.error?.code || 'model_unavailable', value.error?.message || '宿主请求失败', {httpStatus:response.status});
    return value.data;
  }
  function release(callId) { const stream = streams.get(callId); stream?.abort.abort(); void stream?.iterator.return?.().catch(() => {}); streams.delete(callId); ids.delete(callId); }
  return {
    async call(method, args = {}) {
      const id = args.callId;
      if (['models.run','models.status','models.cancel','models.next'].includes(method) && (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new ModelError('model_invalid','调用编号无效');
      if (closed && method !== 'models.cancel') throw new ModelError('model_call_unknown', '插件页面已关闭', {callId:id});
      switch (method) {
        case 'models.list': return json('');
        case 'models.create': {
          const value = await json('/calls','POST',{}); ids.add(value.callId);
          if (closed) { await json('/calls/'+value.callId+'/cancel','POST',{}); throw new ModelError('model_cancelled','插件页面已关闭',{callId:value.callId}); }
          return value;
        }
        case 'models.run': return json('/calls/'+id+'/run','POST',args.request);
        case 'models.status': return json('/calls/'+id);
        case 'models.cancel': { const value = await json('/calls/'+id+'/cancel','POST',{}); release(id); return value; }
        case 'models.next': {
          let stream = streams.get(id);
          if (!stream) {
            const abort = new AbortController();
            const response = fetcher(baseUrl+'/calls/'+id+'/events',{headers:{...headers,Accept:'text/event-stream'},credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal});
            const iterator = (async function*(){yield* readEvents(await response,id);})();
            stream = {abort,iterator,reading:false}; streams.set(id,stream);
          }
          if (stream.reading) throw new ModelError('model_reader_exists','此调用已有输出读取器',{callId:id});
          stream.reading = true;
          try { const next = await stream.iterator.next(); if (next.done) throw new ModelError('model_stream_interrupted','模型输出已断开',{callId:id}); return next.value; }
          finally { stream.reading = false; }
        }
        default: throw new ModelError('model_unsupported','宿主尚未提供该模型能力');
      }
    },
    release,
    async close() { closed = true; const pending = [...ids]; await Promise.allSettled(pending.map(async id => { try { await json('/calls/'+id+'/cancel','POST',{}); } finally { release(id); } })); },
  };
}
export function createHostClientFromEnv(env = globalThis.process?.env) {
  if (!env?.XHUB_HOST_API_URL || !env.XHUB_INSTANCE_ID || !env.XHUB_SERVICE_TOKEN) throw new ModelError('model_host_missing','请通过cookieOS启动此插件服务');
  const transport = createHttpTransport({baseUrl:env.XHUB_HOST_API_URL, headers:{Authorization:'Bearer '+env.XHUB_SERVICE_TOKEN,'X-Xhub-Instance-Id':env.XHUB_INSTANCE_ID}});
  return {models:createModelsClient(transport),close:()=>transport.close()};
}
