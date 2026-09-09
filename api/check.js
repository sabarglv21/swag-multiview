export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false });
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

    // Cek apakah murni jadwal mendatangkan/upcoming
    const isScheduled = html.includes('"isUpcoming":true') || html.includes('"upcomingEventData"');

    // Cek indikator murni live jalan
    const isCurrentlyLive = html.includes('"isLive":true') || 
                            html.includes('"isLiveDvrEnabled":true') || 
                            html.includes('{"style":"LIVE"');

    // Nyala merah HANYA KALAU live jalan DAN BUKAN jadwal murni
    const finalIsLive = isCurrentlyLive && !isScheduled;

    return res.status(200).json({
      status: 'success',
      isLive: finalIsLive
    });
  } catch (error) {
    return res.status(200).json({ status: 'error', isLive: false });
  }
}
