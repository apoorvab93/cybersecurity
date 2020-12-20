# Cybersecurity in Emerging Environments
This repository holds the work for the topic- Security Analysis of ML models made with tensorflow.js

# Folder Structure

## ShoppingDiscountsExtension
This is malicious extension that can covertly inject javascript code to any webpage.
The injected code always listens to network traffic and checks if the page requests any tensorflow js models from its backend
If a model is detected, the extension code, can capture the model and send it to an attacker.

To test this extension -
1. Open google and in the address bar type chrome://extensions
2.  On the top right of the Extensions page, enable "developer mode"
3. Click on "Load Unpacked" button and choose the location of this ShoppingDiscountsExtension folder
4. The extension is now loaded and ready for covert javascript injections

## ExtractedModels 
This folder contains some public web applications that were choosen for model extraction via the "ShoppingDiscountsExtension" browser extension.
Each folder name represents the web application attacked. Inside each folder is a README.md file that stores the URL for the web application.

To test the attacks -
1. Ensure you have ShoppingDiscountsExtension installed, See steps above
2.  Visit the URL in your browser
3. In its current developer mode, the extension will simply download the extracted models to your computer but can easily be sent to another web application hosted by the attacker.

## ExtractedApp
This folder contains a web application that is built by me but uses a ML model that was extracted from a target.
Since the model was extracted exactly as used by the target, this app mirrors the functionalities available in the target application

To test the attacks -
1. Copy the contents of the folder to a webserver. I recommend using Microsoft Visual Studio Code IDE and installing extension "Live Server". Once installed, you can open the extracted app folder in Visual Studio Code and right click on index.html and choose menu item "Open with Live Server". This would start a lite webserver and serve the extracted application on a browser for you to test locally.

## ExtractedAppWithAdversarialAttack
This folder contains the same web application as above but this time, instead of just using the extracted model, I also attack it with targeted evasion attacks.
Two attacks are implemented
1. Basic Iterative Method
2. Jacobian based Saliency Method 
The latter has a much higher success rate on the target model. In this app, a user draws an image and an attacker can then use the image to generate an adversarial example such that when the targeted model is provided the adversarial example instead of the user drawn image, the model incorrectly classifies the image to a class provided by the attacker. Such an attack can be made using injected javascript on the page where malicious attacker can override the user input and force models to predict on adversarial examples instead. All of this can be done covertly without the user realizing the attack.


## TensorFlowTest
This is for testing purposes only. Ignore

## TransferLearning
This is for testing purposes only. Ignore
