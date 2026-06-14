const fs = require('fs');

async function main() {
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const url = `${envVars.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${envVars.SUPABASE_SERVICE_ROLE_KEY}`;
  
  console.log('Fetching OpenAPI spec from:', envVars.NEXT_PUBLIC_SUPABASE_URL);
  
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/openapi+json'
    }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch:', res.status, await res.text());
    return;
  }
  
  const spec = await res.json();
  fs.writeFileSync('scripts/openapi.json', JSON.stringify(spec, null, 2));
  console.log('OpenAPI spec saved to scripts/openapi.json');
  
  // Print all paths containing /rpc/
  const rpcs = Object.keys(spec.paths).filter(p => p.startsWith('/rpc/'));
  console.log('Exposed RPCs:', rpcs);
}

main().catch(console.error);
