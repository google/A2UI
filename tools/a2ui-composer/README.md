# A2UI Composer
A tool for building A2UI widgets, powered by copilot kit. Run it yourself, or just go to https://a2ui-editor.ag-ui.com

![A2UI Composer](images/composer.png)

## Using the composer
Just ask the composer to build you a widget, have it make any changes you want, copy the json, and paste it into your components that you give to your a2ui enabled agent!

<video src="images/demo.mp4" controls width="100%"></video>


## Running the composer
You need a `GEMINI_API_KEY` or `OPENAI_API_KEY` in `apps/widget-builder/.env.local`.

Then, just install, build, and run!
```
pnpm i && pnpm build
pnpm dev
```
