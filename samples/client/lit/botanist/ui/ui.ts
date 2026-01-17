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

// UI components registry for Digital Botanist
import "@a2ui/lit/ui";

// Add global styling for broken images
const style = document.createElement("style");
style.textContent = `
  /* Fallback for broken images */
  a2ui-image img[src]:not([src=""]) {
    object-fit: cover;
  }
  
  a2ui-image .image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 120px;
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
    color: #81c784;
  }
  
  a2ui-image .image-fallback::before {
    content: "🌱";
    font-size: 48px;
  }
`;
document.head.appendChild(style);

// Global error handler for images
document.addEventListener("error", (e) => {
     const target = e.target as HTMLElement;
     if (target.tagName === "IMG" && target.closest("a2ui-image")) {
          // Hide the broken image and show a fallback
          const img = target as HTMLImageElement;
          const fallback = document.createElement("div");
          fallback.className = "image-fallback";
          img.style.display = "none";
          img.parentElement?.appendChild(fallback);
     }
}, true);
