import { useEffect, useRef } from "react";

export function useFlightAudio(enabled, state) {
  const audio = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const context = new Audio();
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 2,
      context.sampleRate,
    );
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++)
      channel[i] = (Math.random() * 2 - 1) * 0.35;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    const vario = context.createOscillator(),
      varioGain = context.createGain();
    vario.type = "sine";
    varioGain.gain.value = 0;
    vario.connect(varioGain).connect(context.destination);
    vario.start();
    audio.current = { context, gain, filter, vario, varioGain };
    context.resume().catch(() => {});
    return () => {
      source.stop();
      vario.stop();
      context.close();
      audio.current = null;
    };
  }, [enabled]);
  useEffect(() => {
    if (!audio.current) return;
    const { context, gain, filter, vario, varioGain } = audio.current;
    const flying = state.status === "flying";
    gain.gain.setTargetAtTime(
      flying ? 0.13 + state.speed / 500 : 0,
      context.currentTime,
      0.12,
    );
    filter.frequency.setTargetAtTime(
      350 + state.speed * 9,
      context.currentTime,
      0.15,
    );
    vario.frequency.setTargetAtTime(
      600 + Math.max(0, state.verticalSpeed) * 110,
      context.currentTime,
      0.1,
    );
    const beep =
      state.verticalSpeed > 0.4 &&
      Math.sin(state.time * (5 + state.verticalSpeed)) > 0;
    varioGain.gain.setTargetAtTime(
      flying && beep ? 0.025 : 0,
      context.currentTime,
      0.025,
    );
  }, [state]);
}
