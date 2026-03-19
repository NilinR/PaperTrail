#for the web appl
from fastapi import FastAPI, UploadFile, File,HTTPException
#to load the env vars
from dotenv import load_dotenv
import os
#for the sha256
import hashlib
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

#MIME file check
Allowed_types=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

app = FastAPI()

#decorator for the root endpoint
@app.get("/")
def root():
    return {"message": "Papertrail API is running"}

@app.post("/upload")
#... elipsis that indicates that the parameter is required
async def upload_file(file: UploadFile= File(...), message: str=""):

    #400 is bad req type
    if file.content_type not in Allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    #ask to stop as its in async 
    contents=await file.read()

    #actual sha256 output is binary, convert to hex
    file_hash=hashlib.sha256(contents).hexdigest()

    #see if it already exists
    existing=supabase.table("file_versions").select("*").eq("file_hash",file_hash).execute()
    if existing.data:
        return {"message": "File already exists", "version": existing.data[0]}
    
    #check which version it is
    same_name=supabase.table("file_versions").select("version").eq("original_name",file.filename).order("version", desc=True).limit(1).execute()
    next_version=same_name.data[0]["version"]+1 if same_name.data else 1

    #build storage path
    storage_path=f"{file_hash}_{file.filename}/v{next_version}_{file.filename}"

    #upload to supabase storage
    supabase.storage.from_("papertrail-files").upload(path=storage_path, file=contents, file_options={"content-type": file.content_type})

    #save metadata to db
    record=supabase.table("file_versions").insert({
        "original_name": file.filename,
        "storage_path": storage_path,
        "version": next_version,
        "file_hash": file_hash,
        "file_size": len(contents),
        "file_type": file.content_type,
        "message": message
    }).execute()

    return {"message": "File uploaded successfully", "version": record.data[0]} 

@app.get("files/{file_id}/versions")
def get_versions(filename: str):
    result=supabase.table("file_versions").select("*").eq("original_name", filename).order("version", desc=False).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="File not found")
    return {"versions": result.data}
