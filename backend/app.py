"""
Flask API server for RAG chatbot using Google Gemini.
Enhanced with vector embeddings for semantic search.
"""

import os
import json
import sqlite3
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database Setup
DB_NAME = "users.db"

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'client',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        # Simple migration for existing DB
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'")
        except sqlite3.OperationalError:
            pass # Column already exists
        conn.commit()
    print("DONE: Database initialized")

# Initialize DB on startup
init_db()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment variables!")
genai.configure(api_key=api_key)

# Load knowledge base
knowledge_base_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
embeddings_path = os.path.join(os.path.dirname(__file__), "embeddings.json")
knowledge_base = []
document_embeddings = []

def load_knowledge_base():
    """Load knowledge base from JSON file."""
    global knowledge_base
    try:
        with open(knowledge_base_path, 'r', encoding='utf-8') as f:
            knowledge_base = json.load(f)
        print(f"DONE: Loaded {len(knowledge_base)} documents from knowledge base")
    except FileNotFoundError:
        print("WARNING: knowledge_base.json not found. Run ingest_data.py first!")

def load_embeddings():
    """Load pre-computed embeddings if available."""
    global document_embeddings
    try:
        with open(embeddings_path, 'r', encoding='utf-8') as f:
            document_embeddings = json.load(f)
        print(f"DONE: Loaded {len(document_embeddings)} document embeddings")
        return True
    except FileNotFoundError:
        print("WARNING: Embeddings not found. Will generate on first query...")
        return False

def get_embedding(text):
    """Get embedding for a piece of text using Gemini's embedding model."""
    try:
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def generate_all_embeddings():
    """Generate embeddings for all documents in knowledge base."""
    global document_embeddings
    document_embeddings = []
    
    print("🔄 Generating embeddings for all documents...")
    for i, doc in enumerate(knowledge_base):
        text = f"{doc['title']}: {doc['content']}"
        embedding = get_embedding(text)
        if embedding:
            document_embeddings.append({
                'index': i,
                'embedding': embedding
            })
        print(f"  Processed {i+1}/{len(knowledge_base)}")
    
    # Save embeddings for future use
    try:
        with open(embeddings_path, 'w', encoding='utf-8') as f:
            json.dump(document_embeddings, f)
        print(f"DONE: Saved {len(document_embeddings)} embeddings")
    except Exception as e:
        print(f"Error saving embeddings: {e}")

def semantic_search(query, top_k=3):
    """Search knowledge base using semantic similarity."""
    global document_embeddings
    
    # Generate embeddings if not available
    if not document_embeddings:
        generate_all_embeddings()
    
    if not document_embeddings:
        # Fallback to keyword search if embedding fails
        return keyword_search(query, top_k)
    
    try:
        # Get query embedding
        query_embedding = genai.embed_content(
            model="models/gemini-embedding-001",
            content=query,
            task_type="retrieval_query"
        )['embedding']
        
        # Calculate similarities
        similarities = []
        for doc_emb in document_embeddings:
            similarity = cosine_similarity(
                [query_embedding], 
                [doc_emb['embedding']]
            )[0][0]
            similarities.append({
                'index': doc_emb['index'],
                'similarity': similarity
            })
        
        # Sort by similarity and get top results
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        top_results = similarities[:top_k]
        
        # Return corresponding documents
        return [knowledge_base[r['index']] for r in top_results]
    
    except Exception as e:
        print(f"Semantic search error: {e}")
        return keyword_search(query, top_k)

def keyword_search(query, top_k=3):
    """Fallback keyword-based search in knowledge base."""
    query_lower = query.lower()
    results = []
    
    for doc in knowledge_base:
        content = doc['content'].lower()
        score = 0
        query_words = query_lower.split()
        for word in query_words:
            if len(word) > 3:
                score += content.count(word)
        
        if score > 0:
            results.append({
                'doc': doc,
                'score': score
            })
    
    results.sort(key=lambda x: x['score'], reverse=True)
    return [r['doc'] for r in results[:top_k]]

# Initialize Gemini model - using latest model
model = genai.GenerativeModel('gemini-2.5-flash')

# Store conversation history per session (simple in-memory storage)
conversation_histories = {}

