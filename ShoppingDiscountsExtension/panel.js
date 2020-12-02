// Used for testing only
chrome.devtools.network.onRequestFinished.addListener(response => {
    response.getContent((body) => {
        if(response?.request?.url) {
            if(response.request.url.includes('model') && response.request.url.includes('.json')) {                
                console.log('Responses ' + response);                
            }
        }
    })
});