const numTicks = 1;

let tick = 0;
let sampleSum = 0;
let numSamples = 0;

class VolumeProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const channels = inputs[0];
    // const output = outputs[0];

    // for (let i = 0; i < channels.length; i++) {
      const i = 0;
      const samples = channels[i];
      for (let j = 0; j < samples.length; j++) {
        sampleSum += Math.abs(samples[j]);
      }
      numSamples += samples.length;
    // }

    if (++tick >= numTicks) {
      this.port.postMessage(sampleSum / numSamples);

      tick = 0;
      sampleSum = 0;
      numSamples = 0;
    }

    return true;
  }
}

registerProcessor('volume-processor', VolumeProcessor);