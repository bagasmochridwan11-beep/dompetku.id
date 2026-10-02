import express from 'express';
import http from 'http';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Allow larger payload for image uploads (receipt scanning)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Initialize Google GenAI client (server-side only)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Helper to call Gemini with automatic model fallback
  async function callGeminiWithFallback(params: {
    contents: any;
    config: any;
    preferredModels?: string[];
  }) {
    const models = params.preferredModels || ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        console.warn(`Model ${model} encounter:`, err.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error('Semua model AI sedang sibuk.');
  }

  // Smart local parser fallback for Indonesian chat input if remote AI is down
  function fallbackParseTransaction(
    message: string,
    categories: any[],
    subcategories: any[],
    todayDate: string
  ) {
    let nominal = 0;
    const matchNominal = message.match(/(\d+(?:[\.,]\d+)?)\s*(?:(k|rb|ribu|jt|juta)\b)?/i);
    if (matchNominal) {
      let numStr = matchNominal[1];
      const unit = (matchNominal[2] || '').toLowerCase();
      if (unit === 'jt' || unit === 'juta') {
        const val = parseFloat(numStr.replace(',', '.'));
        nominal = Math.round(val * 1000000);
      } else if (unit === 'k' || unit === 'rb' || unit === 'ribu') {
        const val = parseFloat(numStr.replace(',', '.'));
        nominal = Math.round(val * 1000);
      } else {
        numStr = numStr.replace(/\./g, '').replace(',', '.');
        nominal = Math.round(parseFloat(numStr) || 0);
      }
    }

    const isIncome = /gaji|bonus|dapat transfer|penjualan|pemasukan|cair|terima uang/i.test(message);
    const tipe = isIncome ? 'pemasukan' : 'pengeluaran';

    let matchedCat = categories.find((c) => c.tipe === tipe);
    let matchedSub: any = null;

    if (!isIncome) {
      if (/makan|kopi|minum|sarapan|resto|warung|padang|kafe|snack|bakso|mie/i.test(message)) {
        matchedCat = categories.find((c) => /makan/i.test(c.nama)) || matchedCat;
      } else if (/bensin|pertamax|pertalite|ojol|gojek|grab|parkir|tol|transport/i.test(message)) {
        matchedCat = categories.find((c) => /transport/i.test(c.nama)) || matchedCat;
      } else if (/belanja|supermarket|minimarket|indomaret|alfamart|baju|sepatu/i.test(message)) {
        matchedCat = categories.find((c) => /belanja/i.test(c.nama)) || matchedCat;
      } else if (/listrik|air|pdam|wifi|pulsa|kuota|kost|kontrakan|tagihan/i.test(message)) {
        matchedCat = categories.find((c) => /tagihan/i.test(c.nama)) || matchedCat;
      }
    }

    if (matchedCat) {
      matchedSub = subcategories.find((s) => s.kategoriId === matchedCat.id);
    }

    let tanggal = todayDate || new Date().toISOString().split('T')[0];
    if (/kemarin/i.test(message)) {
      const d = new Date(tanggal);
      d.setDate(d.getDate() - 1);
      tanggal = d.toISOString().split('T')[0];
    }

    const cleanCatatan = message.slice(0, 60).trim();

    return {
      reply: `Saya mendeteksi transaksi: "${cleanCatatan}" senilai Rp ${nominal.toLocaleString('id-ID')}. Anda dapat langsung menyimpannya.`,
      transactions: [
        {
          nominal: nominal || 10000,
          tipe,
          kategoriId: matchedCat?.id || (categories[0]?.id || ''),
          subkategoriId: matchedSub?.id || null,
          tanggal,
          catatan: cleanCatatan || 'Transaksi',
        },
      ],
    };
  }

  // API Route: Chat-based natural language transaction parsing
  app.post('/api/chat-transaction', async (req, res) => {
    const { message, categories, subcategories, todayDate } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    try {
      const categoriesContext = (categories || [])
        .map((c: any) => `- ID: ${c.id}, Nama: "${c.nama}", Tipe: "${c.tipe}"`)
        .join('\n');

      const subcategoriesContext = (subcategories || [])
        .map((s: any) => `- ID: ${s.id}, IndukID: ${s.kategoriId}, Nama: "${s.nama}"`)
        .join('\n');

      const systemPrompt = `Anda adalah asisten cerdas pencatatan keuangan pribadi bernama DompetKu AI.
Tugas Anda adalah membaca pesan pengguna dalam Bahasa Indonesia sehari-hari, mendeteksi satu atau lebih transaksi keuangan (pengeluaran atau pemasukan), mengekstrak detailnya, dan mencocokkannya dengan kategori & subkategori yang tersedia.

Tanggal hari ini adalah: ${todayDate || new Date().toISOString().split('T')[0]}.

Daftar Kategori yang Tersedia:
${categoriesContext}

Daftar Subkategori yang Tersedia:
${subcategoriesContext}

Aturan Penafsiran Bahasa Indonesia:
1. Nominal:
   - "50rb", "50k", "50 ribu" = 50000
   - "1jt", "1 juta", "1.5jt" = 1000000, 1500000
   - "25.000", "25000" = 25000
   - "dua ratus ribu" = 200000
2. Waktu:
   - "hari ini", "tadi", "barusan" = tanggal hari ini (${todayDate})
   - "kemarin" = tanggal hari ini minus 1 hari
   - jika disebutkan tanggal spesifik (misal "tanggal 25", "25 september"), gunakan format YYYY-MM-DD.
3. Kategori & Subkategori:
   - Cocokkan nama atau kata kunci (contoh: "bensin", "pertamax", "ojol", "gojek", "grab" -> Transportasi, subkategori Bensin / Ojek Online).
   - "makan siang", "kopi", "sarapan", "geprek" -> Makanan, subkategori Makan Siang / Kopi & Minuman.
   - "gaji", "bonus", "transferan" -> Pemasukan.
   - Pilih kategoriId dan subkategoriId dari daftar di atas yang paling tepat. Jika tidak ada subkategori yang pas, subkategoriId boleh null.
4. Output harus berupa JSON yang valid sesuai schema berikut.`;

      const response = await callGeminiWithFallback({
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Jawaban ramah dan singkat dalam Bahasa Indonesia kepada pengguna menjelaskan transaksi yang dideteksi.',
              },
              transactions: {
                type: Type.ARRAY,
                description: 'Daftar transaksi yang berhasil diekstrak dari pesan pengguna.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nominal: {
                      type: Type.NUMBER,
                      description: 'Nominal transaksi dalam angka positif (Rupiah).',
                    },
                    tipe: {
                      type: Type.STRING,
                      description: '"pengeluaran" atau "pemasukan"',
                    },
                    kategoriId: {
                      type: Type.STRING,
                      description: 'ID kategori yang cocok dari daftar yang diberikan.',
                    },
                    subkategoriId: {
                      type: Type.STRING,
                      description: 'ID subkategori yang cocok atau null jika tidak ada.',
                    },
                    tanggal: {
                      type: Type.STRING,
                      description: 'Tanggal transaksi format YYYY-MM-DD.',
                    },
                    catatan: {
                      type: Type.STRING,
                      description: 'Keterangan/catatan singkat transaksi.',
                    },
                  },
                  required: ['nominal', 'tipe', 'kategoriId', 'tanggal', 'catatan'],
                },
              },
            },
            required: ['reply', 'transactions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('AI unavailable, using smart heuristic parser fallback:', err.message);
      const fallbackResult = fallbackParseTransaction(
        message,
        categories || [],
        subcategories || [],
        todayDate || ''
      );
      return res.json(fallbackResult);
    }
  });

  // API Route: Scan & Analyze Receipt / Nota image
  app.post('/api/analyze-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType, categories, subcategories, todayDate } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Gambar nota/struk tidak ditemukan.' });
      }

      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

      const categoriesContext = (categories || [])
        .map((c: any) => `- ID: ${c.id}, Nama: "${c.nama}", Tipe: "${c.tipe}"`)
        .join('\n');

      const subcategoriesContext = (subcategories || [])
        .map((s: any) => `- ID: ${s.id}, IndukID: ${s.kategoriId}, Nama: "${s.nama}"`)
        .join('\n');

      const systemPrompt = `Anda adalah ahli OCR dan analis struk/nota belanja terkemuka di Indonesia.
Analisis gambar struk/nota pembayaran yang diunggah pengguna, ekstrak informasi penting, dan buatkan usulan transaksi keuangan untuk aplikasi DompetKu.

Tanggal default hari ini: ${todayDate || new Date().toISOString().split('T')[0]}.

Daftar Kategori yang Tersedia:
${categoriesContext}

Daftar Subkategori yang Tersedia:
${subcategoriesContext}

Instruksi Analisis Nota:
1. Temukan nama merchant/toko (contoh: Indomaret, Alfamart, Starbucks, Shell, SPBU, Apotek Kimia Farma, dsb).
2. Temukan tanggal struk (jika tertera, formatkan YYYY-MM-DD; jika tidak jelas, gunakan tanggal default ${todayDate}).
3. Ekstrak daftar item belanja (nama barang, jumlah, harga per item, total harga item).
4. Temukan total akhir pembayaran (Grand Total / Total Bayar) dalam nominal Rupiah.
5. Cocokkan merchant dan jenis belanjaan dengan kategori dan subkategori pengeluaran yang paling relevan.
6. Berikan ringkasan analisa yang jelas dalam Bahasa Indonesia.
7. Siapkan 1 transaksi utama (atau rincian per item jika diminta) untuk langsung disimpan pengguna ke DompetKu.`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      const textPart = {
        text: 'Analisis struk ini secara mendetail: temukan nama toko, tanggal, item-item, total bayar, dan buatkan usulan transaksi keuangan.',
      };

      const response = await callGeminiWithFallback({
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchantName: {
                type: Type.STRING,
                description: 'Nama toko/merchant dari struk (contoh: Alfamart, Indomaret, dsb).',
              },
              receiptDate: {
                type: Type.STRING,
                description: 'Tanggal transaksi dari struk format YYYY-MM-DD.',
              },
              totalAmount: {
                type: Type.NUMBER,
                description: 'Total akhir pembayaran struk (Grand Total) dalam angka positif.',
              },
              items: {
                type: Type.ARRAY,
                description: 'Daftar barang belanjaan di dalam struk.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                  },
                  required: ['name', 'price'],
                },
              },
              summary: {
                type: Type.STRING,
                description: 'Ulasan singkat hasil analisa struk belanjaan dalam Bahasa Indonesia.',
              },
              suggestedTransaction: {
                type: Type.OBJECT,
                description: 'Usulan transaksi pengeluaran utama untuk disimpan.',
                properties: {
                  nominal: { type: Type.NUMBER },
                  tipe: { type: Type.STRING, description: '"pengeluaran"' },
                  kategoriId: { type: Type.STRING },
                  subkategoriId: { type: Type.STRING },
                  tanggal: { type: Type.STRING },
                  catatan: { type: Type.STRING },
                },
                required: ['nominal', 'tipe', 'kategoriId', 'tanggal', 'catatan'],
              },
            },
            required: ['merchantName', 'totalAmount', 'receiptDate', 'summary', 'suggestedTransaction'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/analyze-receipt:', err);
      res.status(500).json({
        error: 'Gagal menganalisa nota: ' + (err.message || 'Gambar tidak dapat dibaca oleh AI.'),
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      // Don't intercept API routes
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }

      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        if (!template.includes('$RefreshReg$')) {
          template = template.replace(
            '<head>',
            '<head>\n    <script>window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;</script>'
          );
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`DompetKu server running on port ${port} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
