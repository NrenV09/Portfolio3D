import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PORTFOLIO,
  createNewProjectTemplate,
  getActFromProgress,
  getActScrollTarget,
  getCurvedPanelLayout,
  parsePortfolioImport,
  validateProfile,
  validateProject,
} from './portfolio-logic';

test('getActFromProgress maps scroll progress across all four acts', () => {
  assert.equal(getActFromProgress(0).act, 1);
  assert.equal(getActFromProgress(0.23).act, 1);
  assert.equal(getActFromProgress(0.25).act, 2);
  assert.equal(getActFromProgress(0.55).act, 2);
  assert.equal(getActFromProgress(0.58).act, 3);
  assert.equal(getActFromProgress(0.82).act, 3);
  assert.equal(getActFromProgress(0.85).act, 4);
  assert.equal(getActFromProgress(1.0).act, 4);
});

test('getActScrollTarget stays inside each act progress band', () => {
  assert.equal(getActFromProgress(getActScrollTarget(1)).act, 1);
  assert.equal(getActFromProgress(getActScrollTarget(2)).act, 2);
  assert.equal(getActFromProgress(getActScrollTarget(3)).act, 3);
  assert.equal(getActFromProgress(getActScrollTarget(4)).act, 4);
});

test('getCurvedPanelLayout generates distinct staggered positions for projects', () => {
  const p0 = getCurvedPanelLayout(0, 4);
  const p1 = getCurvedPanelLayout(1, 4);
  const p2 = getCurvedPanelLayout(2, 4);

  assert.notEqual(p0.x, p1.x);
  assert.equal(p0.x, p2.x);
  assert.ok(p0.y > p2.y);
  assert.ok(p0.z > p1.z);
});

test('validateProfile catches empty required fields and invalid email', () => {
  const validRes = validateProfile(DEFAULT_PORTFOLIO.profile);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.errors.length, 0);

  const invalidRes = validateProfile({
    ...DEFAULT_PORTFOLIO.profile,
    name: '   ',
    email: 'not-an-email',
  });
  assert.equal(invalidRes.valid, false);
  assert.equal(invalidRes.errors.length, 2);
});

test('validateProject enforces required title, subtitle, description, and stack', () => {
  const validRes = validateProject(DEFAULT_PORTFOLIO.projects[0]);
  assert.equal(validRes.valid, true);

  const template = createNewProjectTemplate(4);
  assert.equal(validateProject(template).valid, true);

  const invalidRes = validateProject({
    ...template,
    title: '',
    stack: [],
  });
  assert.equal(invalidRes.valid, false);
  assert.equal(invalidRes.errors.length, 2);
});

test('parsePortfolioImport sanitizes valid JSON and rejects broken payloads', () => {
  const validJson = JSON.stringify({
    profile: { name: 'Alex Rivera', email: 'alex@example.com' },
    projects: [{ title: 'Orbital Engine', stack: ['Rust', 'WebGPU'] }],
  });
  const ok = parsePortfolioImport(validJson);
  assert.equal(ok.error, null);
  assert.ok(ok.data);
  assert.equal(ok.data.profile.name, 'Alex Rivera');
  assert.equal(ok.data.projects[0].title, 'Orbital Engine');
  assert.equal(ok.data.pillars.length, 3);

  const badJson = parsePortfolioImport('{not valid');
  assert.equal(badJson.data, null);
  assert.ok(badJson.error);

  const emptyProjects = parsePortfolioImport(
    JSON.stringify({ profile: { name: 'Alex' }, projects: [] })
  );
  assert.equal(emptyProjects.data, null);
  assert.ok(emptyProjects.error);
});
