/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.a2ui.conformance

import java.io.File

object ConformanceTestHelper {
  val repoRoot: File by lazy { findRepoRoot() }

  private const val SPECIFICATION_DIR = "specification"
  const val CONFORMANCE_DIR_PATH = "agent_sdks/conformance/"

  private fun findRepoRoot(): File {
    var currentDir: File? = File(System.getProperty("user.dir"))
    while (currentDir != null) {
      if (File(currentDir, SPECIFICATION_DIR).isDirectory) {
        return currentDir
      }
      currentDir = currentDir.parentFile
    }
    throw IllegalStateException(
      "Could not find repository root containing specification directory."
    )
  }

  fun getConformanceFile(filename: String): File {
    return File(repoRoot, "$CONFORMANCE_DIR_PATH$filename")
  }

  fun getConformanceDir(): File {
    return File(repoRoot, CONFORMANCE_DIR_PATH)
  }
}
