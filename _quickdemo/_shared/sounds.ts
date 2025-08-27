import * as THREE from "three";
import { audioLoader } from "./loader.js";

export const audioLis = new THREE.AudioListener();

export const bomb = createSound(
  "./data/mixkit-bomb-explosion-in-battle-2800.wav",
  audioLoader,
  audioLis
);

function createSound(
  url: string,
  audioLoader: THREE.AudioLoader,
  aLis: THREE.AudioListener
) {
  const sounds: THREE.Audio[] = [];

  const getSound = () => {
    let sound = sounds.find((s) => !s.isPlaying);

    if (!sound) {
      sound = new THREE.Audio(aLis);

      sound.setBuffer(buffer); // Set the loaded audio data to the sound source
      sound.setLoop(false); // Don't loop the sound effect
      sound.setVolume(0.7); // Set the volume (0.0 to 1.0)

      sounds.push(sound);
    }

    return sound;
  };

  let buffer = null;

  audioLoader.load(url, (_buffer) => {
    buffer = _buffer;
  });

  return {
    play: () => {
      if (!buffer) return;
      getSound().play();
    },
  };
}
