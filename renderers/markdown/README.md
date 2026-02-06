This directory contains the default markdown implementations for A2UI.

* `markdown-it-shared` is a shared markdown renderer that uses markdown-it and
  DOMPurify to render markdown content in general.
* `markdown-it-lit` is the Lit facade of the markdown renderer for Lit.
* `markdown-it-angular` is the Angular facade of the markdown renderer
  for Angular.

Users should use the facade packages in their apps. There's nothing of interest
in the shared renderer package.
