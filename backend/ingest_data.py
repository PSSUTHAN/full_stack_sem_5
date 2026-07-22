"""
Data ingestion script for RAG chatbot using Gemini API.
Extracts content from HTML files and generates vector embeddings.
"""

import os
import json
from pathlib import Path
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("WARNING: GEMINI_API_KEY not found. Embeddings will not be generated.")

def extract_text_from_html(html_path):
    """Extract clean text from HTML file."""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.decompose()
    
    # Get text
    text = soup.get_text()
    
    # Clean up text
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = ' '.join(chunk for chunk in chunks if chunk)
    
    return text

def get_embedding(text):
    """Get embedding for a piece of text using Gemini's embedding model."""
    if not api_key:
        return None
        
    try:
        # Add delay to avoid rate limiting
        time.sleep(0.5)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def create_knowledge_base():
    """Create knowledge base from website HTML files."""
    website_dir = Path(__file__).parent.parent / "frontend"
    html_files = list(website_dir.glob("*.html"))
    
    knowledge_base = []
    
    # Define metadata for each page
    page_info = {
        "index.html": {
            "title": "Home - Engineers Veedu",
            "description": "Construction contractor services, portfolio, and trust signals"
        },
        "support.html": {
            "title": "Support - Engineers Veedu",
            "description": "Customer support, contact information, and FAQ"
        },
        "community.html": {
            "title": "Community - Engineers Veedu",
            "description": "Community features and project collaboration"
        },
        "login.html": {
            "title": "Login - Engineers Veedu",
            "description": "User login page"
        },
        "register.html": {
            "title": "Register - Engineers Veedu",
            "description": "User registration page"
        },
        "dash.html": {
            "title": "Contractor Dashboard",
            "description": "Dashboard for engineers and contractors"
        },
        "client_dash.html": {
            "title": "Client Dashboard",
            "description": "Dashboard for clients to manage requests"
        }
    }
    
    print("Extracting content from HTML files...")
    for html_file in html_files:
        try:
            text = extract_text_from_html(html_file)
            filename = html_file.name
            
            metadata = page_info.get(filename, {
                "title": filename,
                "description": f"Content from {filename}"
            })
            
            knowledge_base.append({
                "source": filename,
                "title": metadata["title"],
                "description": metadata["description"],
                "content": text
            })
            print(f"  Processed {filename}")
        except Exception as e:
            print(f"  Error processing {html_file}: {e}")
    
    # Add custom knowledge
    custom_knowledge = [
        {
            "source": "company_info",
            "title": "Company Overview",
            "description": "Engineers Veedu company information",
            "content": """
            Engineers Veedu is a professional construction contractor with over 10 years of experience.
            Services include: residential construction, commercial buildouts, renovations, foundation work,
            and structural engineering. The company is certified and insured. Service areas include
            Chennai, Coimbatore, and Madurai regions.
            """
        },
        {
            "source": "contact_info",
            "title": "Contact Information",
            "description": "How to contact Engineers Veedu",
            "content": """
            Contact Information:
            - Phone: +1 (555) 123-4567
            - Email: support@contractorpro.com
            - Business Hours: Monday-Friday 8AM-6PM EST
            """
        },
        {
            "source": "projects",
            "title": "Portfolio",
            "description": "Recent construction projects",
            "content": """
            Recent Projects:
            1. Commercial Buildout - Modern office space delivered on time and within budget
            2. Luxury Home Renovation - Full interior and exterior remodeling
            3. Foundation & Structurals - Expert structural work ensuring long-term stability
            """
        }
    ]
    
    knowledge_base.extend(custom_knowledge)
    
    # Save knowledge base to JSON
    output_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(knowledge_base, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Knowledge base created at {output_path}")
    print(f"Total documents: {len(knowledge_base)}")
    
    # Generate embeddings
    if api_key:
        print("\nGenerating embeddings...")
        document_embeddings = []
        
        for i, doc in enumerate(knowledge_base):
            text = f"{doc['title']}: {doc['content']}"
            embedding = get_embedding(text)
            
            if embedding:
                document_embeddings.append({
                    'index': i,
                    'embedding': embedding
                })
            print(f"  Embedded {i+1}/{len(knowledge_base)}")
        
        # Save embeddings
        embeddings_path = os.path.join(os.path.dirname(__file__), "embeddings.json")
        with open(embeddings_path, 'w', encoding='utf-8') as f:
            json.dump(document_embeddings, f)
        
        print(f"✅ Saved {len(document_embeddings)} embeddings to {embeddings_path}")
    
    return knowledge_base


if __name__ == "__main__":
    create_knowledge_base()
