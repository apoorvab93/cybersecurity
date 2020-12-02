export function bimTargeted(model, img, lbl, targetLbl, {ε = 0.1, α = 0.01, iters = 10, loss = 1} = {}) {
    // Loss functions (of increasing complexity) that measure how close the image is to the target class
    function loss0(input) {
      return tf.metrics.categoricalCrossentropy(targetLbl, model.predict(input));  // Make input closer to target class
    }
    function loss1(input) {
      return loss0(input).sub(tf.metrics.categoricalCrossentropy(lbl, model.predict(input)));  // + Move input away from original class
    }
    let lossFn = [loss0, loss1][loss];
  
    // Random initialization for the PGD (for even better performance, we should try multiple inits)
    let aimg = img.add(tf.randomUniform(img.shape, -ε, ε)).clipByValue(0, 1);
  
    // Run PGD to MINIMIZE the loss w.r.t. aimg
    let grad = tf.grad(lossFn);
    for (let i = 0; i < iters; i++) {
      let delta = tf.sign(grad(aimg.reshape([1,28,28,1])).reshape([1,784])).mul(α);
      aimg = aimg.sub(delta);
      aimg = tf.minimum(1, tf.minimum(img.add(ε), tf.maximum(0, tf.maximum(img.sub(ε), aimg))));  // Clips aimg to ε distance of img
    }
  
    return aimg;
  }