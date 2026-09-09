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
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // 1. VALIDASI UTAMA: Pastikan channelId milik streamer ada di HTML
    // Jika tidak ada, artinya YouTube me-redirect ke video rekomendasi channel lain!
    const isAuthenticChannel = html.includes(`"channelId":"${channelId}"`) || 
                               html.includes(`"externalId":"${channelId}"`) ||
                               html.includes(`/channel/${channelId}`);

    if (!isAuthenticChannel) {
      return res.status(200).json({ status: 'success', isLive: false, videoId: null });
    }

    // 2. Filter Status Live & Upcoming (Mendatang)
    const isScheduled = html.includes('"isUpcoming":true') || html.includes('"upcomingEventData"');
    const isCurrentlyLive = html.includes('"isLive":true') || 
                            html.includes('"isLiveNow":true') || 
                            html.includes('"isLiveDvrEnabled":true') ||
                            html.includes('{"style":"LIVE"') ||
                            html.includes('BADGE_STYLE_TYPE_LIVE_NOW');

    // 3. Ekstrak Video ID asli milik streamer
    let extractedVideoId = null;
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch && videoIdMatch[1]) {
      extractedVideoId = videoIdMatch[1];
    } else {
      const canonicalMatch = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (canonicalMatch && canonicalMatch[1]) {
        extractedVideoId = canonicalMatch[1];
      }
    }

    const finalIsLive = isAuthenticChannel && isCurrentlyLive && !isScheduled && extractedVideoId !== null;

    return res.status(200).json({
      status: 'success',
      isLive: finalIsLive,
      videoId: finalIsLive ? extractedVideoId : null
    });
  } catch (error) {
    return res.status(200).json({ status: 'error', isLive: false, videoId: null });
  }
}
