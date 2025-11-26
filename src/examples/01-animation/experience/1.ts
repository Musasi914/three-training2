import Experience from "./Experience";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/Addons.js";

export class Example1 {
  experience: Experience;
  scene: Experience["scene"];
  resource: Experience["resource"];
  gui: Experience["gui"];
  model: any;
  mixer: THREE.AnimationMixer;

  currentBaseAction = "idle";
  allActions: THREE.AnimationAction[] = [];
  baseActions = {
    idle: { weight: 1, action: null },
    clap: { weight: 0, action: null },
    angry: { weight: 0, action: null },
  } as Record<string, { weight: number; action: THREE.AnimationAction | null }>;
  panelSettings: Record<string, (() => void) | number> = {};

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.resource = this.experience.resource;
    this.gui = this.experience.gui;

    this.scene.add(new RoomEnvironment());

    this.model = this.setModel();
    this.mixer = this.setMixer();

    this.createGUI();
  }

  private setModel() {
    const model = this.resource.items.model;

    model.scene.traverse((child: THREE.Mesh) => {
      if (child.type === "Mesh") {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(model.scene);

    return model;
  }

  private setMixer() {
    const mixer = new THREE.AnimationMixer(this.model.scene);

    for (let i = 0; i < this.model.animations.length; i++) {
      const action = mixer.clipAction(this.model.animations[i]);
      const animationName = this.model.animations[i].name;

      this.baseActions[this.model.animations[i].name].action = action;

      const settings = this.baseActions[animationName];
      action.setEffectiveWeight(settings.weight);
      action.play();
    }

    return mixer;
  }

  private createGUI() {
    const names = Object.keys(this.baseActions);

    for (const name of names) {
      this.panelSettings[name] = () => {
        if (name !== this.currentBaseAction) {
          const beforeAction = this.baseActions[this.currentBaseAction].action;
          const afterAction = this.baseActions[name].action;

          if (!beforeAction || !afterAction) return;

          afterAction.setEffectiveWeight(1);
          afterAction.enabled = true;
          afterAction.time = 0;

          beforeAction.crossFadeTo(afterAction, 0.3);

          this.currentBaseAction = name;
        }
      };

      this.gui.add(this.panelSettings, name);
    }
  }
}
