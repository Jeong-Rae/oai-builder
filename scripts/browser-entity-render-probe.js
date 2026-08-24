// Run this file from Chrome DevTools > Sources > Snippets.
// Reproduce the blur, then run entityRenderProbe.stop() in the Console.
(() => {
  window.entityRenderProbe?.stop();

  const maxFrames = 1_800;
  const records = [];
  let animationFrame;

  const fractionalDevicePixel = (value, dpr) =>
    Number((value * dpr - Math.round(value * dpr)).toFixed(5));

  const readRect = (element, dpr) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      deviceX: rect.x * dpr,
      deviceY: rect.y * dpr,
      deviceWidth: rect.width * dpr,
      deviceHeight: rect.height * dpr,
      fractionX: fractionalDevicePixel(rect.x, dpr),
      fractionY: fractionalDevicePixel(rect.y, dpr),
      fractionWidth: fractionalDevicePixel(rect.width, dpr),
      fractionHeight: fractionalDevicePixel(rect.height, dpr),
    };
  };

  const readStyle = (element) => {
    const style = getComputedStyle(element);
    return {
      transform: style.transform,
      filter: style.filter,
      opacity: style.opacity,
      clipPath: style.clipPath,
      imageRendering: style.imageRendering,
      willChange: style.willChange,
    };
  };

  const visibleImage = (artwork) => {
    if (artwork instanceof HTMLImageElement) return artwork;
    return [...artwork.querySelectorAll("img")].find((image) => {
      const style = getComputedStyle(image);
      return !image.hidden && style.display !== "none" && style.opacity !== "0";
    });
  };

  const readLayer = (layer, index, dpr) => {
    const artwork = [...layer.children].find(
      (element) =>
        !(element instanceof HTMLImageElement && element.dataset.direction) &&
        ![...element.classList].some((className) => className.includes("hintRing")),
    );
    const image = artwork && visibleImage(artwork);
    return {
      index,
      name:
        artwork?.getAttribute("alt") ||
        artwork?.getAttribute("aria-label") ||
        image?.src.split("/").pop() ||
        `entity-${index}`,
      controls: [...layer.querySelectorAll("img[data-direction]")]
        .map((control) => control.dataset.direction)
        .join(","),
      source: image?.currentSrc || image?.src || "",
      complete: image?.complete ?? false,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      layerRect: readRect(layer, dpr),
      artworkRect: artwork ? readRect(artwork, dpr) : undefined,
      layerStyle: readStyle(layer),
      artworkStyle: artwork ? readStyle(artwork) : undefined,
    };
  };

  const collect = (label, time = performance.now()) => {
    const dpr = devicePixelRatio;
    const record = {
      label,
      time: Number(time.toFixed(2)),
      dpr,
      entities: [...document.querySelectorAll('[class*="entityLayer"]')].map((layer, index) =>
        readLayer(layer, index, dpr),
      ),
    };
    records.push(record);
    return record;
  };

  const flatten = (record) =>
    record.entities.map((entity) => ({
      label: record.label,
      time: record.time,
      dpr: record.dpr,
      index: entity.index,
      name: entity.name,
      controls: entity.controls,
      source: entity.source,
      complete: entity.complete,
      naturalWidth: entity.naturalWidth,
      naturalHeight: entity.naturalHeight,
      x: entity.layerRect.x,
      y: entity.layerRect.y,
      width: entity.layerRect.width,
      height: entity.layerRect.height,
      fractionX: entity.layerRect.fractionX,
      fractionY: entity.layerRect.fractionY,
      fractionWidth: entity.layerRect.fractionWidth,
      fractionHeight: entity.layerRect.fractionHeight,
      transform: entity.layerStyle.transform,
      filter: entity.layerStyle.filter,
      opacity: entity.layerStyle.opacity,
      clipPath: entity.layerStyle.clipPath,
      imageRendering: entity.artworkStyle?.imageRendering,
    }));

  const changedRecords = () =>
    records.filter(
      (record, index) =>
        index === 0 ||
        JSON.stringify(record.entities) !== JSON.stringify(records[index - 1].entities),
    );

  const stop = () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    const changes = changedRecords();
    console.table(changes.flatMap(flatten));
    console.log(`Captured ${records.length} frames; ${changes.length} rendering states changed.`);
    return { records, changes };
  };

  const frame = (time) => {
    collect("frame", time);
    if (records.length >= maxFrames) {
      stop();
      return;
    }
    animationFrame = requestAnimationFrame(frame);
  };

  window.entityRenderProbe = {
    records,
    sample(label = "manual") {
      const record = collect(label);
      console.table(flatten(record));
      return record;
    },
    start() {
      if (animationFrame !== undefined) return;
      animationFrame = requestAnimationFrame(frame);
    },
    stop,
    hideControls(hidden = true) {
      document
        .querySelectorAll("img[data-direction]")
        .forEach((control) => (control.hidden = hidden));
    },
  };

  window.entityRenderProbe.start();
  console.log(
    "Entity render probe started. Reproduce the blur, then run entityRenderProbe.stop().",
  );
})();
