const http = require('http');
const TINY_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);

    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Login as staff user khtc with default password
  console.log('=== Login ===');
  const loginRes = await makeRequest('POST', '/auth/login', { username: 'khtc', password: 'Ctec@123' });
  
  if (loginRes.status !== 200 || !loginRes.data.data || !loginRes.data.data.accessToken) {
    console.log('Login failed:', loginRes.status, JSON.stringify(loginRes.data).substring(0, 300));
    return;
  }
  
  const token = loginRes.data.data.accessToken;
  const user = loginRes.data.data.user;
  console.log('Login OK! User:', user.id, user.username, 'Role:', user.role);
  
  // Get an active asset
  console.log('\n=== Get assets ===');
  const assets = await makeRequest('GET', '/assets?status=active&limit=1', null, token);
  if (assets.status !== 200 || !assets.data.data || !assets.data.data.length) {
    console.log('No assets:', assets.status);
    return;
  }
  const asset = assets.data.data[0];
  console.log('Asset:', asset.id, asset.name, 'dept:', asset.current_department_id);
  
  // Create maintenance with damage images
  console.log('\n=== Create maintenance with images ===');
  const payload = {
    asset_id: asset.id,
    request_type: 'repair',
    department_id: asset.current_department_id || 1,
    description: 'Test bao hong voi hinh anh - ' + Date.now(),
    urgency: 'normal',
    damage_images: [TINY_PNG_BASE64],
  };
  
  console.log('Payload keys:', Object.keys(payload));
  console.log('damage_images is array:', Array.isArray(payload.damage_images));
  console.log('damage_images[0] length:', payload.damage_images[0].length);
  
  const res = await makeRequest('POST', '/maintenance', payload, token);
  console.log('\nResponse status:', res.status);
  
  if (res.status === 201 || res.status === 200) {
    const m = res.data.data;
    console.log('Maintenance ID:', m.id);
    console.log('damageImages count:', m.damageImages ? m.damageImages.length : 0);
    console.log('damage_images field:', m.damage_images ? 'present (len=' + m.damage_images.length + ')' : 'absent');
    
    if (m.damageImages && m.damageImages.length > 0) {
      console.log('\n*** SUCCESS! Images saved! ***');
      m.damageImages.forEach(function(img, i) {
        console.log('  Image ' + i + ': id=' + img.id + ' url=' + img.url);
      });
    } else {
      console.log('\n*** FAILED: No damageImages ***');
      // Show keys to debug
      console.log('Response keys:', Object.keys(m).filter(function(k) { return m[k] !== null && m[k] !== undefined; }).join(', '));
    }
    
    // Fetch detail to verify
    console.log('\n=== Fetch detail ===');
    const detail = await makeRequest('GET', '/maintenance/' + m.id, null, token);
    if (detail.status === 200) {
      const d = detail.data.data;
      console.log('Detail damageImages:', d.damageImages ? d.damageImages.length : 0);
      console.log('Detail damage_images:', d.damage_images ? 'present' : 'absent');
      if (d.damageImages && d.damageImages.length > 0) {
        console.log('*** VERIFIED! Image URL:', d.damageImages[0].url);
      }
    }
  } else {
    console.log('Error:', JSON.stringify(res.data).substring(0, 1000));
  }
}

main().catch(function(e) { console.error('Fatal:', e.message); });
