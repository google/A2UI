from agent import InstrumentedLiteLlm
from google.adk.models.lite_llm import LiteLlm

def test_copy():
    model = InstrumentedLiteLlm(model="test")
    copied = model.copy()
    print(f"Original type: {type(model)}")
    print(f"Copied type: {type(copied)}")
    
    if isinstance(copied, InstrumentedLiteLlm):
        print("Copy preserves class.")
    else:
        print("Copy DOES NOT preserve class.")

if __name__ == "__main__":
    test_copy()
