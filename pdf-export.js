(function (global) {
  'use strict';

  const PT_PER_MM = 72 / 25.4;
  const PDF_VERSION = '1.4';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const NUMBER_PATTERN = /[-+]?(?:(?:\d+\.\d*)|(?:\.\d+)|(?:\d+))(?:[eE][-+]?\d+)?/y;

  function finiteNumber(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError(`${label}は有限の数値で指定してください`);
    return number;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) throw new Error('PDFへ有限でない数値を書き込むことはできません');
    const normalized = Math.abs(value) < 0.0000005 ? 0 : value;
    return normalized.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }

  function copyMatrix(matrix, label) {
    if (!matrix) throw new Error(`${label}の変換行列を取得できません`);
    const result = {
      a: Number(matrix.a),
      b: Number(matrix.b),
      c: Number(matrix.c),
      d: Number(matrix.d),
      e: Number(matrix.e),
      f: Number(matrix.f)
    };
    if (!Object.values(result).every(Number.isFinite)) {
      throw new Error(`${label}の変換行列に不正な値があります`);
    }
    return result;
  }

  function multiplyMatrices(left, right) {
    return {
      a: left.a * right.a + left.c * right.b,
      b: left.b * right.a + left.d * right.b,
      c: left.a * right.c + left.c * right.d,
      d: left.b * right.c + left.d * right.d,
      e: left.a * right.e + left.c * right.f + left.e,
      f: left.b * right.e + left.d * right.f + left.f
    };
  }

  function invertMatrix(matrix) {
    const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
      throw new Error('SVGの変換行列が特異なためPDFへ変換できません');
    }
    return {
      a: matrix.d / determinant,
      b: -matrix.b / determinant,
      c: -matrix.c / determinant,
      d: matrix.a / determinant,
      e: (matrix.c * matrix.f - matrix.d * matrix.e) / determinant,
      f: (matrix.b * matrix.e - matrix.a * matrix.f) / determinant
    };
  }

  function relativeElementMatrix(svg, element) {
    const methods = ['getScreenCTM', 'getCTM'];
    let lastError = null;

    for (const method of methods) {
      if (typeof svg[method] !== 'function' || typeof element[method] !== 'function') continue;
      try {
        const rootMatrix = copyMatrix(svg[method](), `SVG (${method})`);
        const elementMatrix = copyMatrix(element[method](), `${element.localName} (${method})`);
        return multiplyMatrices(invertMatrix(rootMatrix), elementMatrix);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(`${element.localName}のSVG変換行列を取得できません`);
  }

  function getComputed(element) {
    if (typeof global.getComputedStyle !== 'function') {
      throw new Error('SVGのスタイルを取得できるブラウザー環境が必要です');
    }
    return global.getComputedStyle(element);
  }

  function presentationValue(element, name, fallback) {
    const attribute = element.getAttribute(name);
    if (attribute !== null && attribute.trim() && attribute.trim().toLowerCase() !== 'inherit') {
      return attribute.trim();
    }
    const computed = getComputed(element).getPropertyValue(name).trim();
    return computed || fallback;
  }

  function parseOpacity(value, label) {
    const opacity = Number.parseFloat(String(value));
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
      throw new Error(`${label}に対応していない値があります: ${value}`);
    }
    return opacity;
  }

  function elementIsRenderable(svg, element) {
    let node = element;
    while (node && node.nodeType === 1) {
      const computed = getComputed(node);
      if (computed.display === 'none' || computed.visibility === 'hidden' || computed.visibility === 'collapse') {
        return false;
      }
      const opacity = parseOpacity(computed.opacity || '1', `${node.localName}のopacity`);
      if (opacity === 0) return false;
      if (opacity !== 1) {
        throw new Error('半透明のSVG要素には対応していません');
      }
      if (node === svg) break;
      node = node.parentElement;
    }
    return true;
  }

  function parseColorComponent(value) {
    if (value.endsWith('%')) {
      const percentage = Number.parseFloat(value);
      if (!Number.isFinite(percentage)) throw new Error(`不正な色成分です: ${value}`);
      return Math.max(0, Math.min(1, percentage / 100));
    }
    const component = Number.parseFloat(value);
    if (!Number.isFinite(component)) throw new Error(`不正な色成分です: ${value}`);
    return Math.max(0, Math.min(1, component / 255));
  }

  function parseAlpha(value) {
    if (value === undefined) return 1;
    const alpha = value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value);
    if (!Number.isFinite(alpha)) throw new Error(`不正なアルファ値です: ${value}`);
    return Math.max(0, Math.min(1, alpha));
  }

  function parseColor(rawValue, element) {
    let value = String(rawValue).trim().toLowerCase();
    if (!value || value === 'none' || value === 'transparent') return null;
    if (value === 'currentcolor') value = getComputed(element).color.trim().toLowerCase();

    if (value === 'black') return { r: 0, g: 0, b: 0 };
    if (value === 'white') return { r: 1, g: 1, b: 1 };

    if (value[0] === '#') {
      const hex = value.slice(1);
      let red;
      let green;
      let blue;
      let alpha = 255;
      if (hex.length === 3 || hex.length === 4) {
        red = Number.parseInt(hex[0] + hex[0], 16);
        green = Number.parseInt(hex[1] + hex[1], 16);
        blue = Number.parseInt(hex[2] + hex[2], 16);
        if (hex.length === 4) alpha = Number.parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 6 || hex.length === 8) {
        red = Number.parseInt(hex.slice(0, 2), 16);
        green = Number.parseInt(hex.slice(2, 4), 16);
        blue = Number.parseInt(hex.slice(4, 6), 16);
        if (hex.length === 8) alpha = Number.parseInt(hex.slice(6, 8), 16);
      } else {
        throw new Error(`対応していない色です: ${rawValue}`);
      }
      if (![red, green, blue, alpha].every(Number.isFinite)) {
        throw new Error(`不正な色です: ${rawValue}`);
      }
      if (alpha === 0) return null;
      if (alpha !== 255) throw new Error('半透明色には対応していません');
      return { r: red / 255, g: green / 255, b: blue / 255 };
    }

    const rgbMatch = value.match(/^rgba?\((.*)\)$/);
    if (rgbMatch) {
      const parts = rgbMatch[1].replace(/\//g, ' ').trim().split(/[\s,]+/).filter(Boolean);
      if (parts.length !== 3 && parts.length !== 4) {
        throw new Error(`不正なRGB色です: ${rawValue}`);
      }
      const alpha = parseAlpha(parts[3]);
      if (alpha === 0) return null;
      if (alpha !== 1) throw new Error('半透明色には対応していません');
      return {
        r: parseColorComponent(parts[0]),
        g: parseColorComponent(parts[1]),
        b: parseColorComponent(parts[2])
      };
    }

    throw new Error(`対応していないSVG色です: ${rawValue}`);
  }

  function colorCommand(color, operator) {
    return `${formatNumber(color.r)} ${formatNumber(color.g)} ${formatNumber(color.b)} ${operator}`;
  }

  function resolvePaint(element, kind) {
    const fallback = kind === 'fill' ? 'black' : 'none';
    const color = parseColor(presentationValue(element, kind, fallback), element);
    if (!color) return null;

    const opacity = parseOpacity(
      presentationValue(element, `${kind}-opacity`, '1'),
      `${element.localName}の${kind}-opacity`
    );
    if (opacity === 0) return null;
    if (opacity !== 1) throw new Error('半透明の塗りまたは線には対応していません');
    return color;
  }

  function parseUserLength(value, label) {
    const match = String(value).trim().match(/^([-+]?(?:(?:\d+\.\d*)|(?:\.\d+)|(?:\d+))(?:[eE][-+]?\d+)?)(px)?$/i);
    if (!match) throw new Error(`${label}は単位なしのSVGユーザー単位で指定してください: ${value}`);
    const number = Number(match[1]);
    if (!Number.isFinite(number) || number < 0) throw new Error(`${label}が不正です: ${value}`);
    return number;
  }

  function strokeSettings(element, stroke) {
    if (!stroke) return '';
    const vectorEffect = presentationValue(element, 'vector-effect', 'none').toLowerCase();
    if (vectorEffect !== 'none') throw new Error(`vector-effect=${vectorEffect}には対応していません`);

    const dashArray = presentationValue(element, 'stroke-dasharray', 'none').toLowerCase();
    if (dashArray !== 'none' && dashArray !== '') throw new Error('破線のSVGストロークには対応していません');

    const width = parseUserLength(presentationValue(element, 'stroke-width', '1'), 'stroke-width');
    const lineCap = presentationValue(element, 'stroke-linecap', 'butt').toLowerCase();
    const lineJoin = presentationValue(element, 'stroke-linejoin', 'miter').toLowerCase();
    const capValues = { butt: 0, round: 1, square: 2 };
    const joinValues = { miter: 0, round: 1, bevel: 2 };
    if (!(lineCap in capValues)) throw new Error(`stroke-linecap=${lineCap}には対応していません`);
    if (!(lineJoin in joinValues)) throw new Error(`stroke-linejoin=${lineJoin}には対応していません`);

    const miterLimit = finiteNumber(presentationValue(element, 'stroke-miterlimit', '4'), 'stroke-miterlimit');
    if (miterLimit <= 0) throw new Error('stroke-miterlimitは正の数で指定してください');

    return [
      colorCommand(stroke, 'RG'),
      `${formatNumber(width)} w`,
      `${capValues[lineCap]} J`,
      `${joinValues[lineJoin]} j`,
      `${formatNumber(miterLimit)} M`
    ].join('\n');
  }

  function tokenizePath(data) {
    const tokens = [];
    let index = 0;
    while (index < data.length) {
      const character = data[index];
      if (/[\s,]/.test(character)) {
        index += 1;
        continue;
      }
      if ('MLCZ'.includes(character)) {
        tokens.push({ type: 'command', value: character });
        index += 1;
        continue;
      }
      if (/[A-Za-z]/.test(character)) {
        throw new Error(`未対応のSVGパス命令です: ${character}`);
      }
      NUMBER_PATTERN.lastIndex = index;
      const match = NUMBER_PATTERN.exec(data);
      if (!match) throw new Error(`SVGパスを解析できません（位置 ${index}）`);
      const number = Number(match[0]);
      if (!Number.isFinite(number)) throw new Error('SVGパスに有限でない数値があります');
      tokens.push({ type: 'number', value: number });
      index = NUMBER_PATTERN.lastIndex;
    }
    return tokens;
  }

  function pathDataToPdf(data) {
    const tokens = tokenizePath(data);
    if (!tokens.length) return '';

    const commands = [];
    let index = 0;
    let command = null;
    let hasSubpath = false;

    function readNumbers(count, name) {
      const numbers = [];
      for (let item = 0; item < count; item += 1) {
        const token = tokens[index];
        if (!token || token.type !== 'number') {
          throw new Error(`SVGパスの${name}命令に必要な座標がありません`);
        }
        numbers.push(token.value);
        index += 1;
      }
      return numbers;
    }

    while (index < tokens.length) {
      if (tokens[index].type === 'command') {
        command = tokens[index].value;
        index += 1;
      } else if (command === null) {
        throw new Error('SVGパスの座標より前に命令が必要です');
      }

      if (command === 'Z') {
        if (!hasSubpath) throw new Error('SVGパスのZ命令より前にM命令が必要です');
        commands.push('h');
        command = null;
        continue;
      }

      if (command === 'M') {
        const [x, y] = readNumbers(2, 'M');
        commands.push(`${formatNumber(x)} ${formatNumber(y)} m`);
        hasSubpath = true;
        command = 'L';
        continue;
      }

      if (!hasSubpath) throw new Error(`SVGパスの${command}命令より前にM命令が必要です`);

      if (command === 'L') {
        const [x, y] = readNumbers(2, 'L');
        commands.push(`${formatNumber(x)} ${formatNumber(y)} l`);
      } else if (command === 'C') {
        const values = readNumbers(6, 'C').map(formatNumber);
        commands.push(`${values.join(' ')} c`);
      } else {
        throw new Error(`未対応のSVGパス命令です: ${command}`);
      }
    }

    return commands.join('\n');
  }

  function lineCoordinate(element, property, attribute) {
    const animated = element[property];
    if (animated && animated.baseVal && Number.isFinite(animated.baseVal.value)) {
      return animated.baseVal.value;
    }
    return finiteNumber(element.getAttribute(attribute), `${element.localName}の${attribute}`);
  }

  function matrixCommand(matrix) {
    return `${formatNumber(matrix.a)} ${formatNumber(matrix.b)} ${formatNumber(matrix.c)} ${formatNumber(matrix.d)} ${formatNumber(matrix.e)} ${formatNumber(matrix.f)} cm`;
  }

  function lineElementToPdf(svg, element, rootToPdf) {
    if (!elementIsRenderable(svg, element)) return '';
    const stroke = resolvePaint(element, 'stroke');
    if (!stroke) return '';
    const localToPdf = multiplyMatrices(rootToPdf, relativeElementMatrix(svg, element));
    const x1 = lineCoordinate(element, 'x1', 'x1');
    const y1 = lineCoordinate(element, 'y1', 'y1');
    const x2 = lineCoordinate(element, 'x2', 'x2');
    const y2 = lineCoordinate(element, 'y2', 'y2');

    return [
      'q',
      matrixCommand(localToPdf),
      strokeSettings(element, stroke),
      `${formatNumber(x1)} ${formatNumber(y1)} m`,
      `${formatNumber(x2)} ${formatNumber(y2)} l`,
      'S',
      'Q'
    ].join('\n');
  }

  function pathElementToPdf(svg, element, rootToPdf) {
    if (!elementIsRenderable(svg, element)) return '';
    const data = element.getAttribute('d');
    if (!data || !data.trim()) return '';

    const fill = resolvePaint(element, 'fill');
    const stroke = resolvePaint(element, 'stroke');
    if (!fill && !stroke) return '';

    const fillRule = presentationValue(element, 'fill-rule', 'nonzero').toLowerCase();
    if (fillRule !== 'nonzero' && fillRule !== 'evenodd') {
      throw new Error(`fill-rule=${fillRule}には対応していません`);
    }

    let paintOperator;
    if (fill && stroke) paintOperator = fillRule === 'evenodd' ? 'B*' : 'B';
    else if (fill) paintOperator = fillRule === 'evenodd' ? 'f*' : 'f';
    else paintOperator = 'S';

    const localToPdf = multiplyMatrices(rootToPdf, relativeElementMatrix(svg, element));
    const commands = ['q', matrixCommand(localToPdf)];
    if (fill) commands.push(colorCommand(fill, 'rg'));
    if (stroke) commands.push(strokeSettings(element, stroke));
    commands.push(pathDataToPdf(data), paintOperator, 'Q');
    return commands.join('\n');
  }

  function pagePoint(xMm, yMm, pageHeightMm) {
    return {
      x: xMm * PT_PER_MM,
      y: (pageHeightMm - yMm) * PT_PER_MM
    };
  }

  function metadataCommands(options) {
    const { pageW, pageH, margin, showTitle, showDate } = options;
    if (!showTitle && !showDate) return '';

    const commands = [
      'q',
      colorCommand({ r: 158 / 255, g: 163 / 255, b: 158 / 255 }, 'RG'),
      `${formatNumber(0.2 * PT_PER_MM)} w`,
      '0 J'
    ];
    const lineY = margin + 5;

    if (showTitle) {
      const innerWidth = pageW - margin * 2;
      const titleWidth = Math.min(80, innerWidth * 0.45);
      const start = pagePoint((pageW - titleWidth) / 2, lineY, pageH);
      const end = pagePoint((pageW + titleWidth) / 2, lineY, pageH);
      commands.push(`${formatNumber(start.x)} ${formatNumber(start.y)} m`);
      commands.push(`${formatNumber(end.x)} ${formatNumber(end.y)} l`);
    }

    let dateText = '';
    if (showDate) {
      const lineStartMm = pageW - margin - 24;
      const start = pagePoint(lineStartMm, lineY, pageH);
      const end = pagePoint(pageW - margin, lineY, pageH);
      commands.push(`${formatNumber(start.x)} ${formatNumber(start.y)} m`);
      commands.push(`${formatNumber(end.x)} ${formatNumber(end.y)} l`);

      const baseline = pagePoint(lineStartMm - 6.6, lineY + 1.45, pageH);
      dateText = [
        'BT',
        colorCommand({ r: 114 / 255, g: 121 / 255, b: 115 / 255 }, 'rg'),
        '/F1 4.5 Tf',
        `1 0 0 1 ${formatNumber(baseline.x)} ${formatNumber(baseline.y)} Tm`,
        '(DATE) Tj',
        'ET'
      ].join('\n');
    }

    commands.push('S', 'Q');
    if (dateText) commands.push(dateText);
    return commands.join('\n');
  }

  function getViewBox(svg) {
    const animated = svg.viewBox && svg.viewBox.baseVal;
    if (animated && animated.width > 0 && animated.height > 0) {
      return { x: animated.x, y: animated.y, width: animated.width, height: animated.height };
    }
    const raw = svg.getAttribute('viewBox');
    if (!raw) throw new Error('SVGに有効なviewBoxが必要です');
    const parts = raw.trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || !parts.every(Number.isFinite) || parts[2] <= 0 || parts[3] <= 0) {
      throw new Error('SVGのviewBoxが不正です');
    }
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }

  function normalizeOptions(rawOptions) {
    if (!rawOptions || typeof rawOptions !== 'object') throw new TypeError('PDF出力設定が必要です');
    const svg = rawOptions.svg;
    if (!svg || svg.nodeType !== 1 || svg.namespaceURI !== SVG_NS || svg.localName !== 'svg') {
      throw new TypeError('svgにはSVGSVGElementを指定してください');
    }

    const pageW = finiteNumber(rawOptions.pageW, 'pageW');
    const pageH = finiteNumber(rawOptions.pageH, 'pageH');
    const margin = finiteNumber(rawOptions.margin, 'margin');
    const metaHeight = finiteNumber(rawOptions.metaHeight, 'metaHeight');
    if (pageW <= 0 || pageH <= 0) throw new RangeError('用紙寸法は正の値で指定してください');
    if (margin < 0 || metaHeight < 0) throw new RangeError('余白とメタ情報の高さは0以上で指定してください');
    if (pageW - margin * 2 <= 0 || pageH - margin * 2 - metaHeight <= 0) {
      throw new RangeError('余白またはメタ情報が用紙寸法を超えています');
    }

    let filename = String(rawOptions.filename || 'gakufu-kobo.pdf').trim() || 'gakufu-kobo.pdf';
    filename = filename.replace(/[\u0000-\u001f\\/:*?"<>|]/g, '_');
    if (!/\.pdf$/i.test(filename)) filename += '.pdf';

    return {
      svg,
      pageW,
      pageH,
      margin,
      metaHeight,
      showTitle: Boolean(rawOptions.showTitle),
      showDate: Boolean(rawOptions.showDate),
      filename
    };
  }

  function buildContent(options) {
    const viewBox = getViewBox(options.svg);
    const contentWidth = options.pageW - options.margin * 2;
    const contentHeight = options.pageH - options.margin * 2 - options.metaHeight;
    const scaleX = contentWidth / viewBox.width;
    const scaleY = contentHeight / viewBox.height;
    // The printable SVG uses physical millimetre geometry. Scaling each axis
    // independently would turn circles, clefs, and staff spacing into a stretch.
    const scaleTolerance = Math.max(Number.EPSILON, Math.abs(scaleX), Math.abs(scaleY)) * 0.000001;
    if (Math.abs(scaleX - scaleY) > scaleTolerance) {
      throw new RangeError('SVGの縦横比がPDFの描画領域と一致しないため、歪みのないPDFを作成できません');
    }
    const scale = scaleX;
    const rootToPdf = {
      a: PT_PER_MM * scale,
      b: 0,
      c: 0,
      d: -PT_PER_MM * scale,
      e: PT_PER_MM * (options.margin - scale * viewBox.x),
      f: PT_PER_MM * (options.pageH - options.margin - options.metaHeight + scale * viewBox.y)
    };

    const chunks = ['% Vector staff paper'];
    const metadata = metadataCommands(options);
    if (metadata) chunks.push(metadata);

    const elements = options.svg.querySelectorAll('line, path');
    for (const element of elements) {
      const command = element.localName === 'line'
        ? lineElementToPdf(options.svg, element, rootToPdf)
        : pathElementToPdf(options.svg, element, rootToPdf);
      if (command) chunks.push(command);
    }
    return `${chunks.join('\n')}\n`;
  }

  function concatenateBytes(parts, totalLength) {
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }

  function buildPdfBytes(content, pageW, pageH) {
    if (typeof global.TextEncoder !== 'function') {
      throw new Error('PDF生成にはTextEncoder対応ブラウザーが必要です');
    }
    const encoder = new global.TextEncoder();
    const contentLength = encoder.encode(content).length;
    const pageWidthPt = pageW * PT_PER_MM;
    const pageHeightPt = pageH * PT_PER_MM;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatNumber(pageWidthPt)} ${formatNumber(pageHeightPt)}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
      `<< /Length ${contentLength} >>\nstream\n${content}endstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
    ];

    const parts = [];
    let byteLength = 0;
    function append(value) {
      const bytes = typeof value === 'string' ? encoder.encode(value) : value;
      parts.push(bytes);
      byteLength += bytes.length;
    }

    append(new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, PDF_VERSION.charCodeAt(2), 0x0a,
      0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a
    ]));

    const offsets = [0];
    objects.forEach((object, index) => {
      offsets[index + 1] = byteLength;
      append(`${index + 1} 0 obj\n${object}\nendobj\n`);
    });

    const xrefOffset = byteLength;
    append(`xref\n0 ${objects.length + 1}\n`);
    append('0000000000 65535 f \n');
    for (let index = 1; index <= objects.length; index += 1) {
      append(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
    }
    append(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
    return concatenateBytes(parts, byteLength);
  }

  function triggerDownload(bytes, filename) {
    if (!global.URL || typeof global.URL.createObjectURL !== 'function') {
      throw new Error('このブラウザーではBlob URLを作成できません');
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = global.URL.createObjectURL(blob);
    const anchor = global.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    const parent = global.document.body || global.document.documentElement;
    if (!parent) {
      global.URL.revokeObjectURL(url);
      throw new Error('PDFダウンロード用リンクを作成できません');
    }

    try {
      parent.appendChild(anchor);
      anchor.click();
    } catch (error) {
      global.URL.revokeObjectURL(url);
      throw error;
    } finally {
      anchor.remove();
    }
    global.setTimeout(() => global.URL.revokeObjectURL(url), 1000);
    return blob;
  }

  function download(rawOptions) {
    const options = normalizeOptions(rawOptions);
    const content = buildContent(options);
    const bytes = buildPdfBytes(content, options.pageW, options.pageH);
    return triggerDownload(bytes, options.filename);
  }

  global.StaffPaperPdf = Object.freeze({ download });
})(window);
