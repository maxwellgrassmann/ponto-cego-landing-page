export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ ok: false, error: 'Webhook não configurado' });
  }

  try {
    // Garante que o body esteja parseado como objeto
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const query = url.searchParams;

    const payload = {
      // Campos do formulário
      nome: body.nome ?? '',
      whatsapp: body.whatsapp ?? '',
      email: body.email ?? '',
      empresa: body.empresa ?? '',
      cnpj: body.cnpj ?? '',
      funcionarios: body.funcionarios ?? '',
      faturamento: body.faturamento ?? '',

      // Informações extras de rastreamento
      receivedAt: new Date().toISOString(),
      pageUrl: body.pageUrl || req.headers.referer || req.headers.referrer || '',
      userAgent: req.headers['user-agent'] || '',
      referrer: body.referrer || req.headers.referer || req.headers.referrer || '',
      utm_source: body.utm_source || query.get('utm_source') || '',
      utm_medium: body.utm_medium || query.get('utm_medium') || '',
      utm_campaign: body.utm_campaign || query.get('utm_campaign') || '',
      utm_content: body.utm_content || query.get('utm_content') || '',
      utm_term: body.utm_term || query.get('utm_term') || '',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, error: 'Falha ao enviar para o webhook' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Erro interno ao processar o lead' });
  }
}
