// =====================================================================================
//  STORY MANIFEST — the list of bundled tales shown on the intro picker. Each entry is
//  lazy-loaded (dynamic import) only when selected, so adding a story does not grow the
//  initial download. `name`/`tagline` drive the intro buttons; `load()` returns the
//  story's `export default` data object.
//
//  To add a story: create stories/<id>/story.js (export default {...}) and add an entry
//  here. Nothing in the engine changes.
// =====================================================================================
export const STORIES = [
  {
    id: 'hallucination',
    name: 'STORY 0',
    tagline: 'A HALLUCINATION',
    load: () => import('./hallucination/story.js').then(m => m.default),
  },
  {
    id: 'danny-cole',
    name: 'STORY 1',
    tagline: 'THE LAST DEAL OF DANNY COLE',
    load: () => import('./danny-cole/story.js').then(m => m.default),
  },
];
