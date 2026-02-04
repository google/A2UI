/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import MarkdownIt from 'markdown-it';

/**
 * Markdown renderer that applies theme classes to rendered elements.
 */
export class MarkdownRenderer {
	private md: MarkdownIt;

	constructor() {
		this.md = new MarkdownIt({
			html: false,
			linkify: true,
			typographer: true
		});
	}

	/**
	 * Render markdown to HTML with optional theme class mappings.
	 * @param content The markdown content to render
	 * @param classMap Optional mapping of HTML tags to CSS classes
	 */
	render(content: string, classMap?: Record<string, string[]>): string {
		let html = this.md.render(content);

		if (classMap) {
			// Apply classes to HTML tags
			for (const [tag, classes] of Object.entries(classMap)) {
				if (classes && classes.length > 0) {
					const classString = classes.join(' ');
					// Match opening tags and add classes
					const regex = new RegExp(`<${tag}(?=[\\s>])`, 'gi');
					html = html.replace(regex, `<${tag} class="${classString}"`);
				}
			}
		}

		return html;
	}

	/**
	 * Render markdown inline (without wrapping paragraph tags).
	 */
	renderInline(content: string, classMap?: Record<string, string[]>): string {
		let html = this.md.renderInline(content);

		if (classMap) {
			for (const [tag, classes] of Object.entries(classMap)) {
				if (classes && classes.length > 0) {
					const classString = classes.join(' ');
					const regex = new RegExp(`<${tag}(?=[\\s>])`, 'gi');
					html = html.replace(regex, `<${tag} class="${classString}"`);
				}
			}
		}

		return html;
	}
}

/**
 * Shared markdown renderer instance.
 */
export const markdownRenderer = new MarkdownRenderer();
