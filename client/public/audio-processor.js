class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const channelData = input[0];
      const copy = new Float32Array(channelData);
      this.port.postMessage({ audioData: copy }, [copy.buffer]);
    }
    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
