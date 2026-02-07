// lifecycle.js
// Pure deterministic flower lifecycle based on real-world time

const LIFECYCLE = {
  SEED: 0,
  SPROUT: 6 * 60 * 60, // 6 hours
  GROWING: 24 * 60 * 60, // 1 day
  BLOOM: 3 * 24 * 60 * 60, // 3 days
  OLD: 5 * 24 * 60 * 60, // 5 days
  FALLEN: 7 * 24 * 60 * 60, // 7 days
};

const SOIL_MERGE_TIME = 2 * 24 * 60 * 60; // 2 days

function getFlowerAgeSeconds(plantedAt) {
  const plantedTime = new Date(plantedAt).getTime();
  const now = Date.now();
  return Math.floor((now - plantedTime) / 1000);
}

function getLifecycleStage(age) {
  if (age < LIFECYCLE.SPROUT) return "seed";
  if (age < LIFECYCLE.GROWING) return "sprout";
  if (age < LIFECYCLE.BLOOM) return "growing";
  if (age < LIFECYCLE.OLD) return "bloom";
  if (age < LIFECYCLE.FALLEN) return "old";
  return "fallen";
}

function canPlantAgain(age) {
  return age >= LIFECYCLE.FALLEN + SOIL_MERGE_TIME;
}

function getFlowerState(plantedAt) {
  const age = getFlowerAgeSeconds(plantedAt);
  const stage = getLifecycleStage(age);
  
  // Calculate specific details for the renderer
  let nextStageIn = 0;
  let message = "";
  
  if (stage === "fallen") {
    const remaining = LIFECYCLE.FALLEN + SOIL_MERGE_TIME - age;
    if (remaining > 0) {
       const hours = Math.ceil(remaining / 3600);
       message = `you can plant again in ${hours} hours`;
    } else {
       message = "you can plant again 🌱";
    }
  }

  return {
    age,
    stage,
    message
  };
}
