/**
 * LLM 客户端 - 提供统一的大模型调用接口
 *
 * 支持 OpenAI 兼容格式（含 DeepSeek、通义千问等）和 Ollama 本地模型
 * 支持流式 (SSE) 和非流式两种调用方式
 */

// ============================================================
// 类型定义
// ============================================================

/** AI 服务提供方 */
export type AiProvider = "ollama" | "openai_compatible"

/** AI 配置项 */
export interface AiConfig { model: string }

/** 聊天消息 */
export interface ChatMessage {
    role: "system" | "user" | "assistant"
    content: string
}

/** 非流式调用结果 */
export interface ChatResult {
    content: string
    usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

/** 流式调用的回调 */
export interface StreamCallbacks {
    onToken: (token: string) => void
    onDone: (fullText: string) => void
    onError: (error: Error) => void
}

// ============================================================
// 默认配置
// ============================================================

export const defaultAiConfig: AiConfig = { model: "" }

// ============================================================
// Response Extractor - 从 AI 返回的文本中提取有效内容
// ============================================================

/**
 * 从 AI 返回文本中提取 JSON 字符串
 *
 * 大模型经常会在 JSON 外面包裹 Markdown 代码块标记或附带废话，
 * 此函数会逐层尝试提取，尽最大努力拿到合法 JSON
 */
export function extractJSON(raw: string): string {
    const trimmed = raw.trim()

    // 第 1 步：直接尝试解析（最理想情况）
    if (tryParseJSON(trimmed)) {
        return trimmed
    }

    // 第 2 步：提取 ```json ... ``` 或 ``` ... ``` 代码块
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (codeBlockMatch) {
        const inner = codeBlockMatch[1].trim()
        if (tryParseJSON(inner)) {
            return inner
        }
    }

    // 第 3 步：贪心匹配第一个完整的 JSON 对象或数组
    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (jsonMatch) {
        const candidate = jsonMatch[1].trim()
        if (tryParseJSON(candidate)) {
            return candidate
        }
    }

    // 全部失败，返回原文让上层决定如何处理
    return trimmed
}

/**
 * 从 AI 返回文本中提取代码片段（正则表达式、SQL、Cron 等）
 *
 * 剥离 Markdown 代码块标记和常见废话前缀
 */
export function extractCode(raw: string): string {
    const trimmed = raw.trim()

    // 提取代码块（支持任意语言标记）
    const codeBlockMatch = trimmed.match(/```\w*\s*\n?([\s\S]*?)\n?\s*```/)
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim()
    }

    // 提取行内代码
    const inlineCodeMatch = trimmed.match(/^`([^`]+)`$/)
    if (inlineCodeMatch) {
        return inlineCodeMatch[1].trim()
    }

    // 去除常见废话行（中英文），逐行检查，丢弃前导废话行，保留代码行
    const lines = trimmed.split("\n")
    const codeLines: string[] = []
    let foundCode = false

    for (const line of lines) {
        const stripped = line.trim()
        if (!foundCode) {
            // 跳过空行
            if (stripped === "") continue
            // 跳过以冒号/句号结尾的引导性语句（如"好的，以下是生成的表达式："、"Here's the result:"）
            if (/[：:。.]$/.test(stripped) && /^.*(?:好的|以下是|这是|结果|生成|here|result|output|pattern|expression|following)/i.test(stripped)) {
                continue
            }
            foundCode = true
            codeLines.push(stripped)
        } else {
            codeLines.push(line)
        }
    }

    return codeLines.join("\n").trim() || trimmed
}

function tryParseJSON(str: string): boolean {
    try {
        JSON.parse(str)
        return true
    } catch {
        return false
    }
}

// ============================================================
// SSE 流式解析器
// ============================================================

/**
 * 解析 SSE 流中的单行 data 事件
 *
 * OpenAI 兼容格式：data: {"choices":[{"delta":{"content":"..."}}]}
 * Ollama 格式：{"message":{"content":"..."}}（每行一个 JSON，非标准 SSE）
 */
export function parseSSELine(line: string, provider: AiProvider): string | null {
    if (!line || line.startsWith(":")) {
        // 空行或 SSE 注释行，跳过
        return null
    }

    if (line === "data: [DONE]") {
        return null
    }

    // OpenAI 兼容格式
    if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6)
        try {
            const data = JSON.parse(jsonStr)
            return data?.choices?.[0]?.delta?.content ?? null
        } catch {
            return null
        }
    }

    // Ollama 原生流式格式（每行直接是一个 JSON 对象）
    if (provider === "ollama") {
        try {
            const data = JSON.parse(line)
            if (data.done) return null
            return data?.message?.content ?? null
        } catch {
            return null
        }
    }

    return null
}

// ============================================================
// LLM 客户端核心
// ============================================================

export async function chat(messages: ChatMessage[], config: AiConfig): Promise<ChatResult> {
    if (!window.xhub?.models) throw new Error("请更新 cookieOS 后使用 AI 辅助");
    const result = await window.xhub.models.generate({model: config.model ? {mode: "explicit", ref: config.model} : {mode: "default"}, messages});
    return {content: result.text};
}
