// LIBRARY — importing this registers every backdrop, light, actor, mover, prop and effect on
// the engine (side-effect imports). Add a new type to the matching file (or a new file imported
// here); from then on every story can place it by name.
import './backdrops/skyline.js';
import './backdrops/alley.js';
import './backdrops/rooftop.js';
import './backdrops/room.js';
import './lights.js';
import './actors/people.js';
import './actors/animals.js';
import './movers/vehicles.js';
import './props/casino.js';
import './props/weapons.js';
import './props/street.js';
import './effects/blood.js';
import './effects/atmosphere.js';
