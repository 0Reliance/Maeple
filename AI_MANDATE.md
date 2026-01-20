# 🤖 AI Service Mandate: 2026 Standards

> **Authority**: Orchestration Core
> **Date**: 2026-01-16
> **Scope**: All AI-Enabled Services in `CT122` / `0Reliance` Stack

## 1. The Core Directive
All services MUST consume AI models through the **LiteLLM Gateway** whenever technically feasible. Direct API usage is restricted to specific exceptions (e.g., multimodal requirements not supported by proxy).

**Gateway Endpoint**: `http://192.168.1.194:4000/v1`
**Master Key**: Use `LITELLM_MASTER_KEY` environment variable.

---

## 2. Approved Model Standards

### 🧠 Reasoning & Complex Tasks (Tier 1)
| Provider | Model ID (LiteLLM) | Backend ID | Use Case |
|----------|-------------------|------------|----------|
| **Z.ai** | `zai-glm-4.7` | `glm-4.7` | **Primary**. Deep reasoning, coding, architecture. |
| **Google** | `gemini-2.5-pro` | `gemini-2.5-pro` | **Secondary**. Large context analysis, creative writing. |

### ⚡ Speed & Efficiency (Tier 2)
| Provider | Model ID (LiteLLM) | Backend ID | Use Case |
|----------|-------------------|------------|----------|
| **Z.ai** | `zai-glm-4.5-air` | `glm-4.5-air` | Chatbots, simple refactors, high volume. |
| **Google** | `gemini-2.5-flash` | `gemini-2.5-flash` | Multimodal (Vision), fast queries. |

### 🔒 Privacy / Local (Tier 3)
| Provider | Model ID (LiteLLM) | Backend ID | Use Case |
|----------|-------------------|------------|----------|
| **Ollama** | `qwen2.5-7b` | `qwen2.5:7b-instruct...` | General local assist (No data egress). |
| **Ollama** | `llama3.2-3b` | `llama3.2:3b` | fast local chat. |

---

## 3. Configuration Mandates

### Z.ai Integration (Coding Plan)
- **Endpoint**: `https://api.z.ai/api/coding/paas/v4`
- **Key source**: `ZAI_API_KEY`
- **Warning**: Do NOT use standard `open.bigmodel.cn` endpoints.

### Google Gemini Integration
- **Endpoint**: Google AI Studio (Pro Plan)
- **Key source**: `GEMINI_API_KEY` (unified with `GOOGLE_API_KEY`)
- **Warning**: Do NOT use `gemini-1.5` or `gemini-2.0-flash-exp`. Use **2.5**.

---

## 4. Exception Protocol
If your service cannot use the Gateway:
1.  **Register Exception**: Log in `AI_PERFECT_STATE.md`.
2.  **Use Envs**: Consume `ZAI_API_KEY` or `GEMINI_API_KEY` from environment, do not hardcode.
3.  **Document**: Add a note in the service's `README.md` or Context file.

---

> **End of Mandate**
> *Violations of this mandate may result in quota exhaustion or billing errors.*
