import { clampQuantity } from './cartHelpers';
import { createZipBlob } from './zipBundle';

function safeSlug(value, fallback = 'file') {
  return (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatElement(element, index) {
  const value = element.type === 'logo' ? 'Uploaded logo' : element.value;
  const fontSegment =
    element.type === 'text' && element.font
      ? ` | font: ${element.font}`
      : '';
  return `${index + 1}. ${element.type.toUpperCase()} | value: ${value} | size: ${element.size} | x: ${Math.round(element.x)} | y: ${Math.round(element.y)}${element.color ? ` | color: ${element.color}` : ''}${fontSegment}`;
}

function describeDesign(design = { elements: [] }) {
  const elements = Array.isArray(design?.elements) ? design.elements : [];
  return {
    count: elements.length,
    lines: elements.length > 0 ? elements.map(formatElement) : ['No elements placed'],
  };
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) return null;

  const mimeType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const body = match[3] || '';
  const byteString = isBase64 ? atob(body) : decodeURIComponent(body);
  const output = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    output[i] = byteString.charCodeAt(i);
  }
  return { mimeType, bytes: output };
}

async function resolveImageAsset(source) {
  if (!source) return null;

  if (source.startsWith('data:')) {
    const parsed = parseDataUrl(source);
    if (!parsed) return null;
    return { mimeType: parsed.mimeType, bytes: parsed.bytes };
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch image asset: ${source}`);
  }
  const blob = await response.blob();
  return {
    mimeType: blob.type || 'application/octet-stream',
    bytes: new Uint8Array(await blob.arrayBuffer()),
  };
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/svg+xml') return 'svg';
  if (mimeType === 'application/json') return 'json';
  if (mimeType === 'text/plain') return 'txt';
  return 'bin';
}

export function buildOrderData(items, totals) {
  const orderId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `order-${Date.now()}`;

  const orderItems = items.map((item, index) => {
    const options = item.options || {};
    const metadata = item.metadata || {};
    const sides = options.sides || {};
    const frontDesign = describeDesign(sides.front || options.frontDesign);
    const backDesign = describeDesign(sides.back || options.backDesign);
    const leftDesign = describeDesign(sides.left || options.leftDesign);
    const rightDesign = describeDesign(sides.right || options.rightDesign);
    const quantity = clampQuantity(item.quantity);
    const orderItem = {
      lineNumber: index + 1,
      title: item.title,
      productId: item.productId,
      productKind: options.productKind || '',
      schoolName: metadata.schoolName || options.schoolName || '',
      schoolAddress: metadata.schoolAddress || options.schoolAddress || '',
      schoolMascot: metadata.schoolMascot || options.schoolMascot || '',
      divisionName: metadata.divisionName || options.divisionName || '',
      regionName: metadata.regionName || options.regionName || '',
      selectedColorName: metadata.selectedColorName || options.selectedColorName || 'Custom',
      selectedColorHex: metadata.selectedColorHex || options.selectedColorHex || options.color || '',
      materialType: options.materialType || '',
      sleeveType: options.sleeveType || '',
      neckType: options.neckType || '',
      size: options.size || '',
      quantity,
      price: Number(item.price || 0),
      subtotal: Number(item.price || 0) * quantity,
      frontDesign,
      backDesign,
      leftDesign,
      rightDesign,
    };

    Object.defineProperty(orderItem, '_imageSource', {
      value: item.previewImageURL || item.thumbnail || '',
      enumerable: false,
      configurable: true,
      writable: false,
    });

    return orderItem;
  });

  return {
    orderId,
    createdAt: new Date().toISOString(),
    createdAtLabel: new Date().toLocaleString(),
    customer: 'Name / Email (to be filled in)',
    items: orderItems,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    grandTotal: totals.grandTotal,
  };
}

export function formatOrderSummaryText(orderData) {
  const lines = [];
  lines.push(`Order ID: ${orderData.orderId}`);
  lines.push(`Created: ${orderData.createdAtLabel}`);
  lines.push(`Customer: ${orderData.customer}`);
  lines.push('');
  lines.push('Items:');

  orderData.items.forEach((item) => {
    lines.push(`${item.lineNumber}. ${item.title}`);
    lines.push(`   School: ${item.schoolName || 'N/A'} | Mascot: ${item.schoolMascot || 'N/A'}`);
    lines.push(`   Location: ${item.schoolAddress || 'N/A'}`);
    lines.push(`   Region: ${item.regionName || 'N/A'} | Division: ${item.divisionName || 'N/A'}`);
    lines.push(`   Color: ${item.selectedColorName}${item.selectedColorHex ? ` (${item.selectedColorHex})` : ''}`);
    lines.push(`   Size: ${item.size || 'N/A'} | Quantity: ${item.quantity}`);
    lines.push(`   Price: ${formatMoney(item.price)} | Subtotal: ${formatMoney(item.subtotal)}`);
    lines.push(`   Front design (${item.frontDesign.count}):`);
    item.frontDesign.lines.forEach((line) => lines.push(`      ${line}`));
    lines.push(`   Back design (${item.backDesign.count}):`);
    item.backDesign.lines.forEach((line) => lines.push(`      ${line}`));
    lines.push('');
  });

  lines.push(`Subtotal: ${formatMoney(orderData.subtotal)}`);
  lines.push(`Shipping: ${formatMoney(orderData.shipping)}`);
  lines.push(`Tax: ${formatMoney(orderData.tax)}`);
  lines.push(`Grand Total: ${formatMoney(orderData.grandTotal)}`);
  return lines.join('\n');
}

export function formatCustomerOrderSummaryText(orderData) {
  const lines = [];
  lines.push(`Order ID: ${orderData.orderId}`);
  lines.push(`Created: ${orderData.createdAtLabel}`);
  lines.push('');
  lines.push('Items:');

  orderData.items.forEach((item) => {
    lines.push(`${item.lineNumber}. ${item.title}`);
    lines.push(`   Color: ${item.selectedColorName}${item.selectedColorHex ? ` (${item.selectedColorHex})` : ''}`);
    lines.push(`   Size: ${item.size || 'N/A'} | Quantity: ${item.quantity}`);
    lines.push(`   Price: ${formatMoney(item.price)} | Subtotal: ${formatMoney(item.subtotal)}`);
    lines.push('');
  });

  lines.push(`Subtotal: ${formatMoney(orderData.subtotal)}`);
  lines.push(`Shipping: ${formatMoney(orderData.shipping)}`);
  lines.push(`Tax: ${formatMoney(orderData.tax)}`);
  lines.push(`Grand Total: ${formatMoney(orderData.grandTotal)}`);
  return lines.join('\n');
}

export function buildCheckoutEmail(orderData, zipFilename) {
  return {
    to: 'sales@idtrendz.com',
    subject: `New Order Submission - ${orderData.orderId}`,
    body: [
      'Hello Team,',
      '',
      'Please find the order package details below:',
      '',
      `Order ID: ${orderData.orderId}`,
      `Submitted: ${orderData.createdAtLabel}`,
      `Package: ${zipFilename}`,
      '',
      'Kindly review the attached package and process this order at the earliest convenience.',
      '',
      'Regards,',
      'ID Trendz Storefront',
    ].join('\n'),
  };
}

export async function createOrderZip(orderData) {
  const files = [
    {
      name: 'order-summary.txt',
      data: formatOrderSummaryText(orderData),
    },
    {
      name: 'order-details.json',
      data: JSON.stringify(orderData, null, 2),
    },
  ];

  for (const item of orderData.items) {
    const imageSource = item._imageSource || '';
    if (!imageSource) continue;
    try {
      const asset = await resolveImageAsset(imageSource);
      if (!asset) continue;
      const extension = extensionFromMime(asset.mimeType);
      files.push({
        name: `images/${String(item.lineNumber).padStart(2, '0')}-${safeSlug(item.title, 'jersey')}.${extension}`,
        data: asset.bytes,
      });
    } catch (error) {
      files.push({
        name: `images/${String(item.lineNumber).padStart(2, '0')}-${safeSlug(item.title, 'jersey')}-missing.txt`,
        data: `Image could not be bundled automatically.\nSource: ${imageSource}\nReason: ${error.message}`,
      });
    }
  }

  const zipBlob = await createZipBlob(files);
  const zipFilename = `jersey-order-${safeSlug(orderData.orderId, 'bundle')}.zip`;
  return { zipBlob, zipFilename };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareOrderByEmail(orderData) {
  const { zipBlob, zipFilename } = await createOrderZip(orderData);
  const email = buildCheckoutEmail(orderData, zipFilename);

  const shareSupported = typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof File !== 'undefined';

  if (shareSupported) {
    try {
      const zipFile = new File([zipBlob], zipFilename, { type: 'application/zip' });
      const canShareFiles =
        typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [zipFile] })
          : true;

      if (canShareFiles) {
        await navigator.share({
          title: email.subject,
          text: email.body,
          files: [zipFile],
        });
        return { method: 'share', zipFilename };
      }
    } catch (error) {
      // Continue to fallback flow when native share is unavailable or dismissed.
      console.warn('Native share failed, falling back to mailto flow.', error);
    }
  }

  downloadBlob(zipBlob, zipFilename);
  const mailtoLink = `mailto:${encodeURIComponent(email.to || 'sales@idtrendz.com')}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  window.location.href = mailtoLink;
  return { method: 'mailto', zipFilename };
}
