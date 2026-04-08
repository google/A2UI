# A2UI Protocol Evolution Guide: v0.9 to v0.10

This document serves as a comprehensive guide to the changes between A2UI version 0.9 and version 0.10. It details the shifts in philosophy, architecture, and implementation, providing a reference for stakeholders and developers migrating between versions.

## 1. Executive Summary

Version 0.10 differs from 0.9 in the following ways:

- **Client-to-Server RPC**: Introduced `actionResponse` enabling synchronous responses to client-initiated actions. Added `actionId` for response correlation.
- <TBD>

## 2. Changes

### 2.1. Catalog Definition Schema

- <TBD>

### 2.2. Server-to-Client Message List Schema

- Added `ActionResponseMessage` to allow the server to respond to a specific action call using an `actionId`.
- <TBD>

### 2.3. Client-to-Server Message List Schema

- Added `actionId` to the `action` message properties, which the client generates if a response is expected (`wantResponse: true`).
- <TBD>

### 2.4. Client Capabilities Schema

- <TBD>

### 2.5. AgentCard

- <TBD>

### 2.6. Data Encoding

- <TBD>

### 2.7. Processing Rules

- <TBD>

### 2.8. Server-to-Client Messages

- Added `actionResponse` message structure to support synchronous responses with a `value` or `error`.
- <TBD>

### 2.9. Client-to-Server Events

- Updated `action` message to include `actionId`.
- Updated `Action` type in `common_types.json` to include `wantResponse` and `responsePath` on event triggers.
- <TBD>

## 3. Migration Guide

- <TBD>