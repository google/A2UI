# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
import json
import logging
import os
import shutil
from agent import ContactAgent
from a2ui.schema.constants import VERSION_0_8

logging.basicConfig(level=logging.INFO)


def save_messages_with_image_copies(messages: list, image_base_url: str, out_path: str):
  """
  Saves the A2UI messages payload to the composer tools directory, copies any
  local agent images to the composer's public assets folder, and rewrites the
  JSON payload URLs to use the new public Next.js paths.
  """
  agent_dir = os.path.basename(os.path.abspath("."))
  src_images = "images"
  dest_images = f"../../../../tools/composer/public/images/{agent_dir}"

  # Copy images if they exist
  if os.path.exists(src_images):
    os.makedirs(dest_images, exist_ok=True)
    for file in os.listdir(src_images):
      src_path = os.path.join(src_images, file)
      dest_path = os.path.join(dest_images, file)
      if os.path.isfile(src_path):
        if os.path.exists(dest_path):
          print(f"Skipping {file}, already exists in {dest_images}")
          continue
        shutil.copy2(src_path, dest_images)
    print(f"Copied new images from {src_images} to {dest_images}")

  # Update JSON payload to use the new public asset paths
  json_str = json.dumps(messages, indent=2)
  # We replace the local serving url with the Next.js public URL
  json_str = json_str.replace(image_base_url, f"/images/{agent_dir}/")

  with open(out_path, "w") as f:
    f.write(json_str)
  print(f"Recorded {len(messages)} A2UI message parts to {out_path}")


async def main():
  base_url = "http://localhost:10006"
  agent = ContactAgent(base_url=base_url)
  query = "Find Alex in Marketing"
  session_id = "test_session_2"

  print(f"Running agent with query: {query}")

  messages = []

  async for event in agent.stream(query, session_id, ui_version=VERSION_0_8):
    parts = event.get("parts", [])
    for p in parts:
      if p.root.metadata and p.root.metadata.get("mimeType") == "application/json+a2ui":
        # Some payloads are already a list, some are dicts
        if isinstance(p.root.data, list):
          messages.extend(p.root.data)
        else:
          messages.append(p.root.data)

  if messages:
    out_path = "../../../../tools/composer/src/data/dojo/contact-lookup.json"
    image_base_url = f"{base_url}/static/"
    save_messages_with_image_copies(messages, image_base_url, out_path)
  else:
    print("No A2UI messages produced.")


if __name__ == "__main__":
  asyncio.run(main())
