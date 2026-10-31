const terminals = new Set(['completed', 'failed', 'cancelled', 'timed_out', 'unknown']);
export class ModelError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ModelError'; this.code = code; Object.assign(this, details); }
}
export function createModelsClient(transport) {
  const invoke = (method, args = {}) => transport.call('models.' + method, args);
  async function start(input, options = {}, streaming = true) {
    const initial = await invoke('create');
    const callId = initial.callId;
    let ended = false, latest = initial, partial = '', wake, consumer = false;
    const queue = [];
    let resolveResult, rejectResult;
    const result = new Promise((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
    // Streaming callers may only consume events; do not create an unhandled rejection.
    result.catch(() => {});
    const notify = event => {
      if (ended) return;
      if (!event || event.callId !== callId || typeof event.type !== 'string') throw new ModelError('model_stream_interrupted', '模型事件无效', {callId});
      if (event.type === 'delta') {
        if (typeof event.text !== 'string') throw new ModelError('model_stream_interrupted', '模型内容无效', {callId});
        if (partial.length + event.text.length > 1024 * 1024) throw new ModelError('model_output_limit', '输出超过读取范围', {callId, partialText:partial});
        partial += event.text;
        const last = queue.at(-1);
        if (last?.type === 'delta') { last.text += event.text; last.sequence = event.sequence; }
        else queue.push({...event});
      } else {
        if (terminals.has(event.type) && (!event.result || event.result.callId !== callId || event.result.status !== event.type || typeof event.result.text !== 'string' || (event.type === 'completed' && typeof event.result.model?.ref !== 'string'))) throw new ModelError('model_stream_interrupted', '模型终态无效', {callId});
        if (!terminals.has(event.type) && queue.length >= 2048) throw new ModelError('model_output_limit', '输出读取过慢', {callId, partialText:partial});
        queue.push(event);
      }
      if (terminals.has(event.type)) {
        ended = true; latest = event.result;
        options.signal?.removeEventListener('abort', onAbort);
        if (event.type === 'completed') resolveResult(latest);
        else rejectResult(new ModelError(latest?.error?.code || 'model_' + event.type, latest?.error?.message || '生成未完成', {callId, status:event.type, execution:latest?.execution || 'unknown', partialText:latest?.text ?? partial, result:latest}));
        transport.release?.(callId);
      }
      wake?.(); wake = undefined;
    };
    const asTerminal = value => ({type:value.status, callId, result:{callId,status:value.status,execution:'unknown',text:partial,model:null,usage:null,finishReason:null,truncated:false,error:null,...value}});
    async function cancel() {
      if (ended) return latest;
      const value = await invoke('cancel', {callId});
      if (terminals.has(value.status)) notify(asTerminal(value));
      return value;
    }
    const onAbort = () => { void cancel().catch(error => {
      if (!ended) notify(asTerminal({callId,status:'unknown',execution:'unknown',text:partial,error:{code:'model_call_unknown',message:'停止结果待确认'}}));
    }); };
    options.signal?.addEventListener('abort', onAbort, {once:true});
    const events = {
      [Symbol.asyncIterator]() {
        if (consumer) throw new ModelError('model_reader_exists', '输出只能读取一次', {callId});
        consumer = true;
        return {
          async next() {
            while (!queue.length && !ended) await new Promise(resolve => { wake = resolve; });
            return queue.length ? {done:false,value:queue.shift()} : {done:true,value:undefined};
          },
          async return() { if (!ended) await cancel(); return {done:true,value:undefined}; },
        };
      },
    };
    void (async () => {
      try {
        if (options.signal?.aborted) { await cancel(); return; }
        try { await invoke('run', {callId, request:{...input, stream:streaming}}); }
        catch (error) {
          const current = await invoke('status', {callId});
          if (terminals.has(current.status)) { notify(asTerminal(current)); return; }
          if (!['queued','running'].includes(current.status)) throw error;
        }
        while (!ended) notify(await invoke('next', {callId}));
      } catch (error) {
        if (ended) return;
        let current;
        try { current = await invoke('status', {callId}); } catch {}
        if (current && terminals.has(current.status)) notify(asTerminal(current));
        else {
          // Query/cancel an existing call; never replay its generation request.
          try { await invoke('cancel', {callId}); } catch {}
          notify(asTerminal({callId,status:'unknown',execution:current?.execution || 'unknown',text:partial,error:{code:typeof error.code === 'string' ? error.code : 'model_stream_interrupted',message:error.message || '连接已中断，生成结果待确认'}}));
        }
      }
    })();
    return {callId, events, result, cancel};
  }
  return Object.freeze({
    list: () => invoke('list'),
    stream: (request, options) => start(request, options, true),
    generate: async (request, options) => (await start(request, options, false)).result,
    status: callId => invoke('status', {callId}),
    cancel: callId => invoke('cancel', {callId}),
  });
}
