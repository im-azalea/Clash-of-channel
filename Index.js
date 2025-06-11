const { createClient } = require('@supabase/supabase-js');
const satori = require('satori');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// -- Inisialisasi Klien & Font --
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
// Menggunakan path.resolve untuk memastikan path font benar di lingkungan server
const font = fs.readFileSync(path.resolve('./fonts/Inter-Regular.ttf'));

module.exports = async (req, res) => {
    try {
        // Ambil nama channel dari URL, jika tidak ada, gunakan 'degen' sebagai default
        const channelId = req.query.channel || 'degen';

        // -- Ambil Data Pahlawan dari Supabase --
        let { data: hero } = await supabase
            .from('heroes')
            .select('*')
            .eq('channel_id', channelId)
            .single(); // .single() untuk mengambil satu baris data saja

        // -- Jika Pahlawan Belum Ada, Buat Data Sementara untuk Ditampilkan --
        if (!hero) {
            hero = {
                name: 'Pahlawan Belum Lahir',
                level: 0,
                channel_id: channelId,
                str: 0, agi: 0, int: 0,
                image_url: 'https://i.imgur.com/T5n1o5C.png' // Gambar telur default
            };
        }

        // -- Buat Gambar Tampilan Frame dengan Satori --
        const svg = await satori(
            <div style={{
                height: '100%', width: '100%', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#131417', color: 'white', fontFamily: 'Inter, sans-serif',
                backgroundImage: 'url(https://i.imgur.com/M33a4oI.png)', // URL Background
            }}>
                <img src={hero.image_url || 'https://i.imgur.com/T5n1o5C.png'} width="180" height="180" style={{ border: '4px solid #55429a', borderRadius: '16px', objectFit: 'cover' }} />
                <h1 style={{ fontSize: 52, margin: '15px 0 5px 0', textTransform: 'capitalize' }}>{hero.name}</h1>
                <p style={{ fontSize: 28, margin: 0, color: '#aaa' }}>Channel: /{hero.channel_id} - Lv. {hero.level}</p>
                <div style={{ display: 'flex', fontSize: 36, gap: '50px', marginTop: '30px' }}>
                    <span>⚔️ STR: {hero.str}</span>
                    <span>💨 AGI: {hero.agi}</span>
                    <span>🧠 INT: {hero.int}</span>
                </div>
            </div>,
            {
                width: 1146,
                height: 600,
                fonts: [{ name: 'Inter', data: font, weight: 400 }]
            }
        );

        // -- Konversi Gambar SVG ke PNG --
        const png = new Resvg(svg).render().asPng();

        // Dapatkan URL Vercel untuk post_url
        const appUrl = process.env.VERCEL_URL;

        // -- Kirim HTML Frame ke Farcaster --
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Clash of Channel</title>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="data:image/png;base64,${png.toString('base64')}" />
                <meta property="fc:frame:post_url" content="https://${appUrl}/api/action?channel=${channelId}" />
                <meta property="fc:frame:button:1" content="Latih STR (10 XP)" />
                <meta property="fc:frame:button:2" content="Latih AGI (10 XP)" />
                <meta property="fc:frame:button:3" content="Latih INT (10 XP)" />
            </head>
            <body><h1>Clash of Channel by [Your Name/Project]</h1></body>
            </html>
        `);

    } catch (error) {
        console.error("Error di index.js:", error.message);
        res.status(500).send('Server Error: ' + error.message);
    }
};
