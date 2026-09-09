export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false, videoId: null });
  }

  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Menggunakan indikator pengecekan status live YouTube
    const hasLiveIndicator = html.includes('"isLive":true') || 
                             html.includes('{"style":"LIVE"') || 
                             html.includes('isLiveContent":true');

    let extractedVideoId = null;

    if (hasLiveIndicator) {
      // Ekstraksi Video ID menggunakan regex
      const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (videoIdMatch && videoIdMatch[1]) {
        extractedVideoId = videoIdMatch[1];
      }
    }

    const isLive = hasLiveIndicator && extractedVideoId !== null;

    return res.status(200).json({
      status: 'success',
      isLive: isLive,
      videoId: isLive ? extractedVideoId : null
    });
  } catch (error) {
    return res.status(200).json({ status: 'error', isLive: false, videoId: null });
  }
}
