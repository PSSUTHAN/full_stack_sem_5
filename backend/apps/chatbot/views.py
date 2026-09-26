import os
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import google.generativeai as genai

try:
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    import numpy as np

    def cosine_similarity(a, b):
        a = np.array(a)
        b = np.array(b)
        dot = np.dot(a, b.T)
        norm_a = np.linalg.norm(a, axis=1, keepdims=True)
        norm_b = np.linalg.norm(b, axis=1, keepdims=True)
        return dot / (norm_a * norm_b.T)

# Paths
BASE_DIR = settings.BASE_DIR
knowledge_base_path = os.path.join(BASE_DIR, "knowledge_base.json")
embeddings_path = os.path.join(BASE_DIR, "embeddings.json")

knowledge_base = []
document_embeddings = []
conversation_histories = {}

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


def load_knowledge_base():
    global knowledge_base
    if os.path.exists(knowledge_base_path):
        try:
            with open(knowledge_base_path, 'r', encoding='utf-8') as f:
                knowledge_base = json.load(f)
        except Exception as e:
            print(f"Error loading knowledge base: {e}")


def load_embeddings():
    global document_embeddings
    if os.path.exists(embeddings_path):
        try:
            with open(embeddings_path, 'r', encoding='utf-8') as f:
                document_embeddings = json.load(f)
            return True
        except Exception as e:
            print(f"Error loading embeddings: {e}")
    return False


def get_embedding(text):
    try:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
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
    global document_embeddings
    document_embeddings = []
    for i, doc in enumerate(knowledge_base):
        text = f"{doc['title']}: {doc['content']}"
        embedding = get_embedding(text)
        if embedding:
            document_embeddings.append({
                'index': i,
                'embedding': embedding
            })
    try:
        with open(embeddings_path, 'w', encoding='utf-8') as f:
            json.dump(document_embeddings, f)
    except Exception as e:
        print(f"Error saving embeddings: {e}")


def keyword_search(query, top_k=3):
    query_lower = query.lower()
    results = []
    for doc in knowledge_base:
        content = doc.get('content', '').lower()
        score = 0
        for word in query_lower.split():
            if len(word) > 3:
                score += content.count(word)
        if score > 0:
            results.append({'doc': doc, 'score': score})
    results.sort(key=lambda x: x['score'], reverse=True)
    return [r['doc'] for r in results[:top_k]]


def semantic_search(query, top_k=3):
    if not document_embeddings:
        load_embeddings()
    if not document_embeddings:
        return keyword_search(query, top_k)

    try:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return keyword_search(query, top_k)
        genai.configure(api_key=api_key)
        query_embedding = genai.embed_content(
            model="models/gemini-embedding-001",
            content=query,
            task_type="retrieval_query"
        )['embedding']

        similarities = []
        for doc_emb in document_embeddings:
            sim = cosine_similarity([query_embedding], [doc_emb['embedding']])[0][0]
            similarities.append({'index': doc_emb['index'], 'similarity': sim})

        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return [knowledge_base[r['index']] for r in similarities[:top_k]]
    except Exception as e:
        print(f"Semantic search error: {e}")
        return keyword_search(query, top_k)


# Load data on import
load_knowledge_base()
load_embeddings()


class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data or {}
            user_message = data.get('message', '').strip()
            session_id = data.get('session_id', 'default')

            if not user_message:
                return Response({"error": "No message provided"}, status=status.HTTP_400_BAD_REQUEST)

            if session_id not in conversation_histories:
                conversation_histories[session_id] = []
            history = conversation_histories[session_id]

            relevant_docs = semantic_search(user_message, top_k=3)
            context = "\n\n".join([
                f"📄 {doc.get('title', 'Doc')}:\n{doc.get('content', '')}"
                for doc in relevant_docs
            ])

            conv_context = ""
            if history:
                recent_history = history[-4:]
                conv_context = "\n\nRecent conversation:\n"
                for h in recent_history:
                    conv_context += f"Customer: {h['question']}\nAssistant: {h['answer']}\n"

            full_prompt = f"""{SYSTEM_PROMPT}

---
Relevant Context from Our Website:
{context}
{conv_context}
---

Customer Question: {user_message}

Please provide a helpful, friendly response:"""

            api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            answer = None
            if api_key:
                try:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel('gemini-3.8-flash')
                    response = model.generate_content(
                        full_prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.7,
                            max_output_tokens=500,
                        )
                    )
                    answer = response.text.strip()
                except Exception as ex:
                    print(f"Chatbot Gemini generation failed: {ex}")
                    answer = None

            if not answer:
                if relevant_docs:
                    doc = relevant_docs[0]
                    answer = f"Based on our knowledge base regarding {doc.get('title', 'Engineers Veedu')}: {doc.get('content', '')[:300]}... Please contact our team at support@contractorpro.com or +1 (555) 123-4567 for detailed consultation!"
                else:
                    answer = "Hello! Engineers Veedu provides comprehensive turnkey residential and commercial construction services across Chennai, Coimbatore, and Madurai. Please feel free to request a quote or contact our site engineering team!"

            sources = [doc.get('source', doc.get('title', 'Engineers Veedu Knowledge Base')) for doc in relevant_docs]

            history.append({'question': user_message, 'answer': answer})
            if len(history) > 10:
                conversation_histories[session_id] = history[-10:]

            return Response({
                "response": answer,
                "sources": sources
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": "I apologize, but I'm having trouble processing your request. Please try again or contact us directly.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClearChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data or {}
            session_id = data.get('session_id', 'default')
            if session_id in conversation_histories:
                conversation_histories[session_id] = []
            return Response({"message": "Conversation history cleared"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegenerateEmbeddingsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            generate_all_embeddings()
            return Response({
                "message": "Embeddings regenerated successfully",
                "count": len(document_embeddings)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