# System prompt for the chatbot
SYSTEM_PROMPT = """You are a helpful, friendly AI assistant for Engineers Veedu, a professional construction contractor company based in India.

Your role is to:
1. Help customers learn about our construction services
2. Answer questions about our projects and expertise
3. Provide information about quotes and consultations
4. Be professional yet warm and approachable

Key information about Engineers Veedu:
- Over 10 years of experience in construction
- Services: residential construction, commercial buildouts, renovations, foundation work, structural engineering
- Service areas: Chennai, Coimbatore, and Madurai regions
- Certified and insured contractor
- Contact: Phone +1 (555) 123-4567, Email support@contractorpro.com
- Hours: Monday-Friday 8AM-6PM EST

Guidelines:
- Use the provided context to answer questions accurately
- Keep responses concise but helpful (2-4 sentences typically)
- Use emojis sparingly to add friendliness 
- If you don't know something specific, encourage them to contact us
- Never make up information about pricing or timelines
- Always maintain a professional, trustworthy tone"""


@app.route('/')
def serve_index():
    """Serve the main website from the React build folder."""
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
    if os.path.exists(os.path.join(dist_dir, 'index.html')):
        return send_from_directory(dist_dir, 'index.html')
    else:
        return jsonify({
            "status": "pending",
            "message": "Frontend not built yet. Run 'npm run build' in the frontend directory."
        })


@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from the React build folder."""
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
    return send_from_directory(dist_dir, filename)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy", 
        "message": "Chatbot API is running",
        "knowledge_base_size": len(knowledge_base),
        "embeddings_loaded": len(document_embeddings) > 0
    })

# --- AUTH ENDPOINTS ---

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'client') # Default to client

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    hashed_password = generate_password_hash(password)

    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", (email, hashed_password, role))
            conn.commit()
        return jsonify({"message": "User registered successfully", "role": role}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

    # User indexes: 0:id, 1:email, 2:password, 3:role, 4:created_at
    if user and check_password_hash(user[2], password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user[0], 
                "email": user[1],
                "role": user[3] if len(user) > 3 else "client"
            },
            "token": "mock-jwt-token-xyz-123" 
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route('/profile', methods=['GET'])
def get_profile():
    # In a real app, verify the token. Here we mock it based on email query param for demo purposes
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Unauthorized - Provide email as query param for mock profile demo"}), 401
    
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
    
    if user:
        return jsonify({
            "id": user[0],
            "email": user[1],
            "role": user[2],
            "username": user[1].split('@')[0] # Using email prefix as username
        })
    return jsonify({"error": "User not found"}), 404

# --- CHATBOT ENDPOINTS ---

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat requests with RAG (Retrieval Augmented Generation).
    Expected JSON: {"message": "user message", "session_id": "optional_session_id"}
    """
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Get conversation history for this session
        if session_id not in conversation_histories:
            conversation_histories[session_id] = []
        history = conversation_histories[session_id]
        
        # Search knowledge base for relevant context using semantic search
        relevant_docs = semantic_search(user_message, top_k=3)
        
        # Build context from relevant documents
        context = "\n\n".join([
            f"📄 {doc['title']}:\n{doc['content']}"
            for doc in relevant_docs
        ])
        
        # Build conversation context
        conv_context = ""
        if history:
            recent_history = history[-4:]  # Last 2 exchanges
            conv_context = "\n\nRecent conversation:\n"
            for h in recent_history:
                conv_context += f"Customer: {h['question']}\nAssistant: {h['answer']}\n"
        
        # Create the full prompt
        full_prompt = f"""{SYSTEM_PROMPT}

---
Relevant Context from Our Website:
{context}
{conv_context}
---

Customer Question: {user_message}

Please provide a helpful, friendly response:"""
        
        # Get response from Gemini
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=500,
            )
        )
        answer = response.text.strip()
        
        # Track sources
        sources = [doc['source'] for doc in relevant_docs]
        
        # Add to conversation history
        history.append({
            'question': user_message,
            'answer': answer
        })
        
        # Keep only last 10 exchanges per session
        if len(history) > 10:
            conversation_histories[session_id] = history[-10:]
        
        return jsonify({
            "response": answer,
            "sources": sources
        })
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "I apologize, but I'm having trouble processing your request. Please try again or contact us directly.",
            "details": str(e)
        }), 500


@app.route('/clear', methods=['POST'])
def clear_history():
    """Clear conversation history for a session."""
    try:
        data = request.json or {}
        session_id = data.get('session_id', 'default')
        
        if session_id in conversation_histories:
            conversation_histories[session_id] = []
        
        return jsonify({"message": "Conversation history cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/regenerate-embeddings', methods=['POST'])
def regenerate_embeddings():
    """Regenerate all document embeddings."""
    try:
        generate_all_embeddings()
        return jsonify({
            "message": "Embeddings regenerated successfully",
            "count": len(document_embeddings)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Initialize on startup
load_knowledge_base()
load_embeddings()

print("Chatbot initialized successfully!")


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
