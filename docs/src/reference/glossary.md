# Glossary

Key terms and definitions used throughout Seashore.

## A

### Agent
An AI-powered program that can reason, use tools, and interact with users to accomplish tasks. Seashore supports ReAct agents (autonomous) and workflow agents (structured).

### Agent Run
A single execution of an agent with input messages, producing a response.

### Adapter
A unified interface for working with different LLM providers (OpenAI, Anthropic, Gemini).

## C

### Chunk
A portion of a document after splitting. Chunks are sized for optimal embedding and retrieval.

### Context Window
The maximum amount of text (in tokens) that an LLM can process at once.

### Conversation Thread
A persistent sequence of messages between a user and an agent, stored in the database.

## D

### Document
A piece of content (text, markdown, PDF) that has been loaded and processed for RAG.

## E

### Embedding
A vector representation of text that captures semantic meaning, used for similarity search.

## H

### HNSW
Hierarchical Navigable Small World - an algorithm for efficient approximate nearest neighbor search in vector databases.

### Hybrid Search
Combining vector similarity search with full-text search for improved retrieval accuracy.

## L

### LLM
Large Language Model - AI models like GPT-4, Claude, and Gemini that understand and generate text.

### Tool Loop
The iterative process where an agent calls tools, observes results, and continues until a task is complete.

## M

### MCP
Model Context Protocol - a standard for connecting agents to external tools and resources.

### Memory
Information storage across different time horizons: short-term (current session), mid-term (summaries), and long-term (persistent knowledge).

### Message
A single communication in a conversation, with a role (user, assistant, system, tool) and content.

## O

### Observability
The ability to monitor and trace agent executions, including logs, metrics, and distributed tracing.

## P

### Prompt Injection
A security vulnerability where malicious input attempts to manipulate an agent's behavior.

### PII
Personally Identifiable Information - sensitive data that should be protected or redacted.

## R

### RAG
Retrieval-Augmented Generation - enhancing LLM responses with retrieved context from a knowledge base.

### ReAct
A reasoning pattern where agents think (Reason), act (Action), and observe (Observation) in a loop.

### Repository Pattern
A data access pattern that encapsulates database operations, used in `@seashore/storage`.

### Retriever
A component that searches a vector database for relevant documents based on a query.

## S

### Schema
A definition of data structure, often using Zod for runtime validation and TypeScript for compile-time checking.

### Splitter
A component that divides documents into smaller chunks for better retrieval.

### Stream Chunk
A piece of data emitted during streaming, such as text content or tool call status.

### System Prompt
Instructions that define an agent's behavior, personality, and constraints.

## T

### Temperature
A parameter (0-2) controlling LLM output randomness. Lower = more focused, higher = more creative.

### Tool
A function that an agent can call with parameters to perform actions.

### Tool Call
A single invocation of a tool by an agent, including the tool name, arguments, and result.

### Trace
A record of an execution path through an agent or workflow, used for observability and debugging.

### Token
The basic unit of text that LLMs process. Roughly 4 characters equals 1 token.

## V

### Vector Database
A database optimized for storing and searching high-dimensional vectors (embeddings).

## W

### Workflow
A directed graph of nodes that process data in sequence or parallel, defining a structured execution path.

### Workflow Node
A single step in a workflow, such as an LLM call, tool execution, or conditional branch.

## Z

### Zod
A TypeScript-first schema validation library used throughout Seashore for runtime type checking.
