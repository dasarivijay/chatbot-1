document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistoryList = document.getElementById('chatHistoryList');

    
    function appendMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = `<p>${message}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    
    function setActiveChat(chatId) {
        document.querySelectorAll('#chatHistoryList li').forEach(item => {
            item.classList.remove('active-chat');
        });

        if (chatId) {
            const activeItem = document.querySelector(`#chatHistoryList li[data-chat-id="${chatId}"]`);
            if (activeItem) {
                activeItem.classList.add('active-chat');
            }
        }

        chatMessages.dataset.currentChatId = chatId;
    }

    
    function clearChatDisplay() {
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <p>Hello! How can I assist you today?</p>
            </div>
        `;
        setActiveChat('');
    }

    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            appendMessage('bot', data.response);

            setActiveChat(data.chat_id);
            loadChatHistorySummary();

        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage('bot', `Oops! Something went wrong: ${error.message}`);
        } finally {
            userInput.focus();
        }
    }

    
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

   
    newChatBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to start a new chat?")) return;

        try {
            const response = await fetch('/new_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to start new chat.`);
            }

            clearChatDisplay();
            appendMessage('bot', 'New chat started. How can I assist you today?');
            loadChatHistorySummary();

        } catch (error) {
            console.error('Error starting new chat:', error);
            appendMessage('bot', `Failed to start a new chat: ${error.message}`);
        } finally {
            userInput.focus();
        }
    });

    
    async function loadChatHistorySummary() {
        try {
            const response = await fetch('/get_chat_history_summary');
            if (!response.ok) throw new Error(`Failed to load chat history.`);

            const summary = await response.json();
            chatHistoryList.innerHTML = '';

            if (summary.length === 0) {
                chatHistoryList.innerHTML = '<li class="no-history-msg">No previous chats. Start talking!</li>';
                return;
            }

            summary.forEach(chat => {
                const listItem = document.createElement('li');
                listItem.textContent = chat.title;
                listItem.dataset.chatId = chat.chat_id;

                
                listItem.addEventListener('click', () => {
                    loadSpecificChat(chat.chat_id);
                });

                
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.textContent = '✖';
                deleteBtn.title = 'Delete Chat';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteChat(chat.chat_id);
                });

                listItem.appendChild(deleteBtn);
                chatHistoryList.appendChild(listItem);
            });

            setActiveChat(chatMessages.dataset.currentChatId);

        } catch (error) {
            console.error('Error loading history:', error);
            chatHistoryList.innerHTML = '<li class="no-history-msg" style="color:red;">Failed to load history.</li>';
        }
    }

    async function loadSpecificChat(chatId) {
        try {
            const response = await fetch(`/get_chat_session/${chatId}`);
            if (!response.ok) throw new Error('Failed to load chat session.');

            const messages = await response.json();
            clearChatDisplay();

            if (messages.length === 0) {
                appendMessage('bot', 'This chat session is empty.');
            } else {
                messages.forEach(msg => appendMessage(msg.role, msg.content));
            }

            setActiveChat(chatId);

        } catch (error) {
            console.error('Error loading chat:', error);
            appendMessage('bot', `Could not load this chat: ${error.message}`);
        } finally {
            userInput.focus();
        }
    }

    
    async function deleteChat(chatId) {
        if (!confirm("Delete this chat permanently?")) return;

        try {
            const response = await fetch(`/delete_chat_session/${chatId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete chat.');

            const data = await response.json();
            console.log(data.message);

            if (chatMessages.dataset.currentChatId === chatId) {
                clearChatDisplay();
            }

            loadChatHistorySummary();

        } catch (error) {
            console.error('Error deleting chat:', error);
            appendMessage('bot', `Delete failed: ${error.message}`);
        } finally {
            userInput.focus();
        }
    }

    
    loadChatHistorySummary();
});
