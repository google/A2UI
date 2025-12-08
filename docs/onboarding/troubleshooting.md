# Troubleshooting

Here are some common issues and their solutions.

## LiteLLM / Vertex AI Issues

**Issue**: "Can't run Restaurant finder application with GEMINI_API_KEY - LiteLLM tries to use Vertex credentials"

**Solution**:
- Ensure you have a valid `GEMINI_API_KEY` in your `.env` file.
- If using Vertex AI, ensure you are logged in with `gcloud auth login` and `gcloud auth application-default login`.

## Authentication Errors

**Issue**: "artifact-foundry-prod ... could not be queried due to a lack of valid authentication credentials (401 Unauthorized)"

**Solution**:
- This is often caused by a stale or incorrect `uv.lock` file trying to access a private registry.
- **Fix**: Remove the `uv.lock` file in the root folder (`a2a_agents`) or the specific sample folder and re-run `uv run .`.

## Web Client Issues

**Issue**: Flutter web client not working.

**Solution**:
- The Flutter client currently has dependencies that are not compatible with the web platform. Use the MacOS desktop app or iOS/Android simulators instead.
- For a web client, use the **Lit client**.
