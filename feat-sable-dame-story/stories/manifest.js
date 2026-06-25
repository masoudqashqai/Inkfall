// STORY MANIFEST — the tales on the intro picker, lazy-loaded on selection. Add a story:
// create stories/<id>/story.js (export default {...}) and add an entry here. No engine change.
export const STORIES = [
  { id: 'hallucination', name: 'STORY 0', tagline: 'A HALLUCINATION', load: () => import('./hallucination/story.js').then(m => m.default) },
  { id: 'danny-cole', name: 'STORY 1', tagline: 'THE LAST DEAL OF DANNY COLE', load: () => import('./danny-cole/story.js').then(m => m.default) },
  { id: 'sable-dame', name: 'STORY 2', tagline: 'THE SABLE DAME', load: () => import('./sable-dame/story.js').then(m => m.default) },
];
