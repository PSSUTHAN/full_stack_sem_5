import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models = genai.list_models()
for m in models:
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
