from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
from gemini_genre_and_age_analysis import helper_analyze_content

app = FastAPI()

# Base directory for temporary storage
BASE_TEMP_DIR = Path("Clean-Feed/temp")

@app.post("/upload/")
async def upload_file(
    background_tasks: BackgroundTasks,
    userId: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        user_dir = BASE_TEMP_DIR / userId
        user_dir.mkdir(parents=True, exist_ok=True)

        file_location = user_dir / file.filename

        # Save uploaded file to disk
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 👇 Background analysis task
        background_tasks.add_task(helper_analyze_content, userId, file_location)

        return JSONResponse(
            status_code=200,
            content={"message": "File uploaded successfully", "file_path": str(file_location)}
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
