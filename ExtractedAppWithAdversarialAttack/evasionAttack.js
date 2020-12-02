// The following method is an implementation of the Basic Interative Method attack
// Citation - @article{art2018,
//     title = {Adversarial Robustness Toolbox v1.2.0},
//     author = {Nicolae, Maria-Irina and Sinn, Mathieu and Tran, Minh~Ngoc and Buesser, Beat and Rawat, Ambrish and Wistuba, Martin and Zantedeschi, Valentina and Baracaldo, Nathalie and Chen, Bryant and Ludwig, Heiko and Molloy, Ian and Edwards, Ben},
//     journal = {CoRR},
//     volume = {1807.01069},
//     year = {2018},
//     url = {https://arxiv.org/pdf/1807.01069}
// }
// Citation 2 - adversarial js - https://github.com/kennysong/adversarial.js
export function basicIterativeMethod(model, image, label, targetLabel) {
    let ε = 0.1; // attack strength
    let α = 0.01; // small perturbation
    
    
    function firstLoss(input) {
      return tf.metrics.categoricalCrossentropy(targetLabel, model.predict(input)); 
    }

    function outerLoss(input) {
      return firstLoss(input).sub(tf.metrics.categoricalCrossentropy(label, model.predict(input))); 
    }

    let lossFunction = [firstLoss, outerLoss][1];
  
    // Random initialization for PGD(projected gradient descent)
    let adversarialImage = image.add(tf.randomUniform(image.shape, -ε, ε)).clipByValue(0, 1);
  
    // Minimize PGD
    let grad = tf.grad(lossFunction);
    // Run it for just 20 iterations to see results
    for (let i = 0; i < 20; i++) {
      // we need to reshape the image based on the model's expectations
      // In this case, the model being attacked expects a 4D tensor of the following shape
      let delta = tf.sign(grad(adversarialImage.reshape([1,28,28,1])).reshape([1,784])).mul(α);
      adversarialImage = adversarialImage.sub(delta);
      adversarialImage = tf.minimum(1, tf.minimum(image.add(ε), tf.maximum(0, tf.maximum(image.sub(ε), adversarialImage))));  
    }
  
    return adversarialImage;
  }