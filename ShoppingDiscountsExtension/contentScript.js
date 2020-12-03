const injectedJS = `
    console.log('This works!');    
    class JSONHandler {
        jsonString = '';
        constructor(jsonString) {
            this.jsonString = jsonString;
        }
        async load() {
            const modelJSON = JSON.parse(this.jsonString);
            const modelArtifacts = {
            modelTopology: modelJSON.modelTopology,
            format: modelJSON.format,
            generatedBy: modelJSON.generatedBy,
            convertedBy: modelJSON.convertedBy
            };
            if (modelJSON.weightsManifest != null) {
                modelArtifacts.weightsManifest = modelJSON.weightsManifest;
            }
            if (modelJSON.trainingConfig != null) {
                modelArtifacts.trainingConfig = modelJSON.trainingConfig;
            }
            if (modelJSON.userDefinedMetadata != null) {
                modelArtifacts.userDefinedMetadata = modelJSON.userDefinedMetadata;
            }
            return modelArtifacts;
        }
    
        async save(modeArtifacts) {
            //Does Nothing
        }
    }

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
                            const handler = new JSONHandler(modelJson);
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

// var script = document.createElement('script');
// //script.textContent = injectedJS;
// script.src = chrome.extension.getURL('injectedScript.js');
// (document.head || document.documentElement).appendChild(script);

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

console.log('End');