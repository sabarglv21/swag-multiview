export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false, videoId: null });
  }

  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // 1. Cek jadwal mendatangkan (upcoming)
    const isScheduled = html.includes('"isUpcoming":true') || html.includes('"upcomingEventData"');

    // 2. Cek indikator status live jalan (termasuk Streamlabs / OBS)
    const isCurrentlyLive = html.includes('"isLive":true') || 
                            html.includes('"isLiveDvrEnabled":true') || 
                            html.includes('{"style":"LIVE"') ||
                            html.includes('isLiveContent":true') ||
                            html.includes('hqdefault_live.jpg');

    const finalIsLive = isCurrentlyLive && !isScheduled;

    let videoId = null;

    if (finalIsLive) {
      // Ambil Video ID spesifik milik channel
      const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
      const microMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

      if (canonicalMatch && canonicalMatch[1]) {
        videoId = canonicalMatch[1];
      } else if (microMatch && microMatch[1]) {
        videoId = microMatch[1];
      }
    }

    return res.status(200).json({
      status: 'success',
      isLive: finalIsLive,
      videoId: videoId
    });

  } catch (error) {
    return res.status(200).json({ status: 'error', isLive: false, videoId: null });
  }
}
