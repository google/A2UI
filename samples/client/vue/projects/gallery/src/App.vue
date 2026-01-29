<!--
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
 -->

<script setup lang="ts">
import { ref } from 'vue';
import { provideA2UI, DEFAULT_CATALOG } from '@a2ui/vue';
import { theme } from './theme';
import LibraryView from './components/LibraryView.vue';
import GalleryView from './components/GalleryView.vue';

// Provide A2UI configuration
provideA2UI({
  catalog: DEFAULT_CATALOG,
  theme,
});

const currentView = ref<'library' | 'gallery'>('library');

function setView(view: 'library' | 'gallery') {
  currentView.value = view;
}
</script>

<template>
  <div class="app">
    <header class="home-page-header">
      <p>A2UI Gallery</p>
      <nav class="app-nav">
        <ul>
          <li><a @click="setView('library')">Library</a></li>
          <li><a @click="setView('gallery')">Gallery</a></li>
          <li><a href="https://github.com/google/A2UI" target="_blank">GitHub</a></li>
        </ul>
      </nav>
    </header>
    <section>
      <div class="hero-message">
        <h1>A2UI Component Gallery</h1>
        <p>Building blocks and examples for Agent Driven UIs</p>
      </div>
      <section>
        <GalleryView v-if="currentView === 'gallery'" />
        <LibraryView v-else />
      </section>
    </section>
  </div>
</template>

<style scoped>
.home-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.app-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 16px;
}

.app-nav li {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.app-nav li:hover {
  background-color: #eee;
}

.app-nav li a {
  text-decoration: none;
  color: inherit;
}

.hero-message {
  font-weight: bold;
  text-align: center;
}

.hero-message h1 {
  font-size: 3rem;
}

.hero-message p {
  font-size: 1.5rem;
  font-weight: lighter;
}
</style>
