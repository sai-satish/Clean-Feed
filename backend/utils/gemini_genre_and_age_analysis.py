from pathlib import Path
import json
import os
from dotenv import load_dotenv
import mimetypes
from PIL import Image
import google.generativeai as genai
load_dotenv()


# Load API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Define your custom prompt
PROMPT_TEMPLATE = """
You are a smart media classifier and content advisor with deep familiarity with the MovieLens dataset.

You will be given a visual media clip. Based on the content, answer the following:

1. **Age Group Classification**:
   - What is the most appropriate age group for the content?
   - Choose from standard ranges (e.g., "1-2", "2-4", "4-7", "6-10", "10-15", "13-18", "18-25", "25-40", "40+")

2. **Tags Prediction**:
   - Suggest 3–7 descriptive tags **from the MovieLens dataset only**.
   - Do not invent new tags. Use only tags known in the dataset.
   - If fewer than 3 are confidently possible, provide as many as appropriate. 
   - Mostly the tags should be from MovieLens dataset, if there are new tags also include with them but mostly the old tags should be suggested based on the MovieLens dataset only

3. **Genre Classification**:
   - Identify 3–7 genres that the content likely belongs to.
   - Genres must be chosen **strictly from this list** (MovieLens genres):
     - Action, Adventure, Animation, Children's, Comedy, Crime, Documentary, Drama, Fantasy, Film-Noir, Horror, Musical, Mystery, Romance, Sci-Fi, Thriller, War, Western, Technology, Education(no genres listed)
   - No new genres should be predicted.

Respond strictly in the following JSON format:

```json
{
  "age_group": "start_age - end_age",
  "tags": ["tag1", "tag2", "tag3"],
  "genres": ["genre1", "genre2"]
}"""

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
            prompt_parts.append(genai.upload_file(file_path))
        except Exception as e:
            print(f"Error reading file: {e}")
            return {"error": "Failed to read file"}

    try:
        response = await model.generate_content_async(prompt_parts)

        response.resolve()

        text = response.text.strip()

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
