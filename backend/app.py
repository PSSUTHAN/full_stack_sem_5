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
DB_NAME = os.path.join(os.path.dirname(__file__), "users.db")
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        # Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'client',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'")
        except sqlite3.OperationalError:
            pass # Column already exists

        # Projects Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                location TEXT NOT NULL,
                client_id INTEGER,
                contractor_id INTEGER,
                site_engineer_id INTEGER,
                budget TEXT,
                start_date TEXT,
                target_date TEXT,
                stage TEXT DEFAULT 'Planning',
                progress INTEGER DEFAULT 0,
                status TEXT DEFAULT 'In Progress',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id),
                FOREIGN KEY (contractor_id) REFERENCES users(id),
                FOREIGN KEY (site_engineer_id) REFERENCES users(id)
            )
        ''')

        # Daily Process Logs Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                stage TEXT NOT NULL,
                work_completed TEXT NOT NULL,
                progress_added INTEGER DEFAULT 0,
                labor_count INTEGER DEFAULT 0,
                materials_used TEXT,
                weather TEXT DEFAULT 'Clear / Sunny',
                issues_delay TEXT,
                site_photos TEXT,
                sub_tasks TEXT,
                labor_breakdown TEXT,
                materials_breakdown TEXT,
                quality_checks TEXT,
                inspection_status TEXT DEFAULT 'Verified',
                logged_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (logged_by) REFERENCES users(id)
            )
        ''')

        # Client Requests Table (Name, Site Address, Amount, Building Type, Required Details)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS client_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                site_address TEXT NOT NULL,
                amount TEXT NOT NULL,
                building_type TEXT NOT NULL,
                required_details TEXT,
                client_id INTEGER,
                target_user_id INTEGER,
                target_role TEXT DEFAULT 'contractor',
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id)
            )
        ''')

        # Migrations for existing DB
        for col_name, col_def in [
            ("sub_tasks", "TEXT"),
            ("labor_breakdown", "TEXT"),
            ("materials_breakdown", "TEXT"),
            ("quality_checks", "TEXT"),
            ("inspection_status", "TEXT DEFAULT 'Verified'")
        ]:
            try:
                cursor.execute(f"ALTER TABLE daily_logs ADD COLUMN {col_name} {col_def}")
            except sqlite3.OperationalError:
                pass

        # Seed default demo users if users table is empty
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            default_users = [
                ('client@demo.com', generate_password_hash('password123'), 'client'),
                ('contractor@engineersveedu.com', generate_password_hash('password123'), 'contractor'),
                ('engineer@engineersveedu.com', generate_password_hash('password123'), 'site_engineer'),
            ]
            cursor.executemany("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", default_users)
            print("DONE: Seeded 3 default role accounts (client, contractor, site_engineer)")

        # Fetch IDs for seeding demo project
        cursor.execute("SELECT id, role FROM users WHERE email IN ('client@demo.com', 'contractor@engineersveedu.com', 'engineer@engineersveedu.com')")
        user_map = {row[1]: row[0] for row in cursor.fetchall()}

        # Seed sample project if projects table is empty
        cursor.execute("SELECT COUNT(*) FROM projects")
        if cursor.fetchone()[0] == 0 and 'client' in user_map and 'contractor' in user_map and 'site_engineer' in user_map:
            cursor.execute('''
                INSERT INTO projects (
                    name, description, location, client_id, contractor_id, site_engineer_id,
                    budget, start_date, target_date, stage, progress, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                "Greenwood Modern Villa",
                "Construction of a 3,800 sq ft 4-BHK contemporary residence with earthquake-resistant RCC frame, solar roofing, and custom architectural woodwork.",
                "Saravanampatti, Coimbatore, Tamil Nadu",
                user_map['client'],
                user_map['contractor'],
                user_map['site_engineer'],
                "₹72,50,000",
                "2026-09-01",
                "2027-02-28",
                "Brickwork & Masonry",
                48,
                "In Progress"
            ))
            project_id = cursor.lastrowid

            # Seed 7 days of realistic day-by-day updates
            logs = [
                (
                    project_id, "2026-09-12", "Foundation & Footing",
                    "Completed deep excavation for 16 column footing pits. Soil bearing test approved by structural engineer.",
                    5, 14, "Excavator machinery (8 hrs), marking chalk, barricading tape",
                    "Sunny (31°C)", "None",
                    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                ),
                (
                    project_id, "2026-09-13", "Foundation & Footing",
                    "PCC 1:4:8 bed concrete laid in all footing pits to 100mm depth. Leveling verified with automatic level.",
                    6, 12, "45 bags ACC PPC cement, 2 units river sand, 4 units 40mm metal",
                    "Clear / Dry", "None",
                    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                ),
                (
                    project_id, "2026-09-14", "Plinth & Columns",
                    "Steel rebar cages for columns assembled and lowered into pits. Starter reinforcement anchored securely.",
                    8, 16, "3.2 metric tons Fe550D TMT steel bars, 25 kg binding wire, cover blocks",
                    "Overcast (28°C)", "Minor 1-hr steel delivery delay; resolved by afternoon.",
                    "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                ),
                (
                    project_id, "2026-09-15", "Plinth & Columns",
                    "Concreting of column footings using M25 grade design mix with needle vibrator compaction.",
                    7, 18, "80 bags UltraTech OPC 53 cement, 20mm blue metal, superplasticizer",
                    "Clear / Sunny", "None",
                    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                ),
                (
                    project_id, "2026-09-16", "Curing & Plinth Beam",
                    "De-shuttered column boxes and wrapped with hessian cloth for continuous curing. Laid ground plinth beams formwork.",
                    6, 14, "Hessian cloth, formwork oil, steel shuttering plates",
                    "Scattered Showers (natural curing aid)", "None",
                    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                ),
                (
                    project_id, "2026-09-17", "Ground Floor Slab",
                    "Poured M25 grade concrete for the ground floor plinth beam network. Anti-termite subterranean soil treatment completed.",
                    8, 17, "60 bags cement, 150 liters chlorpyrifos termite barrier, coarse aggregate",
                    "Sunny (32°C)", "None",
                    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                ),
                (
                    project_id, "2026-09-18", "Brickwork & Masonry",
                    "Commenced perimeter solid red clay brick masonry for ground floor outer walls up to lintel height. Mortar mix ratio 1:6.",
                    8, 15, "4,500 Wire-cut red clay bricks, 35 bags cement, 1 truck screened sand",
                    "Clear Sky (30°C)", "Scaffolding re-adjustment completed safely before lunch.",
                    "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=800",
                    user_map['site_engineer']
                )
            ]
            cursor.executemany('''
                INSERT INTO daily_logs (
                    project_id, date, stage, work_completed, progress_added,
                    labor_count, materials_used, weather, issues_delay, site_photos, logged_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', logs)
            print("DONE: Seeded sample project 'Greenwood Modern Villa' with 7 daily logs")

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


@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    """Serve user-uploaded site photos from the uploads folder."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload an image file (e.g. site inspection photo) and return its static URL."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({"error": f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"}), 400

    # Generate unique filename with timestamp and random hex
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    random_str = os.urandom(4).hex()
    clean_orig_name = "".join(c for c in os.path.splitext(file.filename)[0] if c.isalnum() or c in ('-', '_'))[:20]
    filename = f"site_{timestamp}_{random_str}_{clean_orig_name}{ext}"
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    file_url = f"/uploads/{filename}"
    return jsonify({
        "message": "File uploaded successfully",
        "url": file_url,
        "filename": filename
    }), 201


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
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'client') # Default to client
    if role == 'builder':
        role = 'contractor'
    if role not in ['client', 'contractor', 'site_engineer']:
        role = 'client'

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
    data = request.json or {}
    identifier = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password are required"}), 400

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        # Look up by exact email or username prefix (e.g. 'engineer' matches 'engineer@engineersveedu.com')
        cursor.execute("SELECT * FROM users WHERE email = ? OR email LIKE ?", (identifier, f"{identifier}@%"))
        user = cursor.fetchone()

    # User indexes: 0:id, 1:email, 2:password, 3:role, 4:created_at
    if user and check_password_hash(user[2], password):
        raw_role = user[3] if len(user) > 3 else "client"
        role = 'contractor' if raw_role == 'builder' else raw_role
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user[0], 
                "email": user[1],
                "role": role
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
        role = user[2]
        if role == 'builder':
            role = 'contractor'
        return jsonify({
            "id": user[0],
            "email": user[1],
            "role": role,
            "username": user[1].split('@')[0] # Using email prefix as username
        })
    return jsonify({"error": "User not found"}), 404

# --- ROLE-BASED USERS ENDPOINT ---

@app.route('/api/users/by-role', methods=['GET'])
def get_users_by_role():
    """Get users filtered by role for project assignment dropdowns."""
    target_role = request.args.get('role')
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        if target_role:
            # Map builder to contractor for backwards compat
            search_roles = [target_role]
            if target_role == 'contractor':
                search_roles.append('builder')
            placeholders = ','.join('?' for _ in search_roles)
            cursor.execute(f"SELECT id, email, role FROM users WHERE role IN ({placeholders})", search_roles)
        else:
            cursor.execute("SELECT id, email, role FROM users")
        rows = cursor.fetchall()
    
    users = []
    for r in rows:
        r_role = 'contractor' if r[2] == 'builder' else r[2]
        users.append({"id": r[0], "email": r[1], "role": r_role})
    return jsonify({"users": users})

# --- PROJECTS ENDPOINTS ---

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """
    Get projects connected to the user based on role and user_id.
    - client: projects where client_id = user_id
    - contractor: projects where contractor_id = user_id (or all if contractor)
    - site_engineer: projects where site_engineer_id = user_id
    """
    user_id = request.args.get('user_id')
    role = request.args.get('role', 'all')
    if role == 'builder':
        role = 'contractor'

    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = '''
            SELECT 
                p.*,
                cu.email as client_email,
                co.email as contractor_email,
                se.email as site_engineer_email,
                (SELECT COUNT(*) FROM daily_logs WHERE project_id = p.id) as total_logs,
                (SELECT date FROM daily_logs WHERE project_id = p.id ORDER BY date DESC, id DESC LIMIT 1) as last_log_date
            FROM projects p
            LEFT JOIN users cu ON p.client_id = cu.id
            LEFT JOIN users co ON p.contractor_id = co.id
            LEFT JOIN users se ON p.site_engineer_id = se.id
        '''
        params = []
        
        if user_id and user_id != 'demo-user':
            try:
                uid = int(user_id)
                if role == 'client':
                    query += " WHERE p.client_id = ?"
                    params.append(uid)
                elif role == 'site_engineer':
                    query += " WHERE p.site_engineer_id = ?"
                    params.append(uid)
                elif role == 'contractor':
                    query += " WHERE p.contractor_id = ?"
                    params.append(uid)
            except ValueError:
                pass
        
        query += " ORDER BY p.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # If user has no specific projects yet, return all sample projects for demo experience
        if not rows and user_id:
            cursor.execute('''
                SELECT 
                    p.*,
                    cu.email as client_email,
                    co.email as contractor_email,
                    se.email as site_engineer_email,
                    (SELECT COUNT(*) FROM daily_logs WHERE project_id = p.id) as total_logs,
                    (SELECT date FROM daily_logs WHERE project_id = p.id ORDER BY date DESC, id DESC LIMIT 1) as last_log_date
                FROM projects p
                LEFT JOIN users cu ON p.client_id = cu.id
                LEFT JOIN users co ON p.contractor_id = co.id
                LEFT JOIN users se ON p.site_engineer_id = se.id
                ORDER BY p.id DESC
            ''')
            rows = cursor.fetchall()

        projects = [dict(row) for row in rows]
        return jsonify({"projects": projects})

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Create a new project linking client, contractor, and site engineer."""
    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    description = data.get('description', '')
    location = data.get('location', 'Chennai, Tamil Nadu')
    client_id = data.get('client_id')
    contractor_id = data.get('contractor_id')
    site_engineer_id = data.get('site_engineer_id')
    budget = data.get('budget', '₹50,00,000')
    start_date = data.get('start_date', datetime.date.today().strftime('%Y-%m-%d'))
    target_date = data.get('target_date', (datetime.date.today() + datetime.timedelta(days=120)).strftime('%Y-%m-%d'))
    stage = data.get('stage', 'Planning & Excavation')
    progress = int(data.get('progress', 0))
    status = data.get('status', 'In Progress')

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO projects (
                name, description, location, client_id, contractor_id, site_engineer_id,
                budget, start_date, target_date, stage, progress, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            name, description, location, client_id, contractor_id, site_engineer_id,
            budget, start_date, target_date, stage, progress, status
        ))
        conn.commit()
        project_id = cursor.lastrowid

    return jsonify({"message": "Project created successfully", "project_id": project_id}), 201

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """Get single project details with joined client, contractor, site engineer info."""
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                p.*,
                cu.email as client_email,
                co.email as contractor_email,
                se.email as site_engineer_email,
                (SELECT COUNT(*) FROM daily_logs WHERE project_id = p.id) as total_logs
            FROM projects p
            LEFT JOIN users cu ON p.client_id = cu.id
            LEFT JOIN users co ON p.contractor_id = co.id
            LEFT JOIN users se ON p.site_engineer_id = se.id
            WHERE p.id = ?
        ''', (project_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Project not found"}), 404
        return jsonify({"project": dict(row)})

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """Update project fields (stage, progress, status, budget, etc.)."""
    data = request.json or {}
    fields = []
    values = []
    for k in ['name', 'description', 'location', 'stage', 'progress', 'status', 'budget', 'target_date', 'client_id', 'site_engineer_id', 'contractor_id']:
        if k in data:
            fields.append(f"{k} = ?")
            values.append(data[k])
    
    if not fields:
        return jsonify({"error": "No fields to update"}), 400
    
    values.append(project_id)
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE projects SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    
    return jsonify({"message": "Project updated successfully"})

# --- DAILY PROCESS TRACKING LOGS ENDPOINTS ---

@app.route('/api/projects/<int:project_id>/daily-logs', methods=['GET'])
def get_daily_logs(project_id):
    """Get chronological day-by-day logs for a project with full engineering details."""
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                l.*,
                u.email as logged_by_email,
                u.role as logged_by_role
            FROM daily_logs l
            LEFT JOIN users u ON l.logged_by = u.id
            WHERE l.project_id = ?
            ORDER BY l.date DESC, l.id DESC
        ''', (project_id,))
        rows = cursor.fetchall()
        logs = []
        for r in rows:
            d = dict(r)
            # Parse JSON fields safely if string
            for json_col in ['sub_tasks', 'labor_breakdown', 'materials_breakdown', 'quality_checks']:
                if d.get(json_col) and isinstance(d[json_col], str):
                    try:
                        d[json_col] = json.loads(d[json_col])
                    except Exception:
                        pass
            logs.append(d)
        return jsonify({"logs": logs, "count": len(logs)})

@app.route('/api/projects/<int:project_id>/daily-logs', methods=['POST'])
def add_daily_log(project_id):
    """
    Site engineer or contractor submits a daily site update with granular engineering details:
    labor breakdown, material inventory, sub-task checklists, QA/QC tests, and inspection remarks.
    """
    data = request.json or {}
    work_completed = data.get('work_completed', '').strip()
    if not work_completed:
        return jsonify({"error": "Work completed description is required"}), 400

    log_date = data.get('date', datetime.date.today().strftime('%Y-%m-%d'))
    stage = data.get('stage', 'General Construction')
    progress_added = int(data.get('progress_added', 0))
    labor_count = int(data.get('labor_count', 0))
    materials_used = data.get('materials_used', 'As per standard BOM')
    weather = data.get('weather', 'Clear / Sunny')
    issues_delay = data.get('issues_delay', 'None')
    site_photos = data.get('site_photos', '')
    logged_by = data.get('logged_by')

    # Detailed tracking fields
    sub_tasks = json.dumps(data.get('sub_tasks', [])) if isinstance(data.get('sub_tasks'), list) else str(data.get('sub_tasks') or '')
    labor_breakdown = json.dumps(data.get('labor_breakdown', {})) if isinstance(data.get('labor_breakdown'), dict) else str(data.get('labor_breakdown') or '')
    materials_breakdown = json.dumps(data.get('materials_breakdown', {})) if isinstance(data.get('materials_breakdown'), dict) else str(data.get('materials_breakdown') or '')
    quality_checks = json.dumps(data.get('quality_checks', {})) if isinstance(data.get('quality_checks'), dict) else str(data.get('quality_checks') or '')
    inspection_status = data.get('inspection_status', 'Verified')

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO daily_logs (
                project_id, date, stage, work_completed, progress_added,
                labor_count, materials_used, weather, issues_delay, site_photos,
                sub_tasks, labor_breakdown, materials_breakdown, quality_checks, inspection_status,
                logged_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            project_id, log_date, stage, work_completed, progress_added,
            labor_count, materials_used, weather, issues_delay, site_photos,
            sub_tasks, labor_breakdown, materials_breakdown, quality_checks, inspection_status,
            logged_by
        ))
        log_id = cursor.lastrowid

        # Update project progress & stage if specified
        if progress_added > 0 or stage:
            cursor.execute("SELECT progress FROM projects WHERE id = ?", (project_id,))
            current = cursor.fetchone()
            new_progress = min(100, (current[0] if current else 0) + progress_added) if progress_added > 0 else (current[0] if current else 0)
            
            # Explicit progress override if provided in payload
            if 'total_progress' in data and data['total_progress'] is not None:
                new_progress = int(data['total_progress'])

            cursor.execute('''
                UPDATE projects 
                SET progress = ?, stage = ?, status = CASE WHEN ? >= 100 THEN 'Completed' ELSE status END
                WHERE id = ?
            ''', (new_progress, stage, new_progress, project_id))

        conn.commit()

    return jsonify({"message": "Daily log recorded successfully", "log_id": log_id}), 201

@app.route('/api/projects/<int:project_id>/daily-logs/<int:log_id>', methods=['DELETE'])
def delete_daily_log(project_id, log_id):
    """Delete a daily log entry."""
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM daily_logs WHERE id = ? AND project_id = ?", (log_id, project_id))
        conn.commit()
    return jsonify({"message": "Log deleted successfully"})

@app.route('/api/projects/<int:project_id>/components', methods=['GET'])
def get_project_components(project_id):
    """
    Granular Component & Sub-task Breakdown Structure for deep building process tracking.
    Evaluates micro-milestones across all structural and architectural trades.
    """
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        p_row = cursor.fetchone()
        if not p_row:
            return jsonify({"error": "Project not found"}), 404
        project = dict(p_row)

    progress = project.get('progress') or 0

    # Definitive Civil Construction Work Breakdown Structure (WBS)
    components = [
        {
            "id": "phase-1",
            "phase": "1. Earthwork & Foundation Substructure",
            "completion": min(100, int(progress / 20 * 100)) if progress <= 20 else 100,
            "tasks": [
                {"name": "Site Demarcation & Boundary Pegging", "status": "Completed", "qa": "Passed", "specs": "Total station survey, GPS aligned"},
                {"name": "Earthwork Machine Excavation (16 pits)", "status": "Completed", "qa": "Passed", "specs": "Depth 3.5m, SBC 220 kN/m² verified"},
                {"name": "PCC 1:4:8 Bed Concreting (100mm)", "status": "Completed", "qa": "Passed", "specs": "Auto-level survey ±2mm variation"},
                {"name": "Anti-Termite Soil Chemical Barrier", "status": "Completed", "qa": "Passed", "specs": "Chlorpyrifos 20% EC perimeter spray"},
                {"name": "Footing Steel Mat & Column Starter Anchor", "status": "Completed", "qa": "Passed", "specs": "Fe550D TMT, 50mm clear cover blocks"},
                {"name": "Column Footings Concreting (M25 Grade)", "status": "Completed", "qa": "Passed", "specs": "Slump 110mm, 6 test cubes cast"},
                {"name": "Footings Curing & Pit Backfilling", "status": "Completed", "qa": "Passed", "specs": "14-day wet hessian curing certified"}
            ]
        },
        {
            "id": "phase-2",
            "phase": "2. Plinth Beam & Ground Network",
            "completion": min(100, int((progress - 20) / 15 * 100)) if progress > 20 else (100 if progress > 35 else 0),
            "tasks": [
                {"name": "Plinth Beam Shuttering & Formwork", "status": "Completed" if progress >= 30 else "In Progress", "qa": "Passed", "specs": "Waterproof plywood formwork, oiled"},
                {"name": "Plinth Beam Reinforcement Bar Bending", "status": "Completed" if progress >= 32 else "In Progress", "qa": "Passed", "specs": "4-16mm main bars, 8mm stirrups @ 150c/c"},
                {"name": "Plinth Beam Concreting (M25 Design Mix)", "status": "Completed" if progress >= 35 else "In Progress", "qa": "Passed", "specs": "Compacted with 40mm needle vibrator"},
                {"name": "DPC (Damp Proof Course) 50mm Membrane", "status": "Completed" if progress >= 38 else "In Progress", "qa": "Passed", "specs": "Polyethylene 400-micron waterproof barrier"},
                {"name": "Internal Floor Trench Soil Compaction", "status": "Completed" if progress >= 40 else "In Progress", "qa": "Passed", "specs": "Compacted in 150mm layers, 95% MDD achieved"}
            ]
        },
        {
            "id": "phase-3",
            "phase": "3. RCC Superstructure Framing",
            "completion": min(100, max(0, int((progress - 35) / 20 * 100))) if progress <= 55 else 100,
            "tasks": [
                {"name": "Ground-to-First Column Reinforcement Tying", "status": "Completed" if progress >= 42 else "In Progress", "qa": "Passed", "specs": "Fe550D rebar, 50d lap length checked"},
                {"name": "Column Shuttering Boxes & Plumb Alignment", "status": "Completed" if progress >= 45 else "In Progress", "qa": "Passed", "specs": "Spirit level & plumb bob zero deviation"},
                {"name": "Column Concreting with Needle Vibrator", "status": "Completed" if progress >= 48 else "In Progress", "qa": "Passed", "specs": "M25 concrete mix, 100% full compaction"},
                {"name": "Column De-shuttering & 14-Day Wet Curing", "status": "In Progress" if progress >= 48 and progress < 60 else ("Completed" if progress >= 60 else "Upcoming"), "qa": "Active", "specs": "Continuous wet hessian wrapping"},
                {"name": "First Floor Beam Centering & Formwork", "status": "In Progress" if progress >= 50 else "Upcoming", "qa": "Pending", "specs": "Steel props @ 1m spacing, cross-braced"},
                {"name": "Floor Roof Slab Reinforcement & Electrical Conduits", "status": "Upcoming", "qa": "Pending", "specs": "Bottom/Top mesh, fan hooks & junction boxes"},
                {"name": "Roof Slab Casting (M25 RMC)", "status": "Upcoming", "qa": "Pending", "specs": "125mm slab thickness with surface power floater"}
            ]
        },
        {
            "id": "phase-4",
            "phase": "4. Solid Brickwork & Masonry",
            "completion": min(100, max(0, int((progress - 45) / 20 * 100))),
            "tasks": [
                {"name": "Outer 9-Inch Solid Red Brick Masonry", "status": "In Progress" if progress >= 45 else "Upcoming", "qa": "Active", "specs": "1:6 cement mortar, wire-cut clay bricks"},
                {"name": "Door & Window Opening Sill Level Setup", "status": "In Progress" if progress >= 47 else "Upcoming", "qa": "Verified", "specs": "Water-level verified across all rooms"},
                {"name": "RCC Lintel Band & Sunshade Casting", "status": "Upcoming", "qa": "Pending", "specs": "150mm thick lintel band with 75mm chajja"},
                {"name": "Inner 4.5-Inch Partition Walls", "status": "Upcoming", "qa": "Pending", "specs": "1:4 mortar with RCC hoop iron reinforcement"},
                {"name": "Parapet Wall & Roof Kerbing", "status": "Upcoming", "qa": "Pending", "specs": "900mm height parapet wall with coping"}
            ]
        },
        {
            "id": "phase-5",
            "phase": "5. Electrical, Plumbing & MEP Rough-in",
            "completion": min(100, max(0, int((progress - 60) / 20 * 100))),
            "tasks": [
                {"name": "Wall Conduit Chasing & Concealed PVC Pipes", "status": "Upcoming", "qa": "Pending", "specs": "FRLS PVC conduits, wall chased with cutter"},
                {"name": "Modular Metal Switch Box Fixing", "status": "Upcoming", "qa": "Pending", "specs": "Laser level aligned at 1.2m and 0.45m heights"},
                {"name": "Water Supply Concealed CPVC Piping", "status": "Upcoming", "qa": "Pending", "specs": "SDR 11 CPVC pipes hot/cold water certified"},
                {"name": "Soil & Waste SWR Drainage Pipe Network", "status": "Upcoming", "qa": "Pending", "specs": "110mm / 75mm PVC pipes with 1:40 slope"},
                {"name": "Hydrostatic Pipe Pressure Testing (10 Bar)", "status": "Upcoming", "qa": "Pending", "specs": "24-hour pressure test with zero pressure drop"}
            ]
        },
        {
            "id": "phase-6",
            "phase": "6. Plastering & Waterproofing",
            "completion": min(100, max(0, int((progress - 75) / 15 * 100))),
            "tasks": [
                {"name": "Ceiling Plastering 1:3 Mortar (6mm)", "status": "Upcoming", "qa": "Pending", "specs": "Hacking on concrete slab, rich cement mortar"},
                {"name": "Internal Wall Plastering 1:4 Mortar (12mm)", "status": "Upcoming", "qa": "Pending", "specs": "Smooth sponge finish, line dori checked"},
                {"name": "Sunken Toilet Slab Acrylic Waterproofing", "status": "Upcoming", "qa": "Pending", "specs": "2 coats elastomeric coating with fiberglass mesh"},
                {"name": "External Sand-Faced Plastering (20mm, 2 coats)", "status": "Upcoming", "qa": "Pending", "specs": "Waterproof compound mixed, sponge finish"},
                {"name": "Terrace Screed Waterproofing & Brick Bat Coba", "status": "Upcoming", "qa": "Pending", "specs": "Integrated rainwater drainage spouts"}
            ]
        },
        {
            "id": "phase-7",
            "phase": "7. Flooring, Finishing & Fixtures",
            "completion": min(100, max(0, int((progress - 90) / 10 * 100))),
            "tasks": [
                {"name": "Vitrified Tiles (800x1600mm) / Granite Laying", "status": "Upcoming", "qa": "Pending", "specs": "Polymer modified tile adhesive, 2mm spacers"},
                {"name": "Wall Putty (2 Coats) & Acrylic Primer", "status": "Upcoming", "qa": "Pending", "specs": "Sanded with 220 grit paper, mirror finish"},
                {"name": "Premium Interior & Exterior Emulsion Painting", "status": "Upcoming", "qa": "Pending", "specs": "Asian Paints Royale / Apex Ultima 2 coats"},
                {"name": "Sanitary Ware & CP Chrome Fittings", "status": "Upcoming", "qa": "Pending", "specs": "Wall-hung closets, diverters, shower panels"},
                {"name": "Modular Electrical Switches & DB Panel Handover", "status": "Upcoming", "qa": "Pending", "specs": "Legrand/Schneider modular switches, MCBs tested"},
                {"name": "Deep Cleaning & Final Handover Certificate", "status": "Upcoming", "qa": "Pending", "specs": "Final client sign-off and keys handover"}
            ]
        }
    ]

    total_subtasks = sum(len(c['tasks']) for c in components)
    completed_subtasks = sum(sum(1 for t in c['tasks'] if t['status'] == 'Completed') for c in components)
    in_progress_subtasks = sum(sum(1 for t in c['tasks'] if t['status'] == 'In Progress') for c in components)

    return jsonify({
        "project_id": project_id,
        "project_name": project.get('name'),
        "overall_progress": progress,
        "summary": {
            "total_tasks": total_subtasks,
            "completed_tasks": completed_subtasks,
            "in_progress_tasks": in_progress_subtasks,
            "completion_rate": round(completed_subtasks / total_subtasks * 100, 1)
        },
        "components": components
    })

# --- AI PROJECT EFFICIENCY & HEALTH ANALYSIS ENDPOINT ---

@app.route('/api/projects/<int:project_id>/analysis', methods=['GET'])
def get_project_analysis(project_id):
    """
    Comprehensive Project Efficiency & Health Analysis.
    Calculates schedule velocity, completion forecast, labor productivity,
    and queries Gemini AI (or algorithmic heuristics) for actionable efficiency optimizations.
    """
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get project
        cursor.execute('''
            SELECT p.*, cu.email as client_email, co.email as contractor_email, se.email as site_engineer_email
            FROM projects p
            LEFT JOIN users cu ON p.client_id = cu.id
            LEFT JOIN users co ON p.contractor_id = co.id
            LEFT JOIN users se ON p.site_engineer_id = se.id
            WHERE p.id = ?
        ''', (project_id,))
        p_row = cursor.fetchone()
        if not p_row:
            return jsonify({"error": "Project not found"}), 404
        project = dict(p_row)

        # Get logs
        cursor.execute('''
            SELECT * FROM daily_logs WHERE project_id = ? ORDER BY date ASC, id ASC
        ''', (project_id,))
        logs = [dict(r) for r in cursor.fetchall()]

    # Metric calculations
    total_logs = len(logs)
    current_progress = project.get('progress') or 0
    total_labor = sum(l.get('labor_count', 0) for l in logs)
    avg_labor = round(total_labor / total_logs, 1) if total_logs > 0 else 0
    
    # Dates & Pace
    today = datetime.date.today()
    try:
        start_d = datetime.datetime.strptime(project.get('start_date') or '2026-09-01', '%Y-%m-%d').date()
    except Exception:
        start_d = today - datetime.timedelta(days=20)
    
    try:
        target_d = datetime.datetime.strptime(project.get('target_date') or '2026-12-30', '%Y-%m-%d').date()
    except Exception:
        target_d = today + datetime.timedelta(days=90)

    days_elapsed = max(1, (today - start_d).days)
    days_total = max(1, (target_d - start_d).days)
    days_remaining = max(1, (target_d - today).days)

    actual_pace = round(current_progress / days_elapsed, 2) # % per day
    planned_pace = round(100.0 / days_total, 2)
    required_pace = round((100.0 - current_progress) / days_remaining, 2) if days_remaining > 0 else actual_pace

    # Projected completion
    if actual_pace > 0:
        days_to_complete = int((100 - current_progress) / actual_pace)
        projected_completion_date = (today + datetime.timedelta(days=days_to_complete)).strftime('%Y-%m-%d')
    else:
        projected_completion_date = target_d.strftime('%Y-%m-%d')

    # Schedule Variance & Status
    pace_ratio = actual_pace / (planned_pace if planned_pace > 0 else 1)
    if pace_ratio >= 1.05:
        schedule_status = "Ahead of Schedule"
        status_color = "emerald"
    elif pace_ratio >= 0.90:
        schedule_status = "On Track"
        status_color = "blue"
    else:
        schedule_status = "Delayed / At Risk"
        status_color = "amber"

    # Blockers & Issues extraction
    active_issues = [
        {"date": l['date'], "stage": l['stage'], "issue": l['issues_delay']}
        for l in logs if l.get('issues_delay') and l['issues_delay'].lower() not in ['none', 'nil', 'no issues', '']
    ]

    # Efficiency Score Computation (0 - 100)
    # 40 pts schedule pace, 25 pts daily logging continuity, 20 pts labor stability, 15 pts low blocker ratio
    pace_score = min(40, max(10, int(pace_ratio * 35)))
    logging_score = min(25, total_logs * 3)
    labor_score = 20 if avg_labor >= 10 else int(avg_labor * 2)
    blocker_penalty = min(15, len(active_issues) * 3)
    blocker_score = max(0, 15 - blocker_penalty)
    efficiency_score = min(98, max(45, pace_score + logging_score + labor_score + blocker_score))

    # Stage breakdown
    construction_stages = [
        {"name": "Site Preparation & Excavation", "order": 1, "target": 10},
        {"name": "Foundation & Footing", "order": 2, "target": 25},
        {"name": "Plinth & Columns Framing", "order": 3, "target": 45},
        {"name": "Brickwork & Masonry", "order": 4, "target": 65},
        {"name": "Plumbing & Electrical MEP", "order": 5, "target": 80},
        {"name": "Plastering & Tiling", "order": 6, "target": 92},
        {"name": "Painting, Fixtures & Handover", "order": 7, "target": 100}
    ]

    for s in construction_stages:
        if current_progress >= s['target']:
            s['status'] = 'Completed'
            s['stage_pct'] = 100
        elif current_progress > s['target'] - 15:
            s['status'] = 'In Progress'
            s['stage_pct'] = max(15, min(90, int((current_progress - (s['target'] - 15)) / 15 * 100)))
        else:
            s['status'] = 'Upcoming'
            s['stage_pct'] = 0

    # AI Analysis Generation (Gemini with intelligent fallback)
    ai_insights = None
    ai_source = "heuristic"

    # Attempt Gemini generation if API key is present
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            prompt = f"""You are a senior civil construction engineer and project efficiency auditor at Engineers Veedu.
Analyze this construction project and provide a concise, structured JSON assessment:

Project Name: {project.get('name')}
Current Stage: {project.get('stage')}
Overall Progress: {current_progress}%
Budget: {project.get('budget')}
Days Elapsed: {days_elapsed} days
Days Remaining: {days_remaining} days
Actual Progress Pace: {actual_pace}% / day (Required: {required_pace}% / day)
Average Workers on Site: {avg_labor} workers/day
Identified Site Issues / Delays: {[i['issue'] for i in active_issues]}
Recent Work: {[l['work_completed'] for l in logs[-3:]]}

Respond ONLY in valid JSON matching this schema:
{{
    "executive_summary": "2 sentences summarizing project progress and health",
    "schedule_verdict": "Clear assessment of schedule and finish date predictability",
    "efficiency_rating": "{efficiency_score}/100",
    "key_risks": ["Risk 1", "Risk 2"],
    "actionable_recommendations": [
        "Concrete recommendation 1 for contractor/site engineer",
        "Concrete recommendation 2 for material or labor efficiency",
        "Concrete recommendation 3 to save time or avoid cost overrun"
    ],
    "client_note": "A reassuring and transparent update statement for the homeowner"
}}
"""
            gem_model = genai.GenerativeModel('gemini-2.5-flash')
            res = gem_model.generate_content(prompt)
            res_text = res.text.strip()
            # Clean markdown code blocks if present
            if res_text.startswith('```'):
                res_text = res_text.split('\n', 1)[1].rsplit('```', 1)[0]
            ai_insights = json.loads(res_text.strip())
            ai_source = "gemini"
        except Exception as e:
            print(f"Gemini project analysis error, using fallback: {e}")
            ai_insights = None

    # Intelligent Heuristic Fallback if Gemini not used or failed
    if not ai_insights:
        ai_insights = {
            "executive_summary": f"{project.get('name')} is progressing at an active velocity of {actual_pace}% per day with {current_progress}% completion achieved. Daily logs demonstrate robust contractor-engineer coordination and steady manpower deployment averaging {avg_labor} artisans.",
            "schedule_verdict": f"The project is currently {schedule_status.lower()} with target completion estimated on {projected_completion_date} (Target: {project.get('target_date')}).",
            "efficiency_rating": f"{efficiency_score}/100",
            "key_risks": [
                "Potential mortar curing bottlenecks during intermittent temperature fluctuations",
                f"{len(active_issues)} logged minor site delay(s) require proactive supply chain buffer to avoid compounding."
            ],
            "actionable_recommendations": [
                "Implement concurrent MEP conduit chasing in finished masonry walls to shave 4-5 days off the MEP milestone.",
                f"Maintain the current site crew of {int(avg_labor)} workers with a 1:1.5 mason-to-helper ratio for optimal bricklaying productivity.",
                "Pre-order aggregate and sand 7 days in advance of the first-floor slab shuttering date to prevent transit halts."
            ],
            "client_note": f"Your project is progressing smoothly through the {project.get('stage')} phase. Site safety standards and structural inspections are on schedule with high daily accountability."
        }

    return jsonify({
        "project_id": project_id,
        "project_name": project.get('name'),
        "stage": project.get('stage'),
        "progress": current_progress,
        "efficiency_score": efficiency_score,
        "schedule_status": schedule_status,
        "status_color": status_color,
        "metrics": {
            "total_logs": total_logs,
            "avg_labor": avg_labor,
            "total_labor_days": total_labor,
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "actual_pace_pct_per_day": actual_pace,
            "required_pace_pct_per_day": required_pace,
            "projected_completion_date": projected_completion_date,
            "target_date": project.get('target_date')
        },
        "stage_breakdown": construction_stages,
        "active_issues": active_issues,
        "ai_insights": ai_insights,
        "ai_source": ai_source
    })

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


# --- CLIENT REQUESTS ENDPOINTS ---

@app.route('/api/client-requests', methods=['GET'])
def get_client_requests():
    """Get client construction requests."""
    role = request.args.get('role')
    user_id = request.args.get('user_id')
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        query = "SELECT * FROM client_requests"
        params = []
        conditions = []
        if user_id and user_id != 'demo-user':
            try:
                uid = int(user_id)
                conditions.append("(client_id = ? OR target_user_id = ?)")
                params.extend([uid, uid])
            except ValueError:
                pass
        if role:
            conditions.append("target_role = ?")
            params.append(role)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return jsonify({"requests": [dict(r) for r in rows]})


@app.route('/api/client-requests', methods=['POST'])
def create_client_request():
    """Create a new client request with name, site_address, amount, building_type, required_details."""
    data = request.json or {}
    name = data.get('name', '').strip()
    site_address = (data.get('site_address') or data.get('siteAddress', '')).strip()
    amount = data.get('amount', '').strip()
    building_type = (data.get('building_type') or data.get('buildingType', '')).strip()
    required_details = (data.get('required_details') or data.get('requiredDetails') or data.get('siteDetails', '')).strip()

    if not name or not site_address or not amount or not building_type:
        return jsonify({"error": "Name, site address, amount, and building type are required"}), 400

    client_id = data.get('client_id')
    target_user_id = data.get('target_user_id') or data.get('engineerId')
    target_role = data.get('target_role') or data.get('engineerRole', 'contractor')

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO client_requests (
                name, site_address, amount, building_type, required_details,
                client_id, target_user_id, target_role, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ''', (name, site_address, amount, building_type, required_details, client_id, target_user_id, target_role))
        conn.commit()
        new_id = cursor.lastrowid
        return jsonify({
            "message": "Client request submitted successfully",
            "request_id": new_id,
            "request": {
                "id": new_id,
                "name": name,
                "site_address": site_address,
                "siteAddress": site_address,
                "amount": amount,
                "building_type": building_type,
                "buildingType": building_type,
                "required_details": required_details,
                "requiredDetails": required_details,
                "status": "pending",
                "createdAt": "Just now"
            }
        }), 201


@app.route('/api/client-requests/<int:req_id>/status', methods=['PATCH'])
def update_client_request_status(req_id):
    """Update status of a client request."""
    data = request.json or {}
    status = data.get('status', 'accepted')
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE client_requests SET status = ? WHERE id = ?", (status, req_id))
        conn.commit()
        return jsonify({"message": f"Request status updated to {status}", "id": req_id, "status": status})



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
