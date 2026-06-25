// =====================================================================================
//  ACTOR LIBRARY — reusable noir cast & props. Each registers itself on the Noir engine
//  by name, so any story can place it by `{ actor: 'name', x, scale, ... }`. Importing
//  this module registers every group (side-effect imports). Add a new prop to the group
//  file it belongs to (or a new group here); from then on every story can use it.
// =====================================================================================
import './people.js';
import './weapons.js';
import './casino.js';
import './street.js';
import './aftermath.js';
