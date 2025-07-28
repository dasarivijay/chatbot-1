import os
import json
from flask import Flask, render_template, request, jsonify, session
import google.generativeai as genai 
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'a_very_secret_key_for_dev_if_not_in_env')

# Load Gemini API key
gemini_api_key = os.getenv("GOOGLE_API_KEY")
if not gemini_api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set in .env file.")
genai.configure(api_key=gemini_api_key)

model = genai.GenerativeModel('gemini-1.5-flash')
CHAT_HISTORY_FILE = 'chat_history.json'

def load_chat_history():
    """Loads all chat sessions from a JSON file."""
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                print(f"Warning: {CHAT_HISTORY_FILE} is empty or malformed. Starting with empty history.")
                return {} 
    return {}

def save_chat_history(history):
    """Saves all chat sessions to a JSON file."""
    with open(CHAT_HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=4)

all_chat_sessions = load_chat_history()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new_chat', methods=['POST'])
def new_chat():
    session.pop('current_chat_id', None) 
    return jsonify({'message': 'New chat started. Conversation cleared.'})

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    chat_id = session.get('current_chat_id')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    if chat_id is None or chat_id not in all_chat_sessions:
        chat_id = os.urandom(16).hex() 
        all_chat_sessions[chat_id] = []
        session['current_chat_id'] = chat_id 

    current_conversation = all_chat_sessions[chat_id]
    current_conversation.append({"role": "user", "parts": [user_message]})

    try:
        gemini_history = []
        for msg in current_conversation:
            if msg['role'] == 'user':
                gemini_history.append({"role": "user", "parts": msg['parts']})
            elif msg['role'] == 'assistant': 
                gemini_history.append({"role": "model", "parts": msg['parts']})

        response = model.generate_content(gemini_history)
        bot_response = response.text

    except Exception as e:
        print(f"Error calling Google Gemini API: {e}")
        bot_response = "I apologize, but I'm having trouble connecting to the AI right now. Please try again later."
        current_conversation.pop()

    current_conversation.append({"role": "assistant", "parts": [bot_response]})
    save_chat_history(all_chat_sessions)

    return jsonify({'response': bot_response, 'chat_id': chat_id})

@app.route('/get_chat_history_summary', methods=['GET'])
def get_chat_history_summary():
    summary = []
    for chat_id, messages in all_chat_sessions.items():
        if messages:
            first_user_message_content = next((m['parts'][0] for m in messages if m['role'] == 'user' and m['parts']), "New Chat")
            summary.append({
                'chat_id': chat_id,
                'title': first_user_message_content[:40] + '...' if len(first_user_message_content) > 40 else first_user_message_content,
                'message_count': len(messages)
            })
    summary.reverse()
    return jsonify(summary)

@app.route('/get_chat_session/<chat_id>', methods=['GET'])
def get_chat_session(chat_id):
    if chat_id in all_chat_sessions:
        session['current_chat_id'] = chat_id
        formatted_messages = []
        for msg in all_chat_sessions[chat_id]:
            role = 'user' if msg['role'] == 'user' else 'bot'
            formatted_messages.append({'role': role, 'content': msg['parts'][0]}) 
        return jsonify(formatted_messages)
    return jsonify({'error': 'Chat session not found'}), 404

@app.route('/delete_chat_session/<chat_id>', methods=['DELETE'])
def delete_chat_session(chat_id):
    if chat_id in all_chat_sessions:
        del all_chat_sessions[chat_id]
        save_chat_history(all_chat_sessions)
        if session.get('current_chat_id') == chat_id:
            session.pop('current_chat_id', None) 
        return jsonify({'message': f'Chat session {chat_id} deleted successfully.'})
    return jsonify({'error': 'Chat session not found'}), 404


if __name__ == '__main__':
    os.makedirs('static', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    port = int(os.environ.get("PORT", 5000)) 
    app.run(host='0.0.0.0', port=port)        