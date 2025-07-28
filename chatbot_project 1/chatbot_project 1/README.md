# Simple Chatbot using Python Flask

##  Project Overview  
This is a simple chatbot built using Python and Flask.  
It replies to user messages with predefined answers based on keywords.  
Chat history is stored in a JSON file, and users can also delete previous chats.


##  Project Setup Instructions

1. **Clone the project**
   ```bash
   git clone https://github.com/your-username/chatbot_project.git
   cd chatbot_project
   ```



2. **Install required packages**
   
   pip install flask python-dotenv


3. **Run the Flask app**
   
   python app.py
   

4. **Open in browser**
  
   http://127.0.0.1:5000/
   



##  Installed Packages (requirements.txt)


Flask==2.3.2
python-dotenv==1.0.1




##  How to Obtain and Configure Google Gemni API Key 



1. Go to https://makersuite.google.com/app and sign in with your Google account.


2. Accept the terms and start using the platform.


3. Visit https://aistudio.google.com/app/apikey.


4. Click on "Create API Key" to generate your Gemini API key.


5. Copy the key and use it in your project as needed.


GOOGLE_API_KEY="AIzaSyAenKTl1gnah0ybbzCKr4Tp3LIzMixC5_s"


##  Chatbot Usage Guide

- Type your message in the input box  
- Click **Send** to get a response  
- Click **Clear Chat** to delete previous messages  



##  Project Structure


chatbot_project/
│
├── app.py                 Flask backend
├── templates/
│   └── index.html         Chat UI
├── static/
│   └── style.css          Styling
├── chat_history.json      Stores previous chats
├── .env                   API Key 
└── README.md              Project info

