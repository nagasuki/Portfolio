function extractKey(params) {
  const value = params.key;
  return Array.isArray(value) ? value.join("/") : value;
}

function parseRangeHeader(header, size) {
  if (!header) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match) {
    return null;
  }

  const [, startText, endText] = match;
  if (!startText && !endText) {
    return null;
  }

  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isFinite(suffix) || suffix <= 0) {
      return null;
    }

    const length = Math.min(suffix, size);
    return {
      offset: size - length,
      length,
      start: size - length,
      end: size - 1
    };
  }

  const start = Number(startText);
  const end = endText ? Number(endText) : size - 1;

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  const boundedEnd = Math.min(end, size - 1);
  return {
    offset: start,
    length: boundedEnd - start + 1,
    start,
    end: boundedEnd
  };
}

function mediaHeaders(object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");

  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  }

  return headers;
}

export async function onRequestGet(context) {
  const key = extractKey(context.params);
  if (!key) {
    return new Response("Media key is required", { status: 400 });
  }

  const rangeHeader = context.request.headers.get("range");

  if (rangeHeader) {
    const metadata = await context.env.MEDIA.head(key);
    if (!metadata) {
      return new Response("Media not found", { status: 404 });
    }

    const range = parseRangeHeader(rangeHeader, metadata.size);
    if (!range) {
      return new Response("Range not satisfiable", {
        status: 416,
        headers: {
          "content-range": `bytes */${metadata.size}`
        }
      });
    }

    const object = await context.env.MEDIA.get(key, {
      range: {
        offset: range.offset,
        length: range.length
      }
    });

    if (!object) {
      return new Response("Media not found", { status: 404 });
    }

    const headers = mediaHeaders(object);
    headers.set("content-length", String(range.length));
    headers.set("content-range", `bytes ${range.start}-${range.end}/${metadata.size}`);

    return new Response(object.body, {
      status: 206,
      headers
    });
  }

  const object = await context.env.MEDIA.get(key);
  if (!object) {
    return new Response("Media not found", { status: 404 });
  }

  const headers = mediaHeaders(object);
  headers.set("content-length", String(object.size));

  return new Response(object.body, { headers });
}

export async function onRequestHead(context) {
  const key = extractKey(context.params);
  if (!key) {
    return new Response(null, { status: 400 });
  }

  const object = await context.env.MEDIA.head(key);
  if (!object) {
    return new Response(null, { status: 404 });
  }

  const headers = mediaHeaders(object);
  headers.set("content-length", String(object.size));

  return new Response(null, { headers });
}
