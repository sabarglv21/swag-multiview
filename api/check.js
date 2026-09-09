export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false, videoId: null });
  }

  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      redirect: 'manual', // KUNCI UTAMA: Matikan auto-redirect agar tidak terlempar ke video random YouTube saat offline
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    // Jika HTTP status 300-399 (Redirect), berarti channel sedang OFFLINE
    if (response.status >= 300 && response.status < 400) {
      return res.status(200).json({
        status: 'success',
        isLive: false,
        videoId: null
      });
    }

    const html = await response.text();

    // Pastikan halaman benar-benar milik channelId yang diminta
    if (!html.includes(channelId)) {
      return res.status(200).json({
        status: 'success',
        isLive: false,
        videoId: null
      });
    }

    // Ambil Video ID live milik streamer
    let extractedVideoId = null;
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch && videoIdMatch[1]) {
      extractedVideoId = videoIdMatch[1];
    }

    // Cek apakah stream hanya sebatas Jadwal / Upcoming
    const isScheduled = html.includes('"isUpcoming":true') || html.includes('"upcomingEventData"');

    // Cek indikator live
    const isCurrentlyLive = html.includes('"isLive":true') || 
                            html.includes('"isLiveNow":true') ||
                            html.includes('BADGE_STYLE_TYPE_LIVE_NOW') ||
                            html.includes('"hlsManifestUrl"');

    const finalIsLive = isCurrentlyLive && !isScheduled && extractedVideoId !== null;

    return res.status(200).json({
      status: 'success',
      isLive: finalIsLive,
      videoId: finalIsLive ? extractedVideoId : null
    });
  } catch (error) {
    return res.status(200).json({ status: 'error', isLive: false, videoId: null });
  }
}
