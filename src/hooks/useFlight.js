import { useCallback, useEffect, useRef, useState } from "react";
import { createFlight, stepFlight } from "../sim/physics";

export function useFlight() {
  const flight = useRef(createFlight());
  const input = useRef({ left: false, right: false, up: false, down: false });
  const [snapshot, setSnapshot] = useState({ ...flight.current });
  const [settings, setSettings] = useState({
    weather: "sunny",
    wind: 12,
    thermals: true,
  });
  const settingsRef = useRef(settings);
  const [camera, setCamera] = useState("chase");
  const [modal, setModal] = useState(null);
  const resumeAfterModal = useRef(false);
  settingsRef.current = settings;

  const publish = useCallback(
    () => setSnapshot({ ...flight.current, trail: [...flight.current.trail] }),
    [],
  );
  const start = useCallback(() => {
    flight.current.status = "flying";
    publish();
  }, [publish]);
  const pause = useCallback(() => {
    if (flight.current.status === "flying") flight.current.status = "paused";
    else if (["paused", "ready"].includes(flight.current.status))
      flight.current.status = "flying";
    publish();
  }, [publish]);
  const restart = useCallback(() => {
    flight.current = createFlight();
    input.current = { left: false, right: false, up: false, down: false };
    setModal(null);
    publish();
  }, [publish]);
  const switchCamera = useCallback(
    () => setCamera((value) => (value === "chase" ? "cockpit" : "chase")),
    [],
  );
  const toggleThermals = useCallback(
    () => setSettings((value) => ({ ...value, thermals: !value.thermals })),
    [],
  );
  const openModal = useCallback(
    (name) => {
      resumeAfterModal.current = flight.current.status === "flying";
      if (resumeAfterModal.current) flight.current.status = "paused";
      input.current = { left: false, right: false, up: false, down: false };
      setModal(name);
      publish();
    },
    [publish],
  );
  const closeModal = useCallback(() => {
    setModal(null);
    if (resumeAfterModal.current && flight.current.status === "paused")
      flight.current.status = "flying";
    publish();
  }, [publish]);

  useEffect(() => {
    const directions = {
      ArrowLeft: "left",
      a: "left",
      ArrowRight: "right",
      d: "right",
      ArrowUp: "up",
      w: "up",
      ArrowDown: "down",
      s: "down",
    };
    const keydown = (event) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName))
        return;
      if (modal) {
        if (event.key === "Escape") closeModal();
        return;
      }
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        input.current[direction] = true;
      }
      if (event.repeat) return;
      if (event.code === "Space" && event.target.tagName !== "BUTTON") {
        event.preventDefault();
        pause();
      }
      if (event.key.toLowerCase() === "r") restart();
      if (event.key.toLowerCase() === "c") switchCamera();
      if (event.key.toLowerCase() === "t") toggleThermals();
      if (event.key === "?") openModal("help");
    };
    const keyup = (event) => {
      if (directions[event.key]) input.current[directions[event.key]] = false;
    };
    const blur = () => {
      input.current = { left: false, right: false, up: false, down: false };
      if (flight.current.status === "flying") {
        flight.current.status = "paused";
        publish();
      }
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [
    modal,
    closeModal,
    pause,
    restart,
    switchCamera,
    toggleThermals,
    openModal,
    publish,
  ]);

  const tick = useCallback(
    (dt) => stepFlight(flight.current, input.current, settingsRef.current, dt),
    [],
  );
  return {
    flight,
    input,
    snapshot,
    settings,
    setSettings,
    camera,
    modal,
    start,
    pause,
    restart,
    switchCamera,
    toggleThermals,
    openModal,
    closeModal,
    tick,
    publish,
  };
}
