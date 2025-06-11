import { createClient } from '@supabase/supabase-js';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Ambil data hero dari Supabase
const { data, error } = await supabase
  .from('heroes')
  .select('*')
  .limit(1);

if (error) {
  console.error('Gagal ambil data hero:', error.message);
  process.exit(1);
}

const hero = data[0] || {
  channel: 'belum ada',
  str: 0,
  agi: 0,
  int_: 0,
  xp: 0,
};

// Gambar frame sederhana
const svg = await satori(
  {
    type: 'div',
    props: {
      children: [
        {
          type: 'h1',
          props: { children: `Channel: ${hero.channel}` }
        },
        {
          type: 'p',
          props: { children: `STR: ${hero.str} | AGI: ${hero.agi} | INT: ${hero.int_} | XP: ${hero.xp}` }
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

// Simpan hasil ke file PNG (opsional untuk lokal testing)
const resvg = new Resvg(svg);
const png = resvg.render().asPng();
await fs.promises.writeFile('./hero.png', png);
