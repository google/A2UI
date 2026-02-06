Markdown renderer for A2UI using markdown-it and dompurify.

This is used across all JS renderers, so the configuration is consistent. Each
renderer has a specific facade package that uses this renderer as a dependency.

End users should use the facade package for their renderer of choice. 
