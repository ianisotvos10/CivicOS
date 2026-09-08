import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

class TicketRequest(BaseModel):
    title: str
    description: str
    status: str

class TicketAnalysis(BaseModel):
    category: str
    urgency: str
    sentiment: str
    location: str
    department: str
    summary: str
    latitude: float | None = None
    longitude: float | None = None
    estimated_cost: float | None = None
    routed_contractor: str | None = None
    detected_language: str
    translated_description: str

@app.post("/classify", response_model=TicketAnalysis)
def classify_ticket(req: TicketRequest):
    if not client:
        return TicketAnalysis(
            category="Infrastructură",
            urgency="Scăzută",
            sentiment="Neutru",
            location="Nespecificat",
            department="Administrație",
            summary="API Key lipsă",
            detected_language="ro",
            translated_description=req.description
        )

    prompt = f"""Analizează următoarea sesizare a unui cetățean:
Titlu: {req.title}
Descriere: {req.description}

Vreau să extragi/deduci următoarele:
1. 'category': Categoria problemei (ex: Infrastructură, Gunoaie, Parcuri).
2. 'urgency': Urgența (Critică, Ridicată, Medie, Scăzută).
3. 'sentiment': Sentimentul (ex: Furios, Neutru, Nemulțumit).
4. 'location': Locația menționată (dacă nu e, scrie 'Nespecificat').
5. 'department': Departamentul responsabil (ex: Spații Verzi, RADP).
6. 'summary': Un scurt rezumat (maxim 10 cuvinte).
7. 'latitude' si 'longitude': Ghicește coordonate GPS plauzibile în Cluj-Napoca (în jur de 46.77, 23.59) pentru strada menționată. Dacă nu știi, pune null.
8. 'estimated_cost': Dacă este problemă de infrastructură, estimează un cost în RON. Altfel pune null.
9. 'routed_contractor': Firma/Compania externă sugereată (ex: 'Asfaltări SRL', 'Compania de Apă'). Altfel pune null.
10. 'detected_language': Codul limbii în care a scris cetățeanul (ex: 'ro', 'en', 'hu').
11. 'translated_description': Traducerea exactă a descrierii în limba română (dacă e deja în română, las-o la fel).

Asigură-te că folosești formatul JSON cerut de schemă.
"""

    try:
        interaction = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TicketAnalysis.model_json_schema(),
            )
        )
        import json
        data = json.loads(interaction.text)
        return TicketAnalysis(**data)
    except Exception as e:
        print(f"Eroare AI: {e}")
        return TicketAnalysis(
            category="Eroare",
            urgency="N/A",
            sentiment="N/A",
            location="N/A",
            department="N/A",
            summary="Eroare procesare",
            detected_language="ro",
            translated_description=req.description
        )

class DraftRequest(BaseModel):
    request_title: str
    request_description: str
    bureaucrat_notes: str
    original_language: str | None = "ro"

@app.post("/draft-reply")
def draft_reply(req: DraftRequest):
    if not client:
        return {"reply_text": "Cererea dumneavoastră a fost procesată. (Mock)"}

    prompt = f"""Redactează un răspuns OFICIAL, scurt și politicos, din partea primăriei pentru cetățean.
Titlul cererii: {req.request_title}
Descrierea problemei: {req.request_description}
Notițele funcționarului public (cum a rezolvat-o): {req.bureaucrat_notes}
Limba nativă a cetățeanului: {req.original_language}

IMPORTANT: Răspunsul trebuie să fie redactat integral în limba cetățeanului ({req.original_language}).
"""
    try:
        interaction = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[prompt],
        )
        return {"reply_text": interaction.text}
    except Exception as e:
        return {"reply_text": f"Eroare generare răspuns: {e}"}

class OcrRequest(BaseModel):
    image_base64: str
    mime_type: str

class OcrResponse(BaseModel):
    nume: str | None = None
    prenume: str | None = None
    cnp: str | None = None
    serie: str | None = None
    numar: str | None = None
    adresa: str | None = None
    dataExpirare: str | None = None

