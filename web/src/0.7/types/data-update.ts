/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable */

/**
 * A type representing any valid JSON value:
 * - string
 * - number
 * - boolean
 * - null
 * - A JSON array (DataArray)
 * - A JSON object (DataObject)
 */
export type DataValue =
  | string
  | number
  | boolean
  | null
  | DataArray
  | DataObject;

/**
 * A type representing a JSON array, which is an array of JsonValues.
 */
export interface DataArray extends Array<DataValue> {}

/**
 * A type representing a JSON object, which is a record of string keys
 * mapped to DataValues. This is the main type you'll use for an arbitrary JSON object.
 */
export type DataObject = Map<string, DataValue>;

/**
 * A schema for a DataModelUpdate message in the A2A streaming UI protocol. This message sets or replaces a part of the data model at a specified path with new content.
 */
export interface DataModelUpdateMessage {
  /**
   * An optional path to a location within the data model where the content should be inserted or replaced. The path is represented as a dot-separated string and can include array indexing (e.g., 'user.addresses[0].street'). If this field is omitted, the entire data model will be replaced with the provided 'contents'.
   */
  path?: string;
  /**
   * The JSON content to be placed at the specified path. This can be any valid JSON value (object, array, string, number, boolean, or null). The content at the target path will be completely replaced by this new value.
   */
  contents: {
    [k: string]: unknown;
  };
}
