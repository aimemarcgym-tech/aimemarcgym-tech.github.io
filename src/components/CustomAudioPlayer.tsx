"use client";

import { useEffect, useRef, useState } from "react";

// Lecteur audio "maison" : les contrôles natifs du navigateur n'exposent
// aucun curseur de volume sur mobile (Android/iOS le gèrent uniquement via
// les boutons physiques) — seul un bouton muet/son est disponible. Ce
// composant reconstruit lecture/pause, progression et volume nous-mêmes,
// avec un rendu identique sur PC, tablette et mobile.

// Un seul lecteur à la fois sur toute la page : quand l'un démarre, tous les
// autres (CustomAudioPlayer ailleurs dans la même liste, ou sur une autre
// page comme Faire ces musiques) se mettent en pause automatiquement.
const lecteursMontes = new Set<HTMLAudioElement>();

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Nouvelle musique chargée (changement de src) -> repartir de zéro.
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lecteursMontes.add(audio);
    return () => {
      lecteursMontes.delete(audio);
    };
  }, []);

  function handlePlay() {
    setPlaying(true);
    const audio = audioRef.current;
    for (const autre of lecteursMontes) {
      if (autre !== audio) autre.pause();
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  function handleSeek(value: number) {
    const audio = audioRef.current;
    if (audio) audio.currentTime = value;
    setCurrentTime(value);
  }

  function handleVolumeChange(value: number) {
    const audio = audioRef.current;
    setVolume(value);
    setMuted(value === 0);
    if (audio) {
      audio.volume = value;
      audio.muted = value === 0;
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    const next = !muted;
    setMuted(next);
    if (audio) audio.muted = next;
  }

  return (
    <div className="flex items-center gap-2 rounded border border-border-strong bg-surface px-2 py-1.5">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        onPlay={handlePlay}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
      <button
        type="button"
        onClick={togglePlay}
        title={playing ? "Pause" : "Lecture"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => handleSeek(Number(e.target.value))}
        className="accent-gradient-range min-w-0 flex-1"
      />
      <span className="w-8 shrink-0 text-[10px] tabular-nums text-muted">{formatTime(duration)}</span>
      <button
        type="button"
        onClick={toggleMute}
        title={muted ? "Réactiver le son" : "Couper le son"}
        className="shrink-0 text-sm text-muted hover:text-foreground"
      >
        {muted || volume === 0 ? "🔇" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => handleVolumeChange(Number(e.target.value))}
        className="accent-gradient-range w-16 shrink-0"
      />
    </div>
  );
}
