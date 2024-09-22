console.log("ChatSync Content Script Loaded");
let buttonAdded = false;
function downloadFile(content, filename, contentType) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve();
        }, 100);
    });
}

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
    console.log("Extracted chat:", jsonChat);
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

function addFloatingButton() {
    console.log('Adding floating button...');
    const button = document.createElement('div');
    button.id = 'chatSyncFloatingButton';
    button.textContent = '🍄';
    button.style.position = 'fixed';
    button.style.zIndex = '9999';
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        const result = extractChatMessages();
        if (result.status === "success") {
            copyToClipboard(result.data);
        } else {
            showPopup('Failed to extract chat: ' + result.message);
        }
    });
    button.addEventListener('DOMNodeRemovedFromDocument', handleButtonRemoved);
    buttonAdded = true;
    // button.addEventListener('click', () => {
    //     const result = extractChatMessages();
    //     if (result.status === "success") {
    //         console.log("Sending copyToClipboard message to background");
    //         chrome.runtime.sendMessage({action: "copyToClipboard", data: result.data}, (response) => {
    //             if (chrome.runtime.lastError) {
    //                 console.error("Error:", chrome.runtime.lastError);
    //                 showPopup('Failed to copy chat to clipboard: ' + chrome.runtime.lastError.message);
    //             } else if (response) { // Check if response is defined
    //                 if (response.success) {
    //                     showPopup('Chat copied! Use Cmd + V to paste the conversation wherever you want');
    //                 } else {
    //                     showPopup('Failed to copy chat to clipboard: ' + (response.error || 'Unknown error'));
    //                 }
    //             } else {
    //                 showPopup('No response received from background script.');
    //             }
    //         });
    //     } else {
    //         showPopup('Failed to extract chat: ' + result.message);
    //     }
    // });
  }
function handleButtonRemoved(event) {
    console.log('Fucking hell')
    // addFloatingButton();
    // Add your callback function code here
    // You can perform any additional actions or logging here
    // You can also access the removed button element using `event.target`
}

function showPopup(message) {
const popup = document.createElement('div');
popup.id = 'chatSyncPopup';
popup.textContent = message;
document.body.appendChild(popup);

setTimeout(() => {
    popup.remove();
}, 3000);
}

function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        console.log('MutationObserver triggered');
        console.log('MUTATIONS',mutations)
        mutations.forEach((mutation) => {
            // console.log(mutation)
            if (!document.getElementById('chatSyncFloatingButton')) {
                console.log('Button not found, adding it...');
                addFloatingButton();
            } else {
                // Check if the button was removed from the DOM
                const removedNodes = mutation.removedNodes;
                console.log('Removed Nodes',removedNodes)
                for (let i = 0; i < removedNodes.length; i++) {
                    
                    if (removedNodes[i].id === 'chatSyncFloatingButton') {
                        console.log('Button removed from DOM');
                        // Call your callback function here
                        handleButtonRemoved();
                    }
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function addShadowFloatingButton(){
    console.log('Adding Shadow floating button...');
    

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

    // Append style to shadow root
    shadowRoot.appendChild(style);

    const button = document.createElement('div');
    // button.textContent = '🍄';
    // button.style.position = 'fixed';
    // button.style.zIndex = '9999';
    
    
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

    button.addEventListener('DOMNodeRemovedFromDocument', handleButtonRemoved);
    buttonAdded = true;
}

// observeDOMChanges();
  // Call this function when the content script loads
addShadowFloatingButton();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
if (message.action === "extractChat") {
    console.log("Received extractChat message");
    const result = extractChatMessages();
    sendResponse(result);
    return true;
}
});
  