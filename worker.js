const HLS_PRIMARY = [
    '#EXTM3U',
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="AUDIO",NAME="audio",URI="/audiomux/audio.m3u8?{{PARAMS}}"',
    '#EXT-X-STREAM-INF:BANDWIDTH=10000000,AUDIO="AUDIO"',
    '/audiomux/video.m3u8?{{PARAMS}}',
];

const HLS_VIDEO = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-TARGETDURATION:600',
    '{{SEGMENTS}}',
    '#EXT-X-ENDLIST',
];

const HLS_AUDIO = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-TARGETDURATION:600',
    '#EXTINF:1,',
    '{{URL}}',
    '#EXT-X-ENDLIST',
];

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    if (url.pathname === '/audiomux/primary.m3u8') {
        const output = HLS_PRIMARY.map(line => line.replace('?{{PARAMS}}', url.search)).join('\n');
        const response = new Response(output, { headers: { 'Content-Type': 'application/x-mpegURL' } });
        return event.respondWith(response);

    } else if (url.pathname === '/audiomux/audio.m3u8') {
        const audioUrl = decodeURIComponent(url.searchParams.get('audioUrl'));
        const output = HLS_AUDIO.map(line => line.replace('{{URL}}', audioUrl)).join('\n');
        const response = new Response(output, { headers: { 'Content-Type': 'application/x-mpegURL' } });
        return event.respondWith(response);

    } else if (url.pathname === '/audiomux/video.m3u8') {
        const videoUrl = decodeURIComponent(url.searchParams.get('videoUrl'));
        const videoDuration = Number(url.searchParams.get('videoDuration')) || 1;
        const audioDuration = Number(url.searchParams.get('audioDuration')) || 1;
        const segmentCount = Math.floor(audioDuration / videoDuration);
        const segmentExtInf = `#EXTINF:${videoDuration},\n${videoUrl}`;
        const segments = Array.from({ length: segmentCount }).map(_ => segmentExtInf).join('\n');
        const output = HLS_VIDEO.map(line => line.replace('{{SEGMENTS}}', segments)).join('\n');
        const response = new Response(output, { headers: { 'Content-Type': 'application/x-mpegURL' } });
        return event.respondWith(response);
    }
});