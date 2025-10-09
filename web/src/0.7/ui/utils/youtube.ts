/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export function isEmbedUri(uri: string | null): boolean {
  if (!uri) {
    return false;
  }

  return /^https:\/\/www\.youtube\.com\/embed\//.test(uri);
}

export function isShareUri(uri: string | null): boolean {
  if (!uri) {
    return false;
  }

  return /^https:\/\/youtu\.be\//.test(uri);
}

export function isWatchUri(uri: string): boolean {
  return /^https:\/\/www\.youtube\.com\/watch\?v=/.test(uri);
}

export function isShortsUri(uri: string): boolean {
  return /^https:\/\/www\.youtube\.com\/shorts\//.test(uri);
}

export function convertShareUriToEmbedUri(uri: string) {
  const regex = /^https:\/\/youtu\.be\/(.*?)(?:[&\\?]|$)/;
  const matches = regex.exec(uri);
  if (!matches) {
    return null;
  }

  const embedId = matches[1];
  return `https://www.youtube.com/embed/${embedId}`;
}

export function convertWatchOrShortsUriToEmbedUri(uri: string) {
  const regex =
    /^https:\/\/www\.youtube\.com\/(?:shorts\/|embed\/|watch\?v=)(.*?)(?:[&\\?]|$)/;
  const matches = regex.exec(uri);
  if (!matches) {
    return null;
  }

  const embedId = matches[1];
  return `https://www.youtube.com/embed/${embedId}`;
}

export function videoIdFromWatchOrShortsOrEmbedUri(uri: string) {
  const regex =
    /^https:\/\/www\.youtube\.com\/(?:shorts\/|embed\/|watch\?v=)(.*?)(?:[&\\?]|$)/;
  const matches = regex.exec(uri);
  if (!matches) {
    return null;
  }

  return matches[1];
}

export function createWatchUriFromVideoId(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}
