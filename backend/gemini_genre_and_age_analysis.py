from pathlib import Path
import json
import os
from dotenv import load_dotenv
import mimetypes
from PIL import Image
import google.generativeai as genai
# from google.generativeai import types
load_dotenv()


# Load API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Define your custom prompt
PROMPT_TEMPLATE = """
You are a smart media classifier and content advisor.

Analyze this visual content and answer:

1. What is the most appropriate **age group** for the content? (e.g., "1-2", "2-4", "4-7", "6-10", "10-15", "13-18", "18-25", ...)
2. Suggest **3–7 tags** that describe the content. if not possbile to suggest more tags just give me
3. Identify potential **genres** it belongs to (e.g., Comedy, Education, Horror, Thriller, Sports, Documentary, etc.)

Respond in JSON format like:
{
  "age_group": "start_age - end_age",
  "tags": ["string", ...],
  "genres": ["string", ...]
}
"""

def get_mime_type(file_path: Path) -> str:
  mime_type, _ = mimetypes.guess_type(str(file_path))
  return mime_type or "application/octet-stream"


async def analyze_content(file_path: Path) -> dict:
    model = genai.GenerativeModel(model_name="gemini-1.5-pro")
    mime_type = get_mime_type(file_path)
    prompt_parts = [PROMPT_TEMPLATE]

    if mime_type.startswith("image/"):
        try:
            image = Image.open(file_path)
            prompt_parts.append(image)
        except Exception as e:
            print(f"Error loading image: {e}")
            return {"error": "Failed to load image"}
    else:
        try:
            # with open(file_path, "rb") as file:
            #     data = file.read()
            # prompt_parts.append(data)
            prompt_parts.append(genai.upload_file(file_path))
        except Exception as e:
            print(f"Error reading file: {e}")
            return {"error": "Failed to read file"}

    try:
        response = await model.generate_content_async(prompt_parts)

        # ✅ Correct call (not awaitable)
        response.resolve()

        text = response.text.strip()
        # print("Response text:", text)

        # Try to extract the JSON part
        json_start = text.find("{")
        json_end = text.rfind("}") + 1
        if json_start != -1 and json_end != -1:
            json_data = text[json_start:json_end]
            try:
                return json.loads(json_data)
            except json.JSONDecodeError as e:
                return {
                    "error": "Failed to decode JSON",
                    "details": str(e),
                    "raw_text": text
                }
        else:
            return {"error": "JSON content not found in Gemini response"}

    except Exception as e:
        print(f"Gemini API error: {e}")
        return {"error": f"Failed to get response from Gemini: {e}"}



async def helper_analyze_content(user_id: str, file_path: Path):
    try:
        # Call Gemini analysis
        analysis_result = await analyze_content(file_path)

        if "error" not in analysis_result:
            # Save metadata in a sidecar .json file
            metadata_file = file_path.with_suffix(file_path.suffix + ".metadata.json")

            with open(metadata_file, "w") as f:
                json.dump(analysis_result, f, indent=4)

            print(f"Metadata saved to: {metadata_file}")
        else:
            print(f"Analysis failed for {file_path}: {analysis_result['error']}")

    except Exception as e:
        print(f"Error in helper_analyze_content: {e}")