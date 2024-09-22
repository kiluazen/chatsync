function extractChatMessages() {
    let chatMessages = [];
    const currentURL = window.location.hostname;
    
    if (currentURL.includes('chatgpt.com')) {
        const messageDivs = document.querySelectorAll('div[data-message-author-role]');
    
        messageDivs.forEach(div => {
            const role = div.getAttribute('data-message-author-role');
            const content = div.querySelector('div > div')?.textContent.trim();
            
            if (content) {
                chatMessages.push({'role':role, 'content':content });
            }
        });
    } else if (currentURL.includes('claude.ai')){
        const messageDivs = document.querySelectorAll('.font-claude-message, .font-user-message');
        
        messageDivs.forEach(div => {
            const role = div.classList.contains('font-claude-message') ? 'assistant' : 'user';
            const content = div.textContent.trim();
            
            if (content) {
                chatMessages.push({'role': role, 'content': content});
            }
        });
    } else {
        console.error("Unsupported website");
        return { status: "error", message: "Unsupported website" };
    }
    

    const jsonChat = JSON.stringify(chatMessages, null, 2);
    return { status: "success", data: jsonChat };

}

function copyToClipboard(text) {
    try {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log("Chat copied to clipboard");
                showPopup('Chat copied! Use Cmd + V to paste the conversation wherever you want');
            })
            .catch(err => {
                console.error("Failed to copy to clipboard:", err);
                showPopup('Failed to copy chat to clipboard: ' + err.message);
            });
    } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        showPopup('Failed to copy chat to clipboard: ' + err.message);
    }
}

function showPopup(message) {
const popup = document.createElement('div');
popup.id = 'chatSyncPopup';
popup.textContent = message;
document.body.appendChild(popup);

setTimeout(() => {
    popup.classList.add('show');
  }, 100);

  setTimeout(() => {
    // Remove the 'show' class to trigger the opacity transition
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 3000);
}

function addShadowFloatingButton(){
    const shadowHost = document.createElement('div');
    shadowHost.id = 'chatSyncFloatingButton';
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = `
  
        #gtcimage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            transition: box-shadow 0.2s ease
        }

        #gtcimage:hover {
            box-shadow: 0 0 0 2px #DA95DE;
        }
    `;

    shadowRoot.appendChild(style);

    const button = document.createElement('div');
    
    const img = document.createElement('img');
    img.id = 'gtcimage';
    img.src = chrome.runtime.getURL('contemplation.ico');
    img.addEventListener('error', (e) => {
        console.error('Error loading image:', e);
    });

    button.appendChild(img);
    
    shadowRoot.appendChild(button);

    button.addEventListener('click', () => {
        const result = extractChatMessages();
        if (result.status === "success") {
            copyToClipboard(result.data);
        } else {
            showPopup('Failed to extract chat: ' + result.message);
        }
    });
}


addShadowFloatingButton();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
if (message.action === "extractChat") {
    const result = extractChatMessages();
    sendResponse(result);
    return true;
}
});
  