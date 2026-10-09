// Original procedural audio. No downloaded samples or external audio requests.
export class Sound {
  private context?: AudioContext;
  private musicTimer?: number;
  private note = 0;
  enabled = true;
  musicEnabled = true;
  unlock() {
    this.context ??= new AudioContext();
    void this.context.resume();
  }
  effect(kind: string) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const patterns: Record<string, number[]> = {
      turn: [260, 390],
      place: [520, 780],
      confused: [440, 330],
      prank: [520, 460, 620],
      candy: [660, 880],
      boo: [180, 130, 260],
      homeward: [660, 880, 1047],
      arrival: [523, 659, 784],
      win: [523, 659, 784, 1047],
      lose: [392, 330, 262],
    };
    (patterns[kind] ?? []).forEach((f, i) =>
      this.tone(
        f,
        this.context!.currentTime + i * 0.085,
        0.14,
        0.045,
        kind === 'turn' ? 'triangle' : 'sine',
      ),
    );
  }
  startMusic() {
    if (this.musicTimer || !this.context || !this.musicEnabled) return;
    const melody = [220, 0, 330, 392, 440, 392, 330, 0, 196, 0, 294, 330, 392, 330, 294, 0];
    this.musicTimer = window.setInterval(() => {
      if (this.context?.state === 'running' && this.musicEnabled) {
        const f = melody[this.note++ % melody.length];
        if (f) this.tone(f, this.context.currentTime, 0.6, 0.018, 'sine');
      }
    }, 430);
  }
  stopMusic() {
    window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }
  private tone(f: number, at: number, duration: number, volume: number, type: OscillatorType) {
    const ctx = this.context!;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = f;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.01);
  }
}
