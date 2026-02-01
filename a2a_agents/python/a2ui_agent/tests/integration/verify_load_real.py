import sys

from a2ui.inference.schema.manager import A2uiSchemaManager


def verify():
  print("Verifying A2uiSchemaManager...")
  try:
    manager = A2uiSchemaManager("0.8")
    print(
        f"Successfully loaded 0.8: {len(manager.catalog_schema.get('components', {}))}"
        " components"
    )
    print(
        "Components found:"
        f" {list(manager.catalog_schema.get('components', {}).keys())[:5]}..."
    )
  except Exception as e:
    print(f"Failed to load 0.8: {e}")
    sys.exit(1)

  try:
    manager = A2uiSchemaManager("0.9")
    print(
        f"Successfully loaded 0.9: {len(manager.catalog_schema.get('components', {}))}"
        " components"
    )
    print(
        "Components found:"
        f" {list(manager.catalog_schema.get('components', {}).keys())}..."
    )
  except Exception as e:
    print(f"Failed to load 0.9: {e}")
    sys.exit(1)


if __name__ == "__main__":
  verify()
