const token = process.env.VERCEL_TOKEN;
const team = process.env.TEAM_ID;
async function main() {
  const headers = { Authorization: `Bearer ${token}` };
  let purl = 'https://api.vercel.com/v9/projects?limit=100';
  if (team) purl += `&teamId=${team}`;
  const pres = await fetch(purl, { headers });
  const pdata = await pres.json();
  if (!pres.ok) { console.log('projects err', pres.status, JSON.stringify(pdata)); return; }
  const cms = (pdata.projects || []).find(p => p.name === 'cms' || p.id === 'cms');
  console.log('cms project =>', cms ? JSON.stringify({ id: cms.id, name: cms.name }) : 'NOT FOUND');
  if (!cms) return;
  let durl = `https://api.vercel.com/v6/deployments?projectId=${cms.id}&limit=10`;
  if (team) durl += `&teamId=${team}`;
  const dres = await fetch(durl, { headers });
  const ddata = await dres.json();
  if (!dres.ok) { console.log('deploy err', dres.status, JSON.stringify(ddata)); return; }
  for (const d of (ddata.deployments || [])) {
    console.log([d.uid, '|', d.name, '|', d.state, '|', d.created].join(' '));
  }
}
main().catch(e => console.error(e));
