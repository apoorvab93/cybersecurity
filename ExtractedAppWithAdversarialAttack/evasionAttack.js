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


// Jacobian-based Saliency Map attack
// Citation - adversarial js - https://github.com/kennysong/adversarial.js
  export function jsma(model, img, lbl, targetLbl, {ε = 28} = {}) {
    // Compute useful constants
    let NUM_PIXELS = img.flatten().shape[0];      // Number of pixels in the image (for RGB, each channel counts as one "pixel")
    let LT = targetLbl.argMax(1).arraySync()[0];  // Target label as an index rather than a one-hot vector
    if (NUM_PIXELS > 32*32*3) { throw 'JSMA does not scale to images larger than CIFAR-10 (32x32x3)!'; }
  
    // Function that outputs the target class probability of an image (used for per-pixel saliency)
    let classProbs = [];
    for (let l = 0; l < 10; l++) {
      classProbs.push(img => tf.dot(model.predict(img.reshape([1,28,28,1])), tf.oneHot(l, 10)));
    }
  
    // We copy image data into an array to easily make per-pixel perturbations
    let imgArr = img.flatten().arraySync();
  
    // Track what pixels we've changed and should not change again (set bit to 0 in this mask)
    let changedPixels = tf.ones([NUM_PIXELS, NUM_PIXELS]).arraySync();
    for (let p = 0; p < NUM_PIXELS; p++) {
      changedPixels[p][p] = 0;  // (p, p) is not a valid pair of two different pixels
    }
  
    // Modify the pixel pair with the highest impact (saliency) on the target class probability, and repeat
    let grads = classProbs.map(classProb => tf.grad(classProb));
    let aimg = tf.tensor(imgArr, img.shape);
    for (let i = 0; i < Math.floor(ε/2); i++) {
      // Compute highest impact pixel pair to change, and update that pixel pair in imgArr
      tf.tidy(() => {  // (This must be in tf.tidy() as there are many intermediate NUM_PIXELS^2 matrices)
        // Compute all gradients ∂classProb / ∂img
        let gs = [];
        for (let l = 0; l < 10; l++) { gs.push(grads[l](aimg)); }
  
        // Compute α_pq for all pairs of pixels (p, q), vectorized using an outer sum
        // (Outer sum works by broadcasting: https://stackoverflow.com/a/33848814/908744)
        let α = tf.add(gs[LT].reshape([1, NUM_PIXELS]), gs[LT].reshape([NUM_PIXELS, 1]))
  
        // Compute β_pq for all pairs of pixels (p, q)
        // (Note that we swap the order of summations from the paper pseudocode. In case it's
        // not obvious we can do that, see: https://math.stackexchange.com/a/1931615/28855)
        let β = tf.zerosLike(α);
        for (let l = 0; l < 10; l++) {
          if (l === LT) { continue; }
          β = β.add(tf.add(gs[l].reshape([1, NUM_PIXELS]), gs[l].reshape([NUM_PIXELS, 1])))
        }
  
        // Compute the best (highest saliency) pair of pixels (p, q)
        let saliencyGrid = tf.mul(α.neg(), β).mul(α.greater(0)).mul(β.less(0));
        let changedPixelsMask = tf.tensor(changedPixels);
        let [p, q] = argmax2d(saliencyGrid.mul(changedPixelsMask));
  
        // Change that pixel pair in the image data array
        imgArr[p] = 1;
        imgArr[q] = 1;
  
        // Remember that we've modified this pixel pair
        for (let j = 0; j < NUM_PIXELS; j++) {
          changedPixels[j][p] = 0;
          changedPixels[j][q] = 0;
          changedPixels[p][j] = 0;
          changedPixels[q][j] = 0;
        }
      });
  
      // Update the aimg tensor with the latest imgArr data
      aimg.dispose();  // Delete old data, otherwise the old tensor becomes an orphaned memory leak
      aimg = tf.tensor(imgArr, img.shape);
    }
  
    return aimg;
  }

  /**
* Returns the [row, col] coordinate of the maximum element in a square matrix.
*/
function argmax2d(m) {
  if (m.shape[0] !== m.shape[1]) { throw 'argmax2d() only supports square matrices!'; }
  let N = m.shape[0];
  let idx = tf.argMax(m.reshape([-1])).dataSync()[0];
  let row = Math.floor(idx / N);
  let col = idx % N;
  return [row, col];
}