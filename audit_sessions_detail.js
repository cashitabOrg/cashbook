const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditSessionsDetail() {
    const storeSlug = 'frozenpay-foodies';
    const { data: store } = await supabase.from('stores').select('id, name').eq('slug', storeSlug).single();
    
    if (!store) {
        fs.writeFileSync('audit_report.txt', 'Store not found');
        return;
    }

    let report = `Auditing detailed sessions for store: ${store.name} (${store.id})\n\n`;

    const start = '2026-04-03T00:00:00Z';
    const end = '2026-04-06T23:59:59Z';

    const { data: sessions, error } = await supabase
        .from('sales_sessions')
        .select('id, started_at, ended_at, status, manager_id, total_revenue')
        .eq('store_id', store.id)
        .gte('started_at', start)
        .lte('started_at', end)
        .order('started_at', { ascending: true });

    if (error) {
        report += `Error: ${error.message}\n`;
    } else {
        report += `Total sessions in range: ${sessions.length}\n`;
        sessions.forEach(s => {
            const localDate = new Intl.DateTimeFormat('en-CA', { 
                timeZone: 'Africa/Lagos', 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            }).format(new Date(s.started_at));

            report += `ID: ${s.id}\n`;
            report += `  Store ID: ${store.id}\n`;
            report += `  Manager ID: ${s.manager_id}\n`;
            report += `  Started (UTC): ${s.started_at}\n`;
            report += `  Local Date (WAT): ${localDate}\n`;
            report += `  Status: ${s.status}\n`;
            report += `  Revenue: ${s.total_revenue}\n`;
            report += '---\n';
        });
    }

    fs.writeFileSync('audit_report.txt', report);
    console.log('Audit results written to audit_report.txt');
}

auditSessionsDetail();
