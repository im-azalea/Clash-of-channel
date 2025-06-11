import { createClient } from '@supabase/supabase-js';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { getFrameMetadata } from 'frog/next';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Neynar
const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

// Fungsi bantu: ambil Hero berdasarkan channel
async function getOrCreateHero(channel) {
  let { data, error } = await supabase
    .from('heroes')
    .select('*')
    .eq('channel', channel)
    .single();

  if (!data) {
    const { data: newHero, error: insertError } = await supabase
      .from('heroes')
      .insert({ channel })
      .select()
      .single();
    return newHero;
  }

  return data;
}

// Fungsi bantu: update Hero ketika dilatih
async function trainHero(channel) {
  const column = ['str', 'agi', 'int_'][Math.floor(Math.random() * 3)];
  await supabase.rpc('increment_stat', { channel_name: channel, column_name: column });
}

// Fungsi bantu: bikin SVG untuk Frame
async function renderFrame(hero) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        children: [
          {
            type: 'h1',
            props: { children: `🔥 ${hero.channel}` }
          },
          {
            type: 'p',
            props: {
              children: `STR: ${hero.str} | AGI: ${hero.agi} | INT: ${hero.int_} | XP: ${hero.xp}`
            }
          }
        ]
      }
    },
    {
      width: 600,
      height: 300,
      fonts: [
        {
          name: 'Arial',
          data: await fs.promises.readFile('./fonts/Arial.ttf'),
          weight: 400,
          style: 'normal'
        }
      ]
    }
  );

  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();
  return png;
}

export default async function handler(req, res) {
  const frameMeta = getFrameMetadata(req);

  // Langkah 1: Validasi user dari Neynar
  const castId = frameMeta?.castId;
  if (!castId) return res.status(400).send('No cast found');

  const { author } = await neynar.lookUpCastByHash(castId.hash, castId.fid);
  const channel = author.channel?.name || 'unknown';

  // Langkah 2: Ambil data Hero
  if (req.method === 'POST') {
    await trainHero(channel);
  }

  const hero = await getOrCreateHero(channel);
  const imageBuffer = await renderFrame(hero);

  // Kirim Frame PNG
  res.setHeader('Content-Type', 'image/png');
  res.send(imageBuffer);
}
