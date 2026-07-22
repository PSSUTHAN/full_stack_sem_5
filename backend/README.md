# RAG Chatbot Backend (Gemini API)

This backend provides a Flask API for the RAG-based chatbot using Google Gemini.

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend` directory and add your Gemini API key:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> **Get a Gemini API key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Create Knowledge Base

Run the data ingestion script to create the knowledge base from your website:

```bash
python ingest_data.py
```

This will:
- Extract content from all HTML files
- Create a JSON knowledge base file
- Store company information and FAQs

### 4. Start the API Server

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### GET /health
Health check endpoint.

### POST /chat
Send a message to the chatbot.

**Request:**
```json
{
  "message": "What services do you offer?"
}
```

**Response:**
```json
{
  "response": "We offer residential construction, commercial buildouts...",
  "sources": ["index.html", "company_info"]
}
```

### POST /clear
Clear conversation history.

### POST /regenerate-embeddings
Regenerate all document embeddings.

## How It Works

1. **Semantic Search**: Uses Gemini's embedding model for intelligent document retrieval.
2. **Retrieval Augmented Generation**: Combines your website content with AI for accurate responses.
3. **Conversational Memory**: Remembers context from previous messages.

## Customization

### Change Chat Colors
The chatbot's appearance is controlled in the frontend components. If using the legacy `chatbot.css`, you would modify variables there. In the current React frontend, styles are managed via Tailwind in `frontend/src/index.css`.

### Add More Content
To add more knowledge to the chatbot:
1. Edit `backend/ingest_data.py`.
2. Add custom docs or update the scraping logic.
3. Run `python ingest_data.py` again.
4. Call `/regenerate-embeddings` or restart the server.

## Production Deployment

For production use:
1. Set `debug=False` in `backend/app.py`.
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
3. Enable HTTPS.
4. Consider adding rate limiting.

## Troubleshooting

- Make sure your Gemini API key is set correctly in `.env`.
- Run `ingest_data.py` first to create the knowledge base.
- Check that `knowledge_base.json` exists in the backend directory.
- Run `test_gemini.py` to verify API connectivity.