@app.post("/extract-ocr", response_model=OcrResponse)
def extract_ocr(req: OcrRequest):
    if client:
        import base64
        image_bytes = base64.b64decode(req.image_base64)
        
        prompt = """Analizează această imagine (o carte de identitate din România).
Extrage următoarele informații cu maximă precizie:
- Numele de familie (Nume)
- Prenumele (toate)
- CNP (Cod Numeric Personal - 13 cifre)
- Seria (2 litere)
- Numărul (6 cifre)
- Adresa completă (domiciliul).
- Data expirării (format YYYY-MM-DD. Dacă găsești ceva gen 13.05.2024, transformă în 2024-05-13).
Dacă un câmp nu este perfect lizibil sau lipsește, returnează null pentru el.
Asigură-te că folosești formatul JSON și câmpul 'dataExpirare' (camelCase).
"""
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                interaction = client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=[
                        prompt,
                        types.Part.from_bytes(data=image_bytes, mime_type=req.mime_type)
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=OcrResponse.model_json_schema(),
                    )
                )
                import json
                data = json.loads(interaction.text)
                return OcrResponse(**data)
            except Exception as e:
                print(f"Eroare OCR Gemini (Attempt {attempt+1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    return OcrResponse(nume="Eroare API", prenume=None, cnp=None, serie=None, numar=None, adresa=None, dataExpirare=None)
    
    return OcrResponse(nume="Popescu", prenume="Ion (Mock)", cnp="1234567890123", serie="CJ", numar="123456", adresa="Strada Mock 123", dataExpirare="2020-01-01")

class ValidateDocRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"
    expected_type: str | None = None

class ValidateDocResponse(BaseModel):
    valid: bool
    detected_type: str
    confidence: str
    message: str

@app.post("/validate-document", response_model=ValidateDocResponse)
def validate_document(req: ValidateDocRequest):
    if not client:
        return ValidateDocResponse(valid=True, detected_type="Mock Document", confidence="HIGH", message="(Mock) Documentul pare a fi valid.")
    
    import base64
    image_bytes = base64.b64decode(req.image_base64)
    
    expected_hint = f"Se asteapta un document de tip: {req.expected_type}." if req.expected_type else ""
    
    prompt = f"""Ești un validator de documente pentru o primărie digitală.
Analizează imaginea și determină cu precizie:
1. Ce tip de document este (ex: Carte de Identitate, Extras de Carte Funciară, Autorizație de Construire, Certificat de Urbanism, Factură, Talon Auto, Selfie, Fotografie, Alt document necunoscut).
2. Dacă documentul este valid și lizibil.
3. Un mesaj clar pentru cetățean.

{expected_hint}

Răspunde STRICT în JSON cu schema de mai jos. Nu adăuga nimic altceva.
Schema: {{ "valid": bool, "detected_type": "string", "confidence": "HIGH|MEDIUM|LOW", "message": "string" }}
"""
    import time
    max_retries = 3
    for attempt in range(max_retries):
        try:
            interaction = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=req.mime_type)
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ValidateDocResponse.model_json_schema(),
                )
            )
            import json
            data = json.loads(interaction.text)
            return ValidateDocResponse(**data)
        except Exception as e:
            print(f"Eroare validate-document (Attempt {attempt+1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                return ValidateDocResponse(valid=False, detected_type="Eroare API", confidence="LOW", message="Eroare la procesarea documentului. Încercați din nou.")

class ChatRequest(BaseModel):
    message: str
    context_history: list[dict] = [] # optional context history

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
def chat_rag(req: ChatRequest):
    if not client:
        return ChatResponse(reply="Sistemul AI este momentan indisponibil (Mock).")
    
    try:
        # Citim baza de cunostinte
        kb_text = ""
        try:
            with open("knowledge_base.txt", "r", encoding="utf-8") as f:
                kb_text = f.read()
        except:
            kb_text = "Baza de cunoștințe lipsește."

        # Construim promptul RAG
        prompt = f"""Ești 'CivicBot', un asistent virtual oficial al Primăriei. 
Rolul tău este să ajuți cetățenii oferindu-le răspunsuri EXCLUSIV bazate pe următoarea bază de date cu informații locale.

<BAZA_DE_CUNOSTINTE>
{kb_text}
</BAZA_DE_CUNOSTINTE>

REGULI CRITICE:
1. Răspunde politicos, scurt și la obiect, direct în limba în care ești întrebat (de obicei română).
2. Dacă informația NU se regăsește în <BAZA_DE_CUNOSTINTE>, TREBUIE să spui politicos că nu ai această informație și să îndrumi cetățeanul către ghișeul fizic sau numărul de telefon al primăriei. Nu inventa legi sau proceduri!
3. Nu răspunde la întrebări care nu au legătură cu primăria, administrația locală sau informațiile de mai sus (ex. rețete culinare, programare, glume).

Întrebarea cetățeanului: {req.message}
"""
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                interaction = client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=[prompt],
                )
                return ChatResponse(reply=interaction.text)
            except Exception as e:
                if '429' in str(e) and attempt < max_retries - 1:
                    print(f"Rate limit hit, retrying in 4 seconds... (Attempt {attempt+1})")
                    time.sleep(4)
                else:
                    raise e
    except Exception as e:
        print(f"Eroare Chat RAG: {e}")
        return ChatResponse(reply="Ne pare rău, am întâmpinat o eroare la procesarea mesajului tău (Limita API Google a fost depășită temporar).")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
