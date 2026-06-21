# PaperTrail

PaperTrail is a binary file version control system designed to efficiently manage and track changes to binary files. It is currently integrated with Supabase for storage and utilizes SHA hashing for file integrity and deduplication.

## Features
- Version control for binary files
- Supabase integration for cloud storage
- SHA-based file integrity and deduplication
- Easy to use and extend

## Roadmap
- Support for additional storage backends
- Improved CLI and UI
- Advanced versioning features

## Running the app
- Start both services with `run-papertrail.ps1` from the repository root.
- The script opens one console for the FastAPI backend and one for the Vite frontend.

## Vercel deployment
- Deploy `papertrail-frontend` as one Vercel project.
- Deploy the repository root as a separate Vercel Python service for the FastAPI backend.
- Set `VITE_API_URL` in the frontend project to the backend service URL.
- Set `SUPABASE_URL`, `SUPABASE_KEY`, and `CORS_ORIGINS` in the backend project.
- The frontend already includes a rewrite rule so React Router routes load correctly on refresh.


