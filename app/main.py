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

#get the version of file by name
@app.get("/files/{filename}/versions")
def get_versions(filename: str):
    result=supabase.table("file_versions").select("*").eq("original_name", filename).order("version", desc=False).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="File not found")
    return {
        "filename": filename,
        "total_versions": len(result.data),
        "versions": result.data
    }

#download the file
@app.get("/files/{filename}/download/{version}")
def download_version(filename: str, version: int):
    result=supabase.table("file_versions").select("*").eq("original_name", filename).eq("version", version).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="File version not found")
    
    record=result.data[0]

    #temporary signed URL for download, expires in 1 hour
    signed = supabase.storage.from_("papertrail-files").create_signed_url(record["storage_path"], expires_in=3600)   

    return {
        "filename": filename, 
        "version": version, 
        "download_url": signed["signedURL"],
        "expires_in": "1hr",
        "metadata": record
    }

@app.post("/files/{filename}/rollback/{version}")
def rollback_version(filename: str, version: int, message: str = "Rollback"):
    result = supabase.table("file_versions").select("*").eq("original_name", filename).eq("version", version).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Version not found")
    
    old_record = result.data[0]

    #next version number should be
    latest = supabase.table("file_versions").select("version").eq("original_name", filename).order("version", desc=True).limit(1).execute()
    next_version = latest.data[0]["version"] + 1

    #download the old file from storage
    file_contents = supabase.storage.from_("papertrail-files").download(old_record["storage_path"])

    #upload it back as a new version
    new_storage_path = f"{filename}/v{next_version}_{filename}"
    supabase.storage.from_("papertrail-files").upload(
        path=new_storage_path,
        file=file_contents,
        file_options={"content-type": old_record["file_type"]}
    )

    new_record = supabase.table("file_versions").insert({
        "original_name": filename,
        "storage_path": new_storage_path,
        "version": next_version,
        "file_hash": old_record["file_hash"],
        "file_size": old_record["file_size"],
        "file_type": old_record["file_type"],
        "message": f"{message} (from v{version})"
    }).execute()

    return {
        "message": f"Rolled back to v{version}, saved as v{next_version}",
        "new_version": next_version,
        "data": new_record.data[0]
    }

